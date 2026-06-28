import { GoogleGenAI } from '@google/genai';

export interface BusinessIdea {
  id: string;
  title: string;
  summary: string;
  relevance: string;
  feasibility: number;
  trendLink?: string;
}

export interface WorldEvent {
  id: string;
  title: string;
  summary: string;
  type: 'conflict' | 'political' | 'disaster' | 'economic';
  lat: number;
  lng: number;
  sourceUrl: string;
}

export interface NewsStory {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  teaser: string;
  category: 'my-field' | 'global' | 'markets';
  url: string;
}

export interface MarketTrend {
  id: string;
  name: string;
  direction: 'up' | 'down' | 'stable';
  explanation: string;
  relevanceScore: number;
}

export interface LinkedInDraft {
  id: string;
  text: string;
  hashtags: string[];
  engagementType: 'educational' | 'opinion' | 'story';
  charCount: number;
  approved: boolean;
}

const DASHBOARD_MODEL_CANDIDATES = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-pro',
  'gemini-2.0-pro-exp',
  'gemini-2.0-flash-thinking-exp-1219',
  'gemini-2.0-flash-exp',
  'gemini-pro',
];

const LINKEDIN_MIN_DAILY_DRAFTS = 10;
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_OPERATIONS = new Set([
  'business_ideas',
  'world_intelligence',
  'linkedin_drafts',
]);
const operationCooldownUntilMs: Record<string, number> = {};

interface ModelJsonRequestOptions {
  preferSearch?: boolean;
  operation?: string;
}

const logDashboardAi = (stage: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (details) {
    console.debug(`[DashboardAI ${timestamp}] ${stage}`, details);
    return;
  }
  console.debug(`[DashboardAI ${timestamp}] ${stage}`);
};

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractBalancedJsonObjects = (text: string): string[] => {
  const candidates: string[] = [];
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let startIdx = -1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        startIdx = i;
      }
      depth += 1;
      continue;
    }

    if (char === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && startIdx >= 0) {
        candidates.push(text.slice(startIdx, i + 1));
        startIdx = -1;
      }
    }
  }

  return candidates;
};

const parseFirstJsonObject = (text: string): any => {
  const normalized = String(text || '').trim();
  logDashboardAi('parseFirstJsonObject:start', { textLength: normalized.length });
  if (!normalized) {
    throw new Error('Model response is empty.');
  }

  const direct = tryParseJson(normalized);
  if (direct) {
    logDashboardAi('parseFirstJsonObject:success', { strategy: 'direct' });
    return direct;
  }

  const fenced = [...normalized.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)];
  for (const match of fenced) {
    const parsed = tryParseJson(match[1]);
    if (parsed) {
      logDashboardAi('parseFirstJsonObject:success', { strategy: 'fenced' });
      return parsed;
    }
  }

  const objectCandidates = extractBalancedJsonObjects(normalized);
  logDashboardAi('parseFirstJsonObject:balancedCandidates', { count: objectCandidates.length });
  for (const candidate of objectCandidates) {
    const parsed = tryParseJson(candidate);
    if (parsed) {
      logDashboardAi('parseFirstJsonObject:success', { strategy: 'balanced-object' });
      return parsed;
    }
  }

  logDashboardAi('parseFirstJsonObject:failed');
  throw new Error('No valid JSON object found in model response.');
};

const toId = (prefix: string, idx: number) => `${prefix}-${Date.now()}-${idx}`;

const getAi = (apiKey: string) => new GoogleGenAI({ apiKey });

const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const isQuotaOrRateLimitError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || error?.status || '').toLowerCase();
  return (
    message.includes('quota') ||
    message.includes('exceeded your current quota') ||
    message.includes('rate') ||
    message.includes('429') ||
    message.includes('resource exhausted') ||
    code.includes('429') ||
    code.includes('resource_exhausted')
  );
};

const setOperationCooldown = (operation: string) => {
  const until = Date.now() + EIGHT_HOURS_MS;
  operationCooldownUntilMs[operation] = until;

  logDashboardAi('rateLimit:cooldownSet', {
    operation,
    cooldownHours: 8,
    untilIso: new Date(until).toISOString(),
  });

  return until;
};

