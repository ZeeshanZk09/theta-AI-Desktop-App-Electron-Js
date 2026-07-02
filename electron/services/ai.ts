/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "node:fs";
import * as path from "node:path";

import { app } from "electron";
import * as keytar from "keytar";

import { logger } from "../utils/logger";

export const GEMINI_TOKEN_SERVICE_NAME = "theta-ai-gemini-token";
export const GEMINI_TOKEN_ACCOUNT_NAME = "default-user";

export function getLegacySecretKeyPath() {
  return path.join(app.getPath("userData"), "secret_key.json");
}

export function getGeminiTokenFallbackPath() {
  return path.join(app.getPath("userData"), "gemini_token_fallback.txt");
}

export function readGeminiTokenFallback(): string | null {
  try {
    const fallbackPath = getGeminiTokenFallbackPath();
    if (!fs.existsSync(fallbackPath)) return null;

    const token = fs.readFileSync(fallbackPath, "utf8").trim();
    return token || null;
  } catch {
    return null;
  }
}

export function writeGeminiTokenFallback(token: string): boolean {
  try {
    if (typeof token !== "string" || !token.trim()) return false;
    fs.writeFileSync(getGeminiTokenFallbackPath(), token.trim(), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function migrateAndDeleteLegacySecretKey() {
  try {
    const legacyPath = getLegacySecretKeyPath();
    if (!fs.existsSync(legacyPath)) return;

    const rawData = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
    const legacyApiKey = rawData?.apiKey;
    
    if (typeof legacyApiKey === "string" && legacyApiKey.trim()) {
      try {
        await keytar.setPassword(
          GEMINI_TOKEN_SERVICE_NAME,
          GEMINI_TOKEN_ACCOUNT_NAME,
          legacyApiKey.trim()
        );
      } catch (error: any) {
        logger.warn("Keytar migration fallback will use local token file:", error.message);
      }
      writeGeminiTokenFallback(legacyApiKey.trim());
    }

    fs.unlinkSync(legacyPath);
    logger.log("Migrated and removed legacy secret_key.json from userData.");
  } catch (error: any) {
    logger.error("Failed to migrate legacy secret key:", error.message);
  }
}

export async function getGeminiToken(): Promise<string | null> {
  try {
    const token = await keytar.getPassword(GEMINI_TOKEN_SERVICE_NAME, GEMINI_TOKEN_ACCOUNT_NAME);
    if (token) return token;
    
    const fallbackToken = readGeminiTokenFallback();
    if (fallbackToken) return fallbackToken;
    
    return process.env.GEMINI_API_KEY || null;
  } catch (e) {
    const fallbackToken = readGeminiTokenFallback();
    if (fallbackToken) return fallbackToken;
    return process.env.GEMINI_API_KEY || null;
  }
}

export async function saveGeminiToken(token: string): Promise<boolean> {
  try {
    if (typeof token !== "string" || !token.trim()) {
      return false;
    }
    const normalized = token.trim();
    let keytarSaved = false;

    try {
      await keytar.setPassword(GEMINI_TOKEN_SERVICE_NAME, GEMINI_TOKEN_ACCOUNT_NAME, normalized);
      keytarSaved = true;
    } catch (error: any) {
      logger.warn("Keytar save failed. Falling back to local token file:", error.message);
    }

    const fallbackSaved = writeGeminiTokenFallback(normalized);
    return keytarSaved || fallbackSaved;
  } catch (e) {
    return false;
  }
}
