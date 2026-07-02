/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-floating-promises */
import type { Map as LeafletMap, LayerGroup } from "leaflet";

interface LeafletMarker {
  bindPopup: (html: string) => LeafletMarker;
  addTo: (layer: LayerGroup) => LeafletMarker;
  on: (event: string, callback: () => void) => LeafletMarker;
}
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lightbulb,
  RefreshCw,
  Globe,
  Newspaper,
  TrendingUp,
  Share2,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "leaflet/dist/leaflet.css";
import {
  type BusinessIdea,
  fetchWorldIntelligence,
  generateArticleTldr,
  generateBusinessIdeasForToday,
  generateLinkedInDrafts,
  type LinkedInDraft,
  type MarketTrend,
  type NewsStory,
  type WorldEvent,
} from "../../lib/dashboard-ai";

import { logger } from "@/lib/logger";
import { type UserProfile, type DashboardSettings, type DashboardData } from "@/types/index";

const electronAPI = window.electronAPI; // Wait, any is not allowed! const electronAPI = window.electronAPI;

const logDashboardModules = (stage: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (details) {
    logger.debug(`[DashboardModules ${timestamp}] ${stage}`, details);
    return;
  }
  logger.debug(`[DashboardModules ${timestamp}] ${stage}`);
};

type ModuleId =
  | "headlinesWeather"
  | "businessIdeas"
  | "newsWorld"
  | "marketTrends"
  | "linkedinQueue";

interface DashboardGridProps {
  userProfile: UserProfile;
  dashboardSettings: DashboardSettings;
  dashboardData: DashboardData | null;
  isDashboardLoading: boolean;
  onRefreshHeadlines: () => void;
  onDeepDiveIdea: (idea: BusinessIdea) => void;
}

interface DashboardModulesState {
  moduleOrder: ModuleId[];
  collapsed: Partial<Record<ModuleId, boolean>>;
  visibility: Record<ModuleId, boolean>;
  dailyTimes: {
    businessIdeas: string;
    linkedinPosts: string;
  };
  refreshIntervals: {
    worldIntelligenceHours: number;
  };
  businessIdeas: {
    date: string;
    ideas: BusinessIdea[];
  };
  worldIntelligence: {
    events: WorldEvent[];
    stories: NewsStory[];
    trends: MarketTrend[];
    generatedAt: number;
  };
  linkedinDrafts: {
    date: string;
    drafts: LinkedInDraft[];
  };
}

interface LinkedInQueueItem {
  id: string;
  text: string;
  hashtags: string[];
  scheduledAt: string;
  engagementType: "educational" | "opinion" | "story";
  status: "scheduled" | "posted" | "failed";
  createdAt: number;
}

interface LinkedInHistoryItem {
  id: string;
  text: string;
  scheduledAt: string;
  postedAt: string;
  success: boolean;
  note?: string;
}

const todayKey = () => new Date().toISOString().slice(0, 10);
const currentTimeHHMM = () => new Date().toTimeString().slice(0, 5);
const MIN_DAILY_LINKEDIN_POSTS = 10;
const MIN_AUTOSCHEDULE_GAP_MS = 5 * 60 * 1000;