const modelJsonRequest = async (
  apiKey: string,
  prompt: string,
  options: ModelJsonRequestOptions = {}
) => {
  const ai = getAi(apiKey);
  const errors: string[] = [];
  const preferSearch = options.preferSearch === true;
  const attemptModes = preferSearch ? [true, false] : [false, true];
  const operation = String(options.operation || 'unknown');
  let sawQuotaRateLimit = false;

  const cooldownUntil = operationCooldownUntilMs[operation] || 0;
  if (RATE_LIMIT_COOLDOWN_OPERATIONS.has(operation) && cooldownUntil > Date.now()) {
    const remaining = cooldownUntil - Date.now();
    logDashboardAi('rateLimit:cooldownActive', {
      operation,
      remainingMs: remaining,
      remainingLabel: formatDuration(remaining),
    });
    throw new Error(
      `Rate-limit cooldown active for ${operation}. Retry after ${formatDuration(remaining)}.`
    );
  }

  logDashboardAi('modelJsonRequest:start', {
    promptLength: prompt.length,
    modelCandidates: DASHBOARD_MODEL_CANDIDATES.length,
    preferSearch,
    operation,
  });

  for (const model of DASHBOARD_MODEL_CANDIDATES) {
    for (const withSearch of attemptModes) {
      try {
        logDashboardAi('modelJsonRequest:attempt', {
          model,
          mode: withSearch ? 'search' : 'plain',
          operation,
        });

        const result = await (ai as any).models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          ...(withSearch ? { tools: [{ googleSearch: {} } as any] } : {}),
        });

        const responseText = String(result?.response?.text?.() || '').trim();
        logDashboardAi('modelJsonRequest:attemptSuccess', {
          model,
          mode: withSearch ? 'search' : 'plain',
          responseLength: responseText.length,
          operation,
        });
        return parseFirstJsonObject(responseText);
      } catch (error: any) {
        errors.push(
          `${model}/${withSearch ? 'search' : 'plain'}: ${error?.message || 'Unknown error'}`
        );
        logDashboardAi('modelJsonRequest:attemptFailed', {
          model,
          mode: withSearch ? 'search' : 'plain',
          error: error?.message || 'Unknown error',
          operation,
        });

        // If this model is quota/rate-limited, skip its next mode and move to next model.
        if (isQuotaOrRateLimitError(error)) {
          sawQuotaRateLimit = true;
          logDashboardAi('modelJsonRequest:skipRemainingModesForModel', {
            model,
            reason: 'quota_or_rate_limit',
          });
          break;
        }
      }
    }
  }

  logDashboardAi('modelJsonRequest:allAttemptsFailed', {
    attempts: errors.length,
    sample: errors.slice(0, 3),
    sawQuotaRateLimit,
  });

  if (sawQuotaRateLimit && RATE_LIMIT_COOLDOWN_OPERATIONS.has(operation)) {
    const until = setOperationCooldown(operation);
    throw new Error(
      `Dashboard model request rate-limited. ${operation} is now on 8-hour cooldown until ${new Date(until).toLocaleString()}.`
    );
  }

  throw new Error(`Dashboard model request failed. ${errors.slice(0, 6).join(' | ')}`);
};

const buildFallbackBusinessIdeas = (profile: any, interests: string[]): BusinessIdea[] => {
  const domain = String(profile?.profession || 'your domain');
  const location = String(profile?.location || 'your local market');
  const primaryInterest = interests?.[0] || 'AI-enabled services';

  return [
    {
      id: toId('idea-fallback', 1),
      title: `${domain} Rapid Offer Sprint`,
      summary:
        'Package one high-value outcome into a 7-day offer and pre-sell it to warm contacts before building full delivery.',
      relevance:
        'Short-cycle offers are converting well in uncertain markets because buyers prefer low-commitment pilots.',
      feasibility: 4,
      trendLink: 'https://trends.google.com/',
    },
    {
      id: toId('idea-fallback', 2),
      title: `${location} Niche Service Bundle`,
      summary:
        `Create a localized service bundle around ${primaryInterest} targeting one specific customer segment with clear ROI messaging.`,
      relevance:
        'Localized positioning increases trust and closes faster than generic national messaging for early-stage offers.',
      feasibility: 3,
      trendLink: 'https://news.google.com/',
    },
    {
      id: toId('idea-fallback', 3),
      title: 'Authority Content to Client Funnel',
      summary:
        'Publish one practical insight post, then offer a diagnostic call with a repeatable template to convert attention into pipeline.',
      relevance:
        'Thought-leadership + direct CTA remains one of the highest-ROI B2B acquisition motions.',
      feasibility: 5,
      trendLink: 'https://www.linkedin.com/',
    },
  ];
};

