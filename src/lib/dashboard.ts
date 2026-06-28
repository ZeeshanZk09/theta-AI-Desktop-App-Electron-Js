import { GoogleGenAI } from "@google/genai";

export interface DashboardData {
  headlines: string[];
  weather: {
    today: string;
    tomorrow: string;
    dayAfter: string;
  };
  lastUpdated: number;
}

/**
 * Fetches latest news headlines and weather data using Gemini 2.5 Flash's web search.
 */
export const fetchDashboardData = async (
  apiKey: string,
  location: string,
  interests: string[]
): Promise<DashboardData | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.0-flash-exp as it's the latest and supports search natively
    const prompt = `
      You are a specialized dashboard assistant for "Theta AI". 
      User Location: ${location || 'Pakistan (General)'}
      User Interests: ${interests.join(', ')}

      TASK:
      1. Search for the top 5 latest news headlines relevant to the user's location and interests. 
      2. Provide the weather forecast for today, tomorrow, and the day after for the user's location.
      3. CRITICAL: Provide the headlines in Roman Urdu (Urdu written in English alphabets) to match the app's aesthetic.
      4. Weather should be concise with an appropriate emoji.

      FORMAT: Respond ONLY with a valid JSON object:
      {
        "headlines": ["Headline 1", "Headline 2", ...],
        "weather": {
          "today": "Aaj: 22°C ☀️",
          "tomorrow": "Kal: 21°C 🌦️",
          "dayAfter": "Parson: 22°C 🌤️"
        }
      }
    `;

    const result = await (ai as any).models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} } as any]
    });

    const response = result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        ...data,
        lastUpdated: Date.now()
      };
    }

    return null;
  } catch (error: any) {
    console.error("Dashboard Fetch Error:", error);
    return null;
  }
};