const stripHtml = (html: string) =>
  html
    .replaceAll(/<script[\s\S]*?<\/script>/gi, " ")
    .replaceAll(/<style[\s\S]*?<\/style>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();

const defaultDashboardModulesState: DashboardModulesState = {
  moduleOrder: ["businessIdeas", "newsWorld", "marketTrends", "linkedinQueue"],
  collapsed: {},
  visibility: {
    headlinesWeather: false,
    businessIdeas: true,
    newsWorld: true,
    marketTrends: true,
    linkedinQueue: true,
  },
  dailyTimes: {
    businessIdeas: "08:00",
    linkedinPosts: "09:00",
  },
  refreshIntervals: {
    worldIntelligenceHours: 4,
  },
  businessIdeas: {
    date: "",
    ideas: [],
  },
  worldIntelligence: {
    events: [],
    stories: [],
    trends: [],
    generatedAt: 0,
  },
  linkedinDrafts: {
    date: "",
    drafts: [],
  },
};

const normalizeState = (raw: Record<string, unknown> | null): DashboardModulesState => {
  const rawCollapsed = raw?.collapsed && typeof raw.collapsed === "object" ? raw.collapsed : null;
  const rawVisibility =
    raw?.visibility && typeof raw.visibility === "object" ? raw.visibility : null;
  const rawDailyTimes =
    raw?.dailyTimes && typeof raw.dailyTimes === "object" ? raw.dailyTimes : null;
  const rawRefreshIntervals =
    raw?.refreshIntervals && typeof raw.refreshIntervals === "object" ? raw.refreshIntervals : null;
  const rawBusinessIdeas =
    raw?.businessIdeas && typeof raw.businessIdeas === "object" ? raw.businessIdeas : null;
  const rawWorldIntelligence =
    raw?.worldIntelligence && typeof raw.worldIntelligence === "object"
      ? raw.worldIntelligence
      : null;
  const rawLinkedInDrafts =
    raw?.linkedinDrafts && typeof raw.linkedinDrafts === "object" ? raw.linkedinDrafts : null;

  const supportedModules = new Set<ModuleId>([
    "headlinesWeather",
    "businessIdeas",
    "newsWorld",
    "marketTrends",
    "linkedinQueue",
  ]);

  const incomingOrder = Array.isArray(raw?.moduleOrder)
    ? raw?.moduleOrder?.filter((item: ModuleId) => supportedModules.has(item))
    : [];

  const mergedOrder = Array.from(
    new Set([...incomingOrder, ...defaultDashboardModulesState.moduleOrder])
  ) as ModuleId[];

  return {
    ...defaultDashboardModulesState,
    ...raw,
    moduleOrder: mergedOrder.filter((id) => id !== "headlinesWeather"),
    collapsed: {
      ...defaultDashboardModulesState.collapsed,
      ...rawCollapsed,
    },
    visibility: {
      ...defaultDashboardModulesState.visibility,
      ...rawVisibility,
      headlinesWeather: false,
    },
    dailyTimes: {
      ...defaultDashboardModulesState.dailyTimes,
      ...rawDailyTimes,
    },
    refreshIntervals: {
      ...defaultDashboardModulesState.refreshIntervals,
      ...rawRefreshIntervals,
    },
    businessIdeas: {
      ...defaultDashboardModulesState.businessIdeas,
      ...rawBusinessIdeas,
      ideas: Array.isArray((raw?.businessIdeas as { ideas?: BusinessIdea[] })?.ideas) ? (raw!.businessIdeas as { ideas: BusinessIdea[] }).ideas : [],
    },
    worldIntelligence: {
      ...defaultDashboardModulesState.worldIntelligence,
      ...rawWorldIntelligence,
      events: Array.isArray((raw?.worldIntelligence as { events?: WorldEvent[] })?.events) ? (raw!.worldIntelligence as { events: WorldEvent[] }).events : [],
      stories: Array.isArray((raw?.worldIntelligence as { stories?: NewsStory[] })?.stories) ? (raw!.worldIntelligence as { stories: NewsStory[] }).stories : [],
      trends: Array.isArray((raw?.worldIntelligence as { trends?: MarketTrend[] })?.trends) ? (raw!.worldIntelligence as { trends: MarketTrend[] }).trends : [],
    },
    linkedinDrafts: {
      ...defaultDashboardModulesState.linkedinDrafts,
      ...rawLinkedInDrafts,
      drafts:
        Array.isArray((raw?.linkedinDrafts as { drafts?: LinkedInDraft[] })?.drafts)
          ? ((raw!.linkedinDrafts as { drafts: LinkedInDraft[] }).drafts).map((draft: LinkedInDraft) => ({
              ...draft,
              approved: draft.approved === true,
            }))
          : [],
    },
  };
};

const markerColors: Record<WorldEvent["type"], string> = {
  conflict: "#ef4444",
  political: "#f97316",
  disaster: "#eab308",
  economic: "#3b82f6",
};

const trendDirectionLabel: Record<MarketTrend["direction"], string> = {
  up: "📈 Up",
  down: "📉 Down",
  stable: "➡️ Stable",
};

const DashboardGrid: React.FC<DashboardGridProps> = ({
  userProfile,
  dashboardSettings,
  dashboardData,
  isDashboardLoading,
  onRefreshHeadlines,
  onDeepDiveIdea,
}) => {
  const [state, setState] = useState<DashboardModulesState | null>(null);
  const [draggingModule, setDraggingModule] = useState<ModuleId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isRefreshingWorldIntel, setIsRefreshingWorldIntel] = useState(false);
  const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);

  const [newsFilter, setNewsFilter] = useState<"all" | "my-field" | "global" | "markets">("all");
  const [selectedStory, setSelectedStory] = useState<NewsStory | null>(null);
  const [storyReader, setStoryReader] = useState<{ loading: boolean; text: string; tldr: string }>({
    loading: false,
    text: "",
    tldr: "",
  });

  const [linkedinQueue, setLinkedinQueue] = useState<LinkedInQueueItem[]>([]);
  const [linkedinHistory, setLinkedinHistory] = useState<LinkedInHistoryItem[]>([]);
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({});

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ map: LeafletMap; L: { circleMarker: (pos: [number, number], opts: Record<string, unknown>) => LeafletMarker } } | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const saveStateTimerRef = useRef<number | null>(null);
  const saveQueueTimerRef = useRef<number | null>(null);
  const saveHistoryTimerRef = useRef<number | null>(null);
  const ideasInFlightRef = useRef(false);
  const worldIntelInFlightRef = useRef(false);
  const linkedInInFlightRef = useRef(false);
  const queueWorkerRunningRef = useRef(false);

  const updateState = useCallback((patch: Partial<DashboardModulesState>) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      logDashboardModules("load:start");
      const [loadedState, loadedQueue, loadedHistory] = await Promise.all([
        (electronAPI.loadDashboardModulesState as () => Promise<Record<string, unknown> | null>)(),
        (electronAPI.loadLinkedInQueue as () => Promise<LinkedInQueueItem[]>)(),
        (electronAPI.loadLinkedInHistory as () => Promise<LinkedInHistoryItem[]>)(),
      ]);

      if (!mounted) return;
      setState(normalizeState(loadedState));
      setLinkedinQueue(Array.isArray(loadedQueue) ? loadedQueue : []);
      setLinkedinHistory(Array.isArray(loadedHistory) ? loadedHistory : []);

      logDashboardModules("load:completed", {
        hasState: Boolean(loadedState),
        queueCount: Array.isArray(loadedQueue) ? loadedQueue.length : 0,
        historyCount: Array.isArray(loadedHistory) ? loadedHistory.length : 0,
      });
    };

    load()
      .then(() => {
        logDashboardModules("load:completed");
      })
      .catch(() => {
        logDashboardModules("load:failed");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    if (saveStateTimerRef.current) {
      window.clearTimeout(saveStateTimerRef.current);
    }

    saveStateTimerRef.current = window.setTimeout(() => {
      (electronAPI.saveDashboardModulesState as (payload: unknown) => Promise<void>)(state);
      saveStateTimerRef.current = null;
    }, 500);

    return () => {
      if (saveStateTimerRef.current) {
        window.clearTimeout(saveStateTimerRef.current);
        saveStateTimerRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    if (saveQueueTimerRef.current) {
      window.clearTimeout(saveQueueTimerRef.current);
    }

    saveQueueTimerRef.current = window.setTimeout(() => {
      (electronAPI.saveLinkedInQueue as (payload: unknown) => Promise<void>)(linkedinQueue);
      saveQueueTimerRef.current = null;
    }, 500);

    return () => {
      if (saveQueueTimerRef.current) {
        window.clearTimeout(saveQueueTimerRef.current);
        saveQueueTimerRef.current = null;
      }
    };
  }, [linkedinQueue]);

  useEffect(() => {
    if (saveHistoryTimerRef.current) {
      window.clearTimeout(saveHistoryTimerRef.current);
    }

    saveHistoryTimerRef.current = window.setTimeout(() => {
      (electronAPI.saveLinkedInHistory as (payload: unknown) => Promise<void>)(linkedinHistory);
      saveHistoryTimerRef.current = null;
    }, 500);

    return () => {
      if (saveHistoryTimerRef.current) {
        window.clearTimeout(saveHistoryTimerRef.current);
        saveHistoryTimerRef.current = null;
      }
    };
  }, [linkedinHistory]);

  const generateIdeas = useCallback(
    async (manual = false) => {
      if (!state) return;
      if (ideasInFlightRef.current) {
        logDashboardModules("generateIdeas:skippedAlreadyRunning", { manual });
        return;
      }

      ideasInFlightRef.current = true;
      logDashboardModules("generateIdeas:start", {
        manual,
        existingIdeas: state.businessIdeas.ideas.length,
      });
      setIsGeneratingIdeas(true);
      try {
        const apiKey = await electronAPI.getGeminiToken();
        if (!apiKey) {
          throw new Error("Gemini API key is missing.");
        }

        const ideas = await generateBusinessIdeasForToday(
          apiKey,
          userProfile,
          Array.isArray(dashboardSettings?.interests) ? dashboardSettings.interests : []
        );

        logDashboardModules("generateIdeas:serviceCompleted", {
          generatedIdeas: ideas.length,
        });

        updateState({
          businessIdeas: {
            date: todayKey(),
            ideas,
          },
        });

        if (manual) {
          await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
            title: "Business Ideas Updated",
            body: `${ideas.length} fresh ideas are ready for today.`,
          });
        }
        logDashboardModules("generateIdeas:completed", { manual, generatedIdeas: ideas.length });
      } catch (err) {
        const error = err as Error;

        console.error("Failed to generate business ideas:", error);
        logDashboardModules("generateIdeas:failed", {
          manual,
          error: String(error?.message || error),
        });
        await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
          title: "Business Ideas Generation Failed",
          body: String(error?.message || "Unexpected error while generating business ideas."),
        });
      } finally {
        setIsGeneratingIdeas(false);
        ideasInFlightRef.current = false;
      }
    },
    [dashboardSettings?.interests, state, updateState, userProfile]
  );

  const refreshWorldIntel = useCallback(async () => {
    if (!state) return;
    if (worldIntelInFlightRef.current) {
      logDashboardModules("refreshWorldIntel:skippedAlreadyRunning");
      return;
    }

    worldIntelInFlightRef.current = true;
    logDashboardModules("refreshWorldIntel:start", {
      existingEvents: state.worldIntelligence.events.length,
      existingStories: state.worldIntelligence.stories.length,
    });
    setIsRefreshingWorldIntel(true);
    try {
      const apiKey = await electronAPI.getGeminiToken();
      if (!apiKey) {
        throw new Error("Gemini API key is missing.");
      }

      const intel = await fetchWorldIntelligence(
        apiKey,
        userProfile,
        Array.isArray(dashboardSettings?.interests) ? dashboardSettings.interests : []
      );

      updateState({
        worldIntelligence: {
          ...intel,
          generatedAt: Date.now(),
        },
      });

      logDashboardModules("refreshWorldIntel:completed", {
        events: intel.events.length,
        stories: intel.stories.length,
        trends: intel.trends.length,
      });
    } catch (err) {
      const error = err as Error;

      console.error("Failed to refresh world intelligence:", error);
      logDashboardModules("refreshWorldIntel:failed", {
        error: String(error?.message || error),
      });
      await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
        title: "World Intelligence Refresh Failed",
        body: String(error?.message || "Unexpected error while refreshing intelligence feeds."),
      });
    } finally {
      setIsRefreshingWorldIntel(false);
      worldIntelInFlightRef.current = false;
    }
  }, [dashboardSettings?.interests, state, updateState, userProfile]);

  const generateLinkedIn = useCallback(
    async (manual = false) => {
      if (!state) return;
      if (linkedInInFlightRef.current) {
        logDashboardModules("generateLinkedIn:skippedAlreadyRunning", { manual });
        return;
      }

      linkedInInFlightRef.current = true;
      logDashboardModules("generateLinkedIn:start", {
        manual,
        storiesForGrounding: state.worldIntelligence.stories.length,
      });
      setIsGeneratingLinkedIn(true);
      try {
        const apiKey = await electronAPI.getGeminiToken();
        if (!apiKey) {
          throw new Error("Gemini API key is missing.");
        }

        const drafts = await generateLinkedInDrafts(
          apiKey,
          userProfile,
          state.worldIntelligence.stories || []
        );

        const draftsForToday = drafts.slice(0, Math.max(MIN_DAILY_LINKEDIN_POSTS, drafts.length));

        updateState({
          linkedinDrafts: {
            date: todayKey(),
            drafts: draftsForToday,
          },
        });

        const scheduledTodayCount = linkedinQueue.filter(
          (item) => item.scheduledAt.slice(0, 10) === todayKey() && item.status === "scheduled"
        ).length;
        const missingForDailyTarget = Math.max(0, MIN_DAILY_LINKEDIN_POSTS - scheduledTodayCount);
        let autoQueuedCount = 0;

        if (missingForDailyTarget > 0 && draftsForToday.length > 0) {
          const now = new Date();
          const start = new Date(now);
          const [targetHour, targetMinute] = state.dailyTimes.linkedinPosts.split(":").map(Number);

          if (!Number.isNaN(targetHour) && !Number.isNaN(targetMinute)) {
            start.setHours(targetHour, targetMinute, 0, 0);
          }

          if (start.getTime() <= now.getTime() + 60 * 1000) {
            start.setTime(now.getTime() + 2 * 60 * 1000);
          }

          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 0, 0);
          const availableMs = Math.max(
            MIN_AUTOSCHEDULE_GAP_MS * missingForDailyTarget,
            endOfDay.getTime() - start.getTime()
          );
          const gapMs = Math.max(
            MIN_AUTOSCHEDULE_GAP_MS,
            Math.floor(availableMs / Math.max(1, missingForDailyTarget))
          );

          const autoItems: LinkedInQueueItem[] = [];
          for (let idx = 0; idx < missingForDailyTarget; idx += 1) {
            const draft = draftsForToday[idx % draftsForToday.length];
            if (!draft) continue;

            const publishAt = new Date(start.getTime() + idx * gapMs).toISOString();
            autoItems.push({
              id: `queue-auto-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
              text:
                draft.hashtags.length > 0
                  ? `${draft.text}\n\n${draft.hashtags.join(" ")}`
                  : draft.text,
              hashtags: draft.hashtags,
              engagementType: draft.engagementType,
              scheduledAt: publishAt,
              status: "scheduled",
              createdAt: Date.now(),
            });
          }

          if (autoItems.length > 0) {
            autoQueuedCount = autoItems.length;
            setLinkedinQueue((prev) => [...autoItems, ...prev]);
            logDashboardModules("linkedinQueue:autoScheduledDailyTarget", {
              scheduledTodayCount,
              autoQueuedCount,
              target: MIN_DAILY_LINKEDIN_POSTS,
            });
          }
        }

        logDashboardModules("generateLinkedIn:serviceCompleted", {
          drafts: draftsForToday.length,
          autoQueuedCount,
        });

        if (manual) {
          await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
            title: "LinkedIn Drafts Ready",
            body:
              autoQueuedCount > 0
                ? `${draftsForToday.length} drafts ready. ${autoQueuedCount} posts auto-queued for today.`
                : `${draftsForToday.length} draft post(s) generated for review.`,
          });
        }
        logDashboardModules("generateLinkedIn:completed", {
          manual,
          drafts: draftsForToday.length,
          autoQueuedCount,
        });
      } catch (err) {
        const error = err as Error;

        console.error("Failed to generate LinkedIn drafts:", error);
        logDashboardModules("generateLinkedIn:failed", {
          manual,
          error: String(error?.message || error),
        });
        await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
          title: "LinkedIn Draft Generation Failed",
          body: String(error?.message || "Unexpected error while generating LinkedIn drafts."),
        });
      } finally {
        setIsGeneratingLinkedIn(false);
        linkedInInFlightRef.current = false;
      }
    },
    [linkedinQueue, state, updateState, userProfile]
  );

  useEffect(() => {
    if (!state) return;

    const shouldGenerateIdeasNow =
      state.businessIdeas.date !== todayKey() &&
      currentTimeHHMM() >= state.dailyTimes.businessIdeas;
    if (shouldGenerateIdeasNow) {
      logDashboardModules("scheduler:triggerIdeas", {
        now: currentTimeHHMM(),
        targetTime: state.dailyTimes.businessIdeas,
      });
      generateIdeas(false)
        .then(() => {
          logDashboardModules("scheduler:triggerIdeas:completed");
        })
        .catch(() => {
          logDashboardModules("scheduler:triggerIdeas:failed");
        });
    }

    const shouldGenerateLinkedInNow =
      state.linkedinDrafts.date !== todayKey() &&
      currentTimeHHMM() >= state.dailyTimes.linkedinPosts;
    if (shouldGenerateLinkedInNow) {
      logDashboardModules("scheduler:triggerLinkedIn", {
        now: currentTimeHHMM(),
        targetTime: state.dailyTimes.linkedinPosts,
      });
      generateLinkedIn(false)
        .then(() => {
          logDashboardModules("scheduler:triggerLinkedIn:completed");
        })
        .catch(() => {
          logDashboardModules("scheduler:triggerLinkedIn:failed");
        });
    }

    const refreshEveryHours = Math.max(
      1,
      Number(state.refreshIntervals.worldIntelligenceHours || 4)
    );
    const staleMs = Date.now() - Number(state.worldIntelligence.generatedAt || 0);
    if (staleMs >= refreshEveryHours * 60 * 60 * 1000) {
      logDashboardModules("scheduler:triggerWorldIntelRefresh", {
        staleMs,
        refreshEveryHours,
      });
      refreshWorldIntel()
        .then(() => {
          logDashboardModules("scheduler:triggerWorldIntelRefresh:completed");
        })
        .catch(() => {
          logDashboardModules("scheduler:triggerWorldIntelRefresh:failed");
        });
    }

    const timer = window.setInterval(() => {
      const now = currentTimeHHMM();
      const isNewIdeaDay = state.businessIdeas.date !== todayKey();
      const isNewLinkedInDay = state.linkedinDrafts.date !== todayKey();

      if (isNewIdeaDay && now >= state.dailyTimes.businessIdeas) {
        logDashboardModules("scheduler:intervalTriggerIdeas", {
          now,
          targetTime: state.dailyTimes.businessIdeas,
        });
        generateIdeas(false)
          .then(() => {
            logDashboardModules("scheduler:intervalTriggerIdeas:completed");
          })
          .catch(() => {
            logDashboardModules("scheduler:intervalTriggerIdeas:failed");
          });
      }

      if (isNewLinkedInDay && now >= state.dailyTimes.linkedinPosts) {
        logDashboardModules("scheduler:intervalTriggerLinkedIn", {
          now,
          targetTime: state.dailyTimes.linkedinPosts,
        });
        generateLinkedIn(false)
          .then(() => {
            logDashboardModules("scheduler:intervalTriggerLinkedIn:completed");
          })
          .catch(() => {
            logDashboardModules("scheduler:intervalTriggerLinkedIn:failed");
          });
      }
    }, 60000);

    logDashboardModules("scheduler:initialized", {
      ideaTime: state.dailyTimes.businessIdeas,
      linkedInTime: state.dailyTimes.linkedinPosts,
      worldIntelHours: refreshEveryHours,
    });

    return () => window.clearInterval(timer);
  }, [state, generateIdeas, generateLinkedIn, refreshWorldIntel]);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const leafletModule = await import("leaflet");
      const L = leafletModule.default;
      if (!mounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      mapRef.current = { map, L };
      markerLayerRef.current = markersLayer;
    };

    initMap()
      .then(() => {
        logDashboardModules("initMap:completed");
      })
      .catch(() => {
        logDashboardModules("initMap:failed");
      });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!state || !mapRef.current || !markerLayerRef.current) return;

    const { L } = mapRef.current;
    markerLayerRef.current.clearLayers();

    state.worldIntelligence.events.forEach((event) => {
      const marker = L.circleMarker([event.lat, event.lng], {
        radius: 7,
        color: markerColors[event.type],
        weight: 2,
        fillColor: markerColors[event.type],
        fillOpacity: 0.8,
      });

      marker.bindPopup(`<strong>${event.title}</strong><br/>${event.summary}`);
      marker.on("click", () => {
        const linked = state.worldIntelligence.stories.find(
          (story) => story.url === event.sourceUrl
        );
        if (linked) {
          setSelectedStory(linked);
        }
      });

      marker.addTo(markerLayerRef.current!);
    });
  }, [state]);

  const filteredStories = useMemo(() => {
    if (!state) return [];
    if (newsFilter === "all") return state.worldIntelligence.stories;
    return state.worldIntelligence.stories.filter((story) => story.category === newsFilter);
  }, [newsFilter, state]);

  const loadStoryReader = useCallback(async (story: NewsStory) => {
    logDashboardModules("storyReader:start", {
      storyId: story.id,
      source: story.source,
      url: story.url,
    });

    setSelectedStory(story);
    setStoryReader({ loading: true, text: "", tldr: "" });

    try {
      const response = await (
        electronAPI.httpFetch as (payload: { url: string; method?: string }) => Promise<{ data: unknown }>
      )({
        method: "GET",
        url: story.url,
      });

      const raw =
        typeof response?.data === "string" ? response.data : JSON.stringify(response?.data || {});
      const text = stripHtml(raw).slice(0, 24000);

      const apiKey = await electronAPI.getGeminiToken();
      const tldr = apiKey ? await generateArticleTldr(apiKey, text) : "TL;DR unavailable.";

      setStoryReader({ loading: false, text, tldr });
      logDashboardModules("storyReader:completed", {
        storyId: story.id,
        textLength: text.length,
        tldrLength: tldr.length,
      });
    } catch (error) {
      logDashboardModules("storyReader:failed", {
        storyId: story.id,
        error: error instanceof Error ? error.message : String(error),
      });
      setStoryReader({
        loading: false,
        text: "Unable to load article content from source URL.",
        tldr: "TL;DR unavailable.",
      });
    }
  }, []);

  const updateDraftText = (draftId: string, value: string) => {
    if (!state) return;
    const updatedDrafts = state.linkedinDrafts.drafts.map((draft) =>
      draft.id === draftId ? { ...draft, text: value, charCount: value.length } : draft
    );

    updateState({
      linkedinDrafts: {
        ...state.linkedinDrafts,
        drafts: updatedDrafts,
      },
    });
  };

  const discardDraft = (draftId: string) => {
    if (!state) return;
    updateState({
      linkedinDrafts: {
        ...state.linkedinDrafts,
        drafts: state.linkedinDrafts.drafts.filter((draft) => draft.id !== draftId),
      },
    });
  };

  const addScheduledPost = (draft: LinkedInDraft) => {
    if (!draft.approved) {
      logDashboardModules("linkedinQueue:addBlocked", {
        reason: "draft_not_approved",
        draftId: draft.id,
      });
      (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
        title: "LinkedIn Queue",
        body: "Approve this draft before scheduling it.",
      });
      return;
    }

    const scheduleAt = scheduleInputs[draft.id];
    if (!scheduleAt) {
      logDashboardModules("linkedinQueue:addBlocked", {
        reason: "schedule_missing",
        draftId: draft.id,
      });
      return;
    }

    const scheduledAt = new Date(scheduleAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      logDashboardModules("linkedinQueue:addBlocked", {
        reason: "schedule_invalid",
        draftId: draft.id,
        scheduleAt,
      });
      return;
    }

    const queueItem: LinkedInQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: draft.hashtags.length > 0 ? `${draft.text}\n\n${draft.hashtags.join(" ")}` : draft.text,
      hashtags: draft.hashtags,
      engagementType: draft.engagementType,
      scheduledAt: scheduledAt.toISOString(),
      status: "scheduled",
      createdAt: Date.now(),
    };

    setLinkedinQueue((prev) => [queueItem, ...prev]);
    logDashboardModules("linkedinQueue:scheduled", {
      draftId: draft.id,
      queueId: queueItem.id,
      scheduledAt: queueItem.scheduledAt,
    });
  };

  const toggleDraftApproval = (draftId: string) => {
    if (!state) return;

    updateState({
      linkedinDrafts: {
        ...state.linkedinDrafts,
        drafts: state.linkedinDrafts.drafts.map((draft) =>
          draft.id === draftId ? { ...draft, approved: !draft.approved } : draft
        ),
      },
    });
  };

  const runLinkedInAutomation = useCallback(async (item: LinkedInQueueItem) => {
    logDashboardModules("linkedinAutomation:start", {
      queueId: item.id,
      scheduledAt: item.scheduledAt,
    });

    const approval = await (
      electronAPI.requestActionApproval as (payload: unknown) => Promise<boolean>
    )({
      action: "LinkedIn Post Automation",
      detail: `Publish scheduled post (${item.text.slice(0, 140)}...)`,
      source: "linkedin-queue",
      rawPayload: {
        scheduledAt: item.scheduledAt,
        postText: item.text,
        steps: ["Open LinkedIn", "Paste content", "Submit post"],
      },
    });

    if (!approval) {
      logDashboardModules("linkedinAutomation:approvalDenied", { queueId: item.id });
      return { success: false, note: "User rejected publishing approval." };
    }

    logDashboardModules("linkedinAutomation:approvalGranted", { queueId: item.id });

    try {
      await electronAPI.openSystemItem({ target: "https://www.linkedin.com/feed/" });
      await new Promise((resolve) => setTimeout(resolve, 7000));
      await (electronAPI.keyboardType as (payload: unknown) => Promise<void>)({
        text: item.text,
        pressEnter: false,
      });
      await new Promise((resolve) => setTimeout(resolve, 800));
      await (electronAPI.keyboardPress as (payload: unknown) => Promise<void>)({
        key: "ctrl+enter",
      });

      await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
        title: "LinkedIn Publisher",
        body: "Scheduled post automation executed successfully.",
      });

      logDashboardModules("linkedinAutomation:completed", { queueId: item.id });
      return { success: true };
    } catch (err) {
      const error = err as Error;

      logDashboardModules("linkedinAutomation:failed", {
        queueId: item.id,
        error: String(error?.message || error),
      });
      try {
        await (electronAPI.writeClipboard as (payload: unknown) => Promise<void>)({
          text: item.text,
        });
        await (electronAPI.sendNotification as (payload: unknown) => Promise<void>)({
          title: "LinkedIn Publisher Fallback",
          body: "Automation failed. Post copied to clipboard, please paste manually.",
        });
        logDashboardModules("linkedinAutomation:fallbackClipboardApplied", { queueId: item.id });
      } catch {
        // ignored
      }

      return {
        success: false,
        note: error?.message || "Automation failed. Copied text to clipboard as fallback.",
      };
    }
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      if (queueWorkerRunningRef.current) {
        return;
      }

      queueWorkerRunningRef.current = true;

      try {
        const dueItems = linkedinQueue.filter(
          (item) =>
            item.status === "scheduled" && new Date(item.scheduledAt).getTime() <= Date.now()
        );

        if (dueItems.length > 0) {
          logDashboardModules("linkedinQueue:dueItemsDetected", { dueCount: dueItems.length });
        }

        for (const item of dueItems) {
          const result = await runLinkedInAutomation(item);

          setLinkedinQueue((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, status: result.success ? "posted" : "failed" }
                : entry
            )
          );

          setLinkedinHistory((prev) => [
            {
              id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: item.text,
              scheduledAt: item.scheduledAt,
              postedAt: new Date().toISOString(),
              success: result.success,
              note: result.note,
            },
            ...prev,
          ]);

          logDashboardModules("linkedinQueue:itemProcessed", {
            queueId: item.id,
            success: result.success,
            note: result.note || "",
          });
        }
      } finally {
        queueWorkerRunningRef.current = false;
      }
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [linkedinQueue, runLinkedInAutomation]);

  const handleDragDrop = (target: ModuleId) => {
    if (!state || !draggingModule || draggingModule === target) return;

    const current = [...state.moduleOrder];
    const from = current.indexOf(draggingModule);
    const to = current.indexOf(target);
    if (from < 0 || to < 0) return;

    current.splice(from, 1);
    current.splice(to, 0, draggingModule);

    updateState({ moduleOrder: current });
    setDraggingModule(null);
  };

  const toggleCollapse = (id: ModuleId) => {
    if (!state) return;
    updateState({
      collapsed: {
        ...state.collapsed,
        [id]: !state.collapsed[id],
      },
    });
  };

  const toggleVisibility = (id: ModuleId) => {
    if (!state) return;
    updateState({
      visibility: {
        ...state.visibility,
        [id]: !state.visibility[id],
      },
    });
  };

  if (!state) {
    return (
      <div className="w-full h-full flex items-center justify-center text-j-text-secondary">
        Loading dashboard modules...
      </div>
    );
  }

  const visibleModuleOrder = state.moduleOrder.filter(
    (moduleId) => moduleId !== "headlinesWeather" && state.visibility[moduleId]
  );

  const renderModuleBody = (moduleId: ModuleId) => {
    if (state.collapsed[moduleId]) {
      return null;
    }

    if (moduleId === "headlinesWeather") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-j-text-muted">Pinned Headlines + Weather</span>
            <button
              onClick={onRefreshHeadlines}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-j-cyan transition-colors"
            >
              <RefreshCw size={12} className={isDashboardLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {Array.isArray(dashboardData?.headlines) &&
          dashboardData?.headlines &&
          dashboardData.headlines.length > 0 ? (
            <ul className="space-y-2 text-sm text-j-text-primary">
              {dashboardData.headlines.map((headline: string, idx: number) => (
                <li key={`${headline}-${idx}`} className="border-b border-white/5 pb-2">
                  {headline}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-j-text-muted">No headlines yet.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 p-2 text-xs text-j-text-secondary">
              {dashboardData?.weather?.today || "Today weather unavailable"}
            </div>
            <div className="rounded-xl border border-white/10 p-2 text-xs text-j-text-secondary">
              {dashboardData?.weather?.tomorrow || "Tomorrow weather unavailable"}
            </div>
            <div className="rounded-xl border border-white/10 p-2 text-xs text-j-text-secondary">
              {dashboardData?.weather?.dayAfter || "Day-after weather unavailable"}
            </div>
          </div>
        </div>
      );
    }

    if (moduleId === "businessIdeas") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-j-text-muted">
              Daily generation at {state.dailyTimes.businessIdeas}
            </span>
            <button
              onClick={() => generateIdeas(true)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-j-cyan transition-colors"
            >
              <RefreshCw size={12} className={isGeneratingIdeas ? "animate-spin" : ""} />
              Regenerate
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {state.businessIdeas.ideas.length === 0 ? (
              <p className="text-sm text-j-text-muted">No ideas generated yet for today.</p>
            ) : (
              state.businessIdeas.ideas.map((idea) => (
                <details
                  key={idea.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-white">
                    {idea.title}
                  </summary>
                  <p className="text-xs text-j-text-secondary mt-2">{idea.summary}</p>
                  <p className="text-xs text-j-text-muted mt-2">
                    Why relevant today: {idea.relevance}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-j-cyan">Feasibility: {idea.feasibility}/5</span>
                    <div className="flex items-center gap-2">
                      {idea.trendLink && (
                        <a
                          href={idea.trendLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-j-text-secondary hover:text-j-cyan"
                        >
                          Trend Link
                        </a>
                      )}
                      <button
                        onClick={() => onDeepDiveIdea(idea)}
                        className="text-xs px-2 py-1 rounded-md bg-j-cyan/15 border border-j-cyan/25 text-j-cyan hover:bg-j-cyan hover:text-black transition-colors"
                      >
                        Deep Dive
                      </button>
                    </div>
                  </div>
                </details>
              ))
            )}
          </div>
        </div>
      );
    }

    if (moduleId === "newsWorld") {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-j-text-muted">Pinned Headlines + Weather</span>
              <button
                onClick={onRefreshHeadlines}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-j-cyan transition-colors"
              >
                <RefreshCw size={12} className={isDashboardLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {Array.isArray(dashboardData?.headlines) &&
            dashboardData?.headlines &&
            dashboardData.headlines.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-j-text-primary mt-2">
                {dashboardData.headlines.slice(0, 5).map((headline: string, idx: number) => (
                  <li key={`${headline}-${idx}`} className="border-b border-white/5 pb-1.5">
                    {headline}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-j-text-muted mt-2">No headlines yet.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="rounded-xl border border-white/10 p-2 text-[11px] text-j-text-secondary">
                {dashboardData?.weather?.today || "Today weather unavailable"}
              </div>
              <div className="rounded-xl border border-white/10 p-2 text-[11px] text-j-text-secondary">
                {dashboardData?.weather?.tomorrow || "Tomorrow weather unavailable"}
              </div>
              <div className="rounded-xl border border-white/10 p-2 text-[11px] text-j-text-secondary">
                {dashboardData?.weather?.dayAfter || "Day-after weather unavailable"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-j-text-muted">Interactive World Intelligence Map</span>
            <button
              onClick={refreshWorldIntel}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-j-cyan transition-colors"
            >
              <RefreshCw size={12} className={isRefreshingWorldIntel ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="h-56 rounded-xl overflow-hidden border border-white/10">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["all", "my-field", "global", "markets"].map((filter) => (
              <button
                key={filter}
                onClick={() => setNewsFilter(filter as "all" | "my-field" | "global" | "markets")}
                className={`px-2 py-1 text-[11px] rounded-md border ${
                  newsFilter === filter
                    ? "border-j-cyan/40 text-j-cyan bg-j-cyan/10"
                    : "border-white/10 text-j-text-muted"
                }`}
              >
                {filter === "my-field"
                  ? "My Field"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredStories.map((story) => (
              <button
                key={story.id}
                onClick={() => loadStoryReader(story)}
                className="w-full text-left rounded-xl border border-white/10 bg-black/20 p-3 hover:border-j-cyan/30 transition-colors"
              >
                <h4 className="text-sm font-semibold text-white">{story.headline}</h4>
                <p className="text-xs text-j-text-secondary mt-1">{story.teaser}</p>
                <div className="flex items-center justify-between text-[11px] text-j-text-muted mt-2">
                  <span>{story.source}</span>
                  <span>{new Date(story.timestamp).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (moduleId === "marketTrends") {
      return (
        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {state.worldIntelligence.trends.length === 0 ? (
            <p className="text-sm text-j-text-muted">No trend data yet.</p>
          ) : (
            state.worldIntelligence.trends.map((trend) => (
              <div key={trend.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm text-white font-semibold">{trend.name}</h4>
                  <span className="text-xs text-j-cyan">Relevance {trend.relevanceScore}/5</span>
                </div>
                <p className="text-xs text-j-text-secondary mt-1">{trend.explanation}</p>
                <div className="text-xs mt-2">{trendDirectionLabel[trend.direction]}</div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-j-text-muted">
            Daily generation at {state.dailyTimes.linkedinPosts}
          </span>
          <button
            onClick={() => generateLinkedIn(true)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-j-cyan transition-colors"
          >
            <RefreshCw size={12} className={isGeneratingLinkedIn ? "animate-spin" : ""} />
            Generate Drafts
          </button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          {state.linkedinDrafts.drafts.map((draft) => (
            <div key={draft.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <textarea
                value={draft.text}
                onChange={(event) => updateDraftText(draft.id, event.target.value)}
                className="w-full min-h-[90px] rounded-lg bg-white/5 border border-white/10 p-2 text-xs text-j-text-primary"
              />
              <div className="flex items-center justify-between mt-2 text-[11px] text-j-text-muted">
                <span>{draft.engagementType}</span>
                <span>{draft.charCount} chars</span>
              </div>
              <div className="text-[11px] text-j-cyan mt-1">{draft.hashtags.join(" ")}</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => toggleDraftApproval(draft.id)}
                  className={`rounded-lg border text-[11px] px-2 py-1 ${
                    draft.approved
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 text-j-text-muted"
                  }`}
                >
                  {draft.approved ? "Approved" : "Approve"}
                </button>
                <input
                  type="datetime-local"
                  value={scheduleInputs[draft.id] || ""}
                  onChange={(event) =>
                    setScheduleInputs((prev) => ({ ...prev, [draft.id]: event.target.value }))
                  }
                  className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] text-j-text-secondary"
                />
                <button
                  onClick={() => addScheduledPost(draft)}
                  className={`rounded-lg border text-[11px] px-2 py-1 ${
                    draft.approved
                      ? "border-j-cyan/30 bg-j-cyan/10 text-j-cyan"
                      : "border-white/10 bg-white/5 text-j-text-muted"
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => discardDraft(draft.id)}
                  className="rounded-lg border border-white/10 text-j-text-muted text-[11px] px-2 py-1"
                >
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3">
          <h4 className="text-xs uppercase tracking-wider text-j-text-muted mb-2">
            Schedule Queue
          </h4>
          <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {linkedinQueue.length === 0 ? (
              <p className="text-xs text-j-text-muted">No scheduled posts yet.</p>
            ) : (
              linkedinQueue.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 p-2 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-j-text-primary truncate">{entry.text.slice(0, 70)}</span>
                    <span className="text-j-cyan">{entry.status}</span>
                  </div>
                  <p className="text-j-text-muted mt-1">
                    {new Date(entry.scheduledAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <h4 className="text-xs uppercase tracking-wider text-j-text-muted mb-2">Post History</h4>
          <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {linkedinHistory.length === 0 ? (
              <p className="text-xs text-j-text-muted">No history yet.</p>
            ) : (
              linkedinHistory.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 p-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-j-text-primary truncate">{entry.text.slice(0, 70)}</span>
                    <span className={entry.success ? "text-emerald-300" : "text-rose-300"}>
                      {entry.success ? "Posted" : "Failed"}
                    </span>
                  </div>
                  <p className="text-j-text-muted mt-1">
                    {new Date(entry.postedAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const moduleMeta: Record<ModuleId, { title: string; icon: React.ReactNode }> = {
    headlinesWeather: {
      title: "Headlines + Weather",
      icon: <Newspaper size={15} />,
    },
    businessIdeas: {
      title: "Today's Business Ideas",
      icon: <Lightbulb size={15} />,
    },
    newsWorld: {
      title: "News & World Intelligence",
      icon: <Globe size={15} />,
    },
    marketTrends: {
      title: "Market Trends Panel",
      icon: <TrendingUp size={15} />,
    },
    linkedinQueue: {
      title: "LinkedIn Post Queue",
      icon: <Share2 size={15} />,
    },
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Modular Dashboard</h2>
          <p className="text-sm text-j-text-muted">Drag cards to reorder, collapse when needed.</p>
        </div>

        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-sm text-j-text-secondary hover:text-j-cyan transition-colors"
        >
          <Settings size={14} />
          Dashboard Settings
        </button>
      </div>

      {settingsOpen && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="text-sm uppercase tracking-wider text-j-text-muted mb-2">
              Module Visibility
            </h4>
            <div className="space-y-2">
              {(Object.keys(state.visibility) as ModuleId[]).map((id) =>
                id === "headlinesWeather" ? null : (
                  <label key={id} className="flex items-center justify-between text-sm">
                    <span>{moduleMeta[id].title}</span>
                    <button
                      onClick={() => toggleVisibility(id)}
                      className="text-j-cyan hover:brightness-110"
                    >
                      {state.visibility[id] ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </label>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-wider text-j-text-muted mb-2">
              Daily Auto-Generation
            </h4>
            <div className="space-y-2">
              <label className="text-sm flex items-center justify-between">
                <span>Business Ideas</span>
                <input
                  type="time"
                  value={state.dailyTimes.businessIdeas}
                  onChange={(event) =>
                    updateState({
                      dailyTimes: { ...state.dailyTimes, businessIdeas: event.target.value },
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                />
              </label>

              <label className="text-sm flex items-center justify-between">
                <span>LinkedIn Drafts</span>
                <input
                  type="time"
                  value={state.dailyTimes.linkedinPosts}
                  onChange={(event) =>
                    updateState({
                      dailyTimes: { ...state.dailyTimes, linkedinPosts: event.target.value },
                    })
                  }
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                />
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-wider text-j-text-muted mb-2">
              Refresh Intervals
            </h4>
            <label className="text-sm flex items-center justify-between">
              <span>World Intel (hours)</span>
              <input
                type="number"
                min={1}
                max={24}
                value={state.refreshIntervals.worldIntelligenceHours}
                onChange={(event) =>
                  updateState({
                    refreshIntervals: {
                      ...state.refreshIntervals,
                      worldIntelligenceHours: Math.max(1, Number(event.target.value || 4)),
                    },
                  })
                }
                className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 pb-4">
        {visibleModuleOrder.map((moduleId) => (
          <div
            key={moduleId}
            draggable
            onDragStart={() => setDraggingModule(moduleId)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDragDrop(moduleId)}
            className="rounded-2xl border border-white/10 bg-j-panel/70 backdrop-blur-xl p-4 flex flex-col gap-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-j-text-primary">
                <span className="text-j-cyan">{moduleMeta[moduleId].icon}</span>
                <h3 className="text-base font-semibold">{moduleMeta[moduleId].title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCollapse(moduleId)}
                  className="text-j-text-muted hover:text-j-cyan transition-colors"
                >
                  {state.collapsed[moduleId] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <button className="text-j-text-muted cursor-grab">
                  <GripVertical size={14} />
                </button>
              </div>
            </div>

            {renderModuleBody(moduleId)}
          </div>
        ))}
      </div>

      {selectedStory && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close story reader"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedStory(null)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-j-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">{selectedStory.headline}</h3>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-j-text-muted hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            {storyReader.loading ? (
              <p className="text-sm text-j-text-muted">Loading article and generating TL;DR...</p>
            ) : (
              <>
                <div className="rounded-xl border border-j-cyan/25 bg-j-cyan/5 p-3 mb-3">
                  <h4 className="text-sm font-semibold text-j-cyan mb-1">AI TL;DR</h4>
                  <p className="text-sm text-j-text-secondary whitespace-pre-wrap">
                    {storyReader.tldr}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-sm text-j-text-primary whitespace-pre-wrap leading-relaxed">
                    {storyReader.text}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;