const buildFallbackWorldIntelligence = (
  profile: any,
  interests: string[]
): { events: WorldEvent[]; stories: NewsStory[]; trends: MarketTrend[] } => {
  const focus = interests?.[0] || 'technology and business';
  const profileTag = String(profile?.profession || 'professional');
  const nowIso = new Date().toISOString();

  const events: WorldEvent[] = [
    {
      id: toId('event-fallback', 1),
      title: 'Global Markets Volatility Watch',
      summary: `Cross-region macro signals are shifting; monitor policy updates relevant to ${focus}.`,
      type: 'economic',
      lat: 51.5074,
      lng: -0.1278,
      sourceUrl: 'https://news.google.com/',
    },
    {
      id: toId('event-fallback', 2),
      title: 'Regional Supply Chain Developments',
      summary: 'Logistics and energy price movement may impact pricing and delivery timelines.',
      type: 'economic',
      lat: 25.2048,
      lng: 55.2708,
      sourceUrl: 'https://www.reuters.com/world/',
    },
    {
      id: toId('event-fallback', 3),
      title: 'Policy and Regulatory Pulse',
      summary: `Track upcoming policy changes that can affect ${profileTag} workflows and compliance needs.`,
      type: 'political',
      lat: 33.6844,
      lng: 73.0479,
      sourceUrl: 'https://www.bbc.com/news/world',
    },
  ];

  const stories: NewsStory[] = [
    {
      id: toId('story-fallback', 1),
      headline: `What This Week Means for ${focus}`,
      source: 'Curated Fallback Feed',
      timestamp: nowIso,
      teaser: 'Quick context when live AI feed is unavailable due to quota limits.',
      category: 'my-field',
      url: 'https://news.google.com/',
    },
    {
      id: toId('story-fallback', 2),
      headline: 'Top Global Headlines Snapshot',
      source: 'Curated Fallback Feed',
      timestamp: nowIso,
      teaser: 'A lightweight world summary to keep your dashboard populated.',
      category: 'global',
      url: 'https://www.aljazeera.com/news/',
    },
    {
      id: toId('story-fallback', 3),
      headline: 'Market Sentiment and Risk Outlook',
      source: 'Curated Fallback Feed',
      timestamp: nowIso,
      teaser: 'Directional market brief while AI quota resets.',
      category: 'markets',
      url: 'https://www.bloomberg.com/markets',
    },
  ];

  const trends: MarketTrend[] = [
    {
      id: toId('trend-fallback', 1),
      name: `${focus} Adoption Momentum`,
      direction: 'up',
      explanation: 'Adoption remains active, but prioritize practical ROI-focused execution.',
      relevanceScore: 4,
    },
    {
      id: toId('trend-fallback', 2),
      name: 'Capital Efficiency Preference',
      direction: 'stable',
      explanation: 'Teams are preferring low-risk pilots and measurable quick wins.',
      relevanceScore: 4,
    },
    {
      id: toId('trend-fallback', 3),
      name: 'Short-Form Authority Content',
      direction: 'up',
      explanation: 'Concise, high-signal publishing is outperforming broad generic content.',
      relevanceScore: 3,
    },
  ];

  return { events, stories, trends };
};

