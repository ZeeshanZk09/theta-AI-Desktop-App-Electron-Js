import { GoogleGenAI } from "@google/genai";

/**
 * NANO BANANA IMAGE GENERATION SERVICE
 * Implements exponential backoff and respects API-provided retry delays.
 */
export const generateImage = async (prompt: string, apiKey: string, retryCount = 0): Promise<string | null> => {
  const MAX_RETRIES = 3;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Using the specifically recommended model for Free Tier image generation
    const response = await (ai as any).models.generateContent({
      model: 'gemini-2.5-flash-image-preview-05-20',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find((part: any) => part.inlineData);

      if (imagePart && imagePart.inlineData) {
        const base64Data = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        return `data:${mimeType};base64,${base64Data}`;
      }
    }

    console.warn("Image generation completed but no binary data was returned.");
    return null;

  } catch (error: any) {
    const isRateLimit = error.message?.includes('429') ||
      error.message?.includes('RESOURCE_EXHAUSTED') ||
      error.status === 429;

    if (isRateLimit && retryCount < MAX_RETRIES) {
      // Smart Delay Calculation: Extract from error or use backoff
      let delay = Math.pow(2, retryCount) * 3000 + (Math.random() * 1000);

      // Attempt to extract suggested delay from the error message (e.g., "retry in 30s")
      const retryMatch = error.message?.match(/retry in ([\d.]+)s/i);
      if (retryMatch) {
        delay = (parseFloat(retryMatch[1]) * 1000) + 1000; // Add 1s buffer
      } else if (error.details) {
        // Some errors provide details array with RetryInfo
        const retryInfo = error.details.find((d: any) => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          delay = (parseFloat(retryInfo.retryDelay.replace('s', '')) * 1000) + 1000;
        }
      }

      console.warn(`Rate limit (429) hit. Waiting ${Math.round(delay / 1000)}s before retry ${retryCount + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateImage(prompt, apiKey, retryCount + 1);
    }

    console.error("Nano Banana Generation Error:", error);
    return null;
  }
};
