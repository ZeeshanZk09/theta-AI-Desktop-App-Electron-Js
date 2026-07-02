/* eslint-disable no-console */

/**
 * Backend Logger Helper
 * Used to avoid widespread no-console eslint suppression across the application.
 */

export const logger = {
  log: (...args: unknown[]) => {
    console.log("[Theta Backend]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[Theta Backend WARNING]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[Theta Backend ERROR]", ...args);
  },
  info: (...args: unknown[]) => {
    console.info("[Theta Backend INFO]", ...args);
  },
  debug: (...args: unknown[]) => {
    console.debug("[Theta Backend DEBUG]", ...args);
  }
};