const buildFallbackLinkedInDrafts = (profile: any, stories: NewsStory[]): LinkedInDraft[] => {
  const profession = String(profile?.profession || 'technology leadership');
  const voice = String(
    profile?.linkedinHeadline || profile?.linkedinAbout || profile?.bio || 'practical, clear, and value-focused'
  );
  const sourceHeadline = stories?.[0]?.headline || 'AI and technology market shifts';

  const topicSeeds = [
    'AI productivity workflows',
    'agentic automation in teams',
    'B2B tech GTM execution',
    'AI governance and trust',
    'prompt engineering for business',
    'product-led growth in AI tools',
    'data quality for AI systems',
    'AI cost optimization playbook',
    'executive AI adoption roadmap',
    'future of work with AI copilots',
  ];

  const engagementCycle: LinkedInDraft['engagementType'][] = ['educational', 'opinion', 'story'];

  return topicSeeds.slice(0, LINKEDIN_MIN_DAILY_DRAFTS).map((topic, idx) => {
    const engagementType = engagementCycle[idx % engagementCycle.length];
    let text = `Practical playbook: improve ${topic} in 3 steps this week. 1) pick one workflow, 2) define baseline metric, 3) run a 7-day experiment and document impact. Built for ${profession}.`;

    if (engagementType === 'story') {
      text = `Real moment from ${profession}: while reviewing ${sourceHeadline.toLowerCase()}, one simple shift worked for us around ${topic}. Outcome first, tooling second. That's the pattern I keep seeing. Voice: ${voice.slice(0, 120)}.`;
    } else if (engagementType === 'opinion') {
      text = `Hot take for ${profession}: most teams overcomplicate ${topic}. The winning approach is still focused execution, measurable outcomes, and fast iteration. Trigger: ${sourceHeadline}.`;
    }

    const hashtags = ['#AI', '#Tech', '#Innovation', '#Leadership', '#LinkedInTips'];

    return {
      id: toId('linkedin-fallback', idx + 1),
      text,
      hashtags,
      engagementType,
      charCount: text.length,
      approved: false,
    } as LinkedInDraft;
  });
};

export const generateBusinessIdeasForToday = async (
  apiKey: string,
  profile: any,
  interests: string[]
): Promise<BusinessIdea[]> => {
  logDashboardAi('generateBusinessIdeasForToday:start', {
    profession: String(profile?.profession || ''),
    interestsCount: Array.isArray(interests) ? interests.length : 0,
  });

  const prompt = `
Generate 5 specific business ideas for TODAY with high practical relevance.

User context:
- Profession: ${profile?.profession || 'Not provided'}
- Bio: ${profile?.bio || 'Not provided'}
- Interests: ${(interests || []).join(', ') || 'Not provided'}
- Location: ${profile?.location || 'Not provided'}
- Date: ${new Date().toDateString()}

Constraints:
- Focus on AI/Tech + business execution where relevant.
- Keep each summary under 60 words.
- Prioritize realistic, near-term opportunities with clear ROI angle.
- Prefer signals from current market/news context.

Ground ideas in current trends/news using web search when available.
Return ONLY valid JSON in this shape:
{
  "ideas": [
    {
      "title": "string",
      "summary": "string",
      "relevance": "string",
      "feasibility": 1,
      "trendLink": "https://..."
    }
  ]
}
`;

  let parsed: any;
  try {
    parsed = await modelJsonRequest(apiKey, prompt, {
      preferSearch: true,
      operation: 'business_ideas',
    });
  } catch (error: any) {
    logDashboardAi('generateBusinessIdeasForToday:modelFailedUsingFallback', {
      error: error?.message || 'Unknown error',
    });
    return buildFallbackBusinessIdeas(profile, interests);
  }
  const ideas = Array.isArray(parsed?.ideas) ? parsed.ideas : [];

  logDashboardAi('generateBusinessIdeasForToday:parsed', { ideasCount: ideas.length });

  if (ideas.length === 0) {
    logDashboardAi('generateBusinessIdeasForToday:fallbackUsed');
    return buildFallbackBusinessIdeas(profile, interests);
  }

  const normalizedIdeas = ideas.slice(0, 5).map((idea: any, idx: number) => ({
    id: toId('idea', idx),
    title: String(idea?.title || `Business Idea ${idx + 1}`),
    summary: String(idea?.summary || ''),
    relevance: String(idea?.relevance || ''),
    feasibility: Math.min(5, Math.max(1, Number(idea?.feasibility || 3))),
    trendLink: typeof idea?.trendLink === 'string' ? idea.trendLink : undefined,
  }));

  logDashboardAi('generateBusinessIdeasForToday:completed', {
    returnedIdeas: normalizedIdeas.length,
  });

  return normalizedIdeas;
};

