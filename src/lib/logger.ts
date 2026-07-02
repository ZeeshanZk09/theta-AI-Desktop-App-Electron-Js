/* eslint-disable no-console */

/**
 * Frontend Logger Helper
 * Used to avoid widespread no-console eslint suppression across the application.
 */

export const logger = {
  log: (...args: unknown[]) => {
    console.log("[Theta UI]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[Theta UI WARNING]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[Theta UI ERROR]", ...args);
  },
  info: (...args: unknown[]) => {
    console.info("[Theta UI INFO]", ...args);
  },
  debug: (...args: unknown[]) => {
    console.debug("[Theta UI DEBUG]", ...args);
  }
};