export const fetchWorldIntelligence = async (
  apiKey: string,
  profile: any,
  interests: string[]
): Promise<{ events: WorldEvent[]; stories: NewsStory[]; trends: MarketTrend[] }> => {
  logDashboardAi('fetchWorldIntelligence:start', {
    profession: String(profile?.profession || ''),
    interestsCount: Array.isArray(interests) ? interests.length : 0,
  });

  const prompt = `
Find important current global events and market context.

User field context:
- Profession: ${profile?.profession || 'Not provided'}
- Bio: ${profile?.bio || 'Not provided'}
- Interests: ${(interests || []).join(', ') || 'Not provided'}

Constraints:
- Prioritize AI, technology, macro-economy, policy, and business-critical shifts.
- Keep summaries concise (max 45 words each).
- Include credible source links.

Return ONLY valid JSON in this shape:
{
  "events": [
    {
      "title": "string",
      "summary": "string",
      "type": "conflict|political|disaster|economic",
      "lat": 0,
      "lng": 0,
      "sourceUrl": "https://..."
    }
  ],
  "stories": [
    {
      "headline": "string",
      "source": "string",
      "timestamp": "ISO string",
      "teaser": "string",
      "category": "my-field|global|markets",
      "url": "https://..."
    }
  ],
  "trends": [
    {
      "name": "string",
      "direction": "up|down|stable",
      "explanation": "string",
      "relevanceScore": 1
    }
  ]
}
`;

  let parsed: any;
  try {
    parsed = await modelJsonRequest(apiKey, prompt, {
      preferSearch: true,
      operation: 'world_intelligence',
    });
  } catch (error: any) {
    logDashboardAi('fetchWorldIntelligence:modelFailedUsingFallback', {
      error: error?.message || 'Unknown error',
    });
    return buildFallbackWorldIntelligence(profile, interests);
  }

  const rawEvents = Array.isArray(parsed?.events) ? parsed.events : [];
  const rawStories = Array.isArray(parsed?.stories) ? parsed.stories : [];
  const rawTrends = Array.isArray(parsed?.trends) ? parsed.trends : [];

  const events: WorldEvent[] = rawEvents.slice(0, 8).map((event: any, idx: number) => ({
    id: toId('event', idx),
    title: String(event?.title || `Event ${idx + 1}`),
    summary: String(event?.summary || ''),
    type: ['conflict', 'political', 'disaster', 'economic'].includes(event?.type)
      ? event.type
      : 'economic',
    lat: Number(event?.lat || 0),
    lng: Number(event?.lng || 0),
    sourceUrl: String(event?.sourceUrl || ''),
  }));

  const stories: NewsStory[] = rawStories.slice(0, 20).map((story: any, idx: number) => ({
    id: toId('story', idx),
    headline: String(story?.headline || `Story ${idx + 1}`),
    source: String(story?.source || 'Unknown'),
    timestamp: String(story?.timestamp || new Date().toISOString()),
    teaser: String(story?.teaser || ''),
    category: ['my-field', 'global', 'markets'].includes(story?.category)
      ? story.category
      : 'global',
    url: String(story?.url || ''),
  }));

  const trends: MarketTrend[] = rawTrends.slice(0, 5).map((trend: any, idx: number) => ({
    id: toId('trend', idx),
    name: String(trend?.name || `Trend ${idx + 1}`),
    direction: ['up', 'down', 'stable'].includes(trend?.direction) ? trend.direction : 'stable',
    explanation: String(trend?.explanation || ''),
    relevanceScore: Math.min(5, Math.max(1, Number(trend?.relevanceScore || 3))),
  }));

  logDashboardAi('fetchWorldIntelligence:completed', {
    events: events.length,
    stories: stories.length,
    trends: trends.length,
  });

  return { events, stories, trends };
};

export const generateLinkedInDrafts = async (
  apiKey: string,
  profile: any,
  stories: NewsStory[]
): Promise<LinkedInDraft[]> => {
  logDashboardAi('generateLinkedInDrafts:start', {
    profession: String(profile?.profession || ''),
    storiesCount: Array.isArray(stories) ? stories.length : 0,
  });

  const topStoryContext = stories
    .slice(0, 5)
    .map((story) => `- ${story.headline} (${story.source})`)
    .join('\n');

  const prompt = `
Generate exactly ${LINKEDIN_MIN_DAILY_DRAFTS} LinkedIn post drafts for today.

User context:
- Profession: ${profile?.profession || 'Not provided'}
- Bio: ${profile?.bio || 'Not provided'}
- Location: ${profile?.location || 'Not provided'}
- LinkedIn headline/about (if available): ${profile?.linkedinHeadline || profile?.linkedinAbout || 'Not provided'}

Top stories for grounding:
${topStoryContext || '- No stories available'}

Constraints:
- Topic priority: AI, Tech, product, startups, automation, leadership.
- Rotate styles: insight, question, opinion, how-to, trend commentary, personal lesson.
- Keep each draft 500-1000 characters.
- Include 4-6 relevant hashtags.
- Match a professional but human tone based on the user context.

Return ONLY valid JSON:
{
  "drafts": [
    {
      "text": "string",
      "hashtags": ["#tag"],
      "engagementType": "educational|opinion|story"
    }
  ]
}
`;

  let parsed: any;
  try {
    parsed = await modelJsonRequest(apiKey, prompt, {
      preferSearch: false,
      operation: 'linkedin_drafts',
    });
  } catch (error: any) {
    logDashboardAi('generateLinkedInDrafts:modelFailedUsingFallback', {
      error: error?.message || 'Unknown error',
    });
    return buildFallbackLinkedInDrafts(profile, stories);
  }
  const drafts = Array.isArray(parsed?.drafts) ? parsed.drafts : [];

  logDashboardAi('generateLinkedInDrafts:parsed', { draftsCount: drafts.length });

  const normalizedDrafts = drafts.slice(0, LINKEDIN_MIN_DAILY_DRAFTS).map((draft: any, idx: number) => {
    const text = String(draft?.text || '');
    return {
      id: toId('linkedin', idx),
      text,
      hashtags: Array.isArray(draft?.hashtags)
        ? draft.hashtags.map(String)
        : [],
      engagementType: ['educational', 'opinion', 'story'].includes(draft?.engagementType)
        ? draft.engagementType
        : 'educational',
      charCount: text.length,
      approved: false,
    } as LinkedInDraft;
  });

  let completedDrafts = normalizedDrafts;
  if (completedDrafts.length < LINKEDIN_MIN_DAILY_DRAFTS) {
    const fallbackDrafts = buildFallbackLinkedInDrafts(profile, stories);
    const needed = LINKEDIN_MIN_DAILY_DRAFTS - completedDrafts.length;
    completedDrafts = [...completedDrafts, ...fallbackDrafts.slice(0, needed)].slice(
      0,
      LINKEDIN_MIN_DAILY_DRAFTS
    );
    logDashboardAi('generateLinkedInDrafts:topupWithFallback', {
      modelDrafts: normalizedDrafts.length,
      needed,
      finalCount: completedDrafts.length,
    });
  }

  logDashboardAi('generateLinkedInDrafts:completed', {
    returnedDrafts: completedDrafts.length,
  });

  return completedDrafts;
};

export const generateArticleTldr = async (apiKey: string, articleText: string): Promise<string> => {
  const ai = getAi(apiKey);
  const prompt = `Summarize this article in 3 concise bullet points:\n\n${articleText.slice(0, 12000)}`;

  logDashboardAi('generateArticleTldr:start', {
    articleLength: articleText.length,
    promptLength: prompt.length,
  });

  for (const model of DASHBOARD_MODEL_CANDIDATES) {
    try {
      logDashboardAi('generateArticleTldr:attempt', { model });
      const result = await (ai as any).models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = String(result?.response?.text?.() || '').trim();
      if (text) {
        logDashboardAi('generateArticleTldr:success', { model, tldrLength: text.length });
        return text;
      }
    } catch {
      logDashboardAi('generateArticleTldr:attemptFailed', { model });
    }
  }

  logDashboardAi('generateArticleTldr:fallbackUsed');
  return 'TL;DR unavailable right now due to model response issues.';
};
