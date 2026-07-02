/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from "node:path";

import { app, BrowserWindow, session } from "electron";
import { autoUpdater } from "electron-updater";

import {
  createWindow,
  setupPermissions,
  initializeFlags,
  relaxedLocalSecurity,
  requireActionApproval,
  allowDevUpdates,
} from "./core/windowManager";
import { registerHandlers, bootstrapTaskReminders } from "./ipc/handlers";
import { migrateAndDeleteLegacySecretKey } from "./services/ai";
import {
  ensurePostgresPersistence,
  migrateLegacyStateToPostgres,
  persistencePool,
} from "./services/database";
import { startWakeWordDetector, killWakeWordProcess } from "./services/system";
import { logger } from "./utils/logger";
import { startProductionServer } from "./utils/server";

let productionServer: any = null;

function getRendererCsp() {
  if (relaxedLocalSecurity) {
    return [
      "default-src 'self' data: blob: http: https: ws: wss:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: http: https:",
      "media-src 'self' data: blob: http: https:",
      "connect-src 'self' data: blob: http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:* https://*.googleapis.com https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://*.googleusercontent.com https://*.gstatic.com https://*.supabase.co https://api.openai.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
    ].join("; ") + ";";
  }

  return [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' http://localhost:* ws://localhost:* https://*.googleapis.com https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://*.supabase.co",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com",
    "object-src 'none'",
  ].join("; ") + ";";
}

app.whenReady().then(async () => {
  initializeFlags();

  logger.log(`Security mode: ${relaxedLocalSecurity ? "RELAXED_LOCAL" : "STRICT"}`);
  logger.log(`Approval gate: ${requireActionApproval ? "ENABLED" : "DISABLED"}`);

  if (!process.env.VITE_DEV_SERVER_URL) {
    logger.log("Starting production fallback server...");
    try {
      const distPath = path.join(__dirname, "../dist");
      await startProductionServer(distPath, 45678);
    } catch (e: unknown) {
      logger.error("Failed to start production server:", e instanceof Error ? e.message : e);
    }
  }

  const postgresReady = await ensurePostgresPersistence();
  if (postgresReady) {
    await migrateLegacyStateToPostgres();
  }

  migrateAndDeleteLegacySecretKey().catch((error) => {
    logger.error("Legacy key migration failed:", error.message);
  });

  setupPermissions(session);

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = getRendererCsp();
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });

  registerHandlers();
  
  bootstrapTaskReminders().catch((error) => {
    logger.error("Failed to bootstrap task reminders:", error.message);
  });

  const mainWindow = createWindow();

  autoUpdater.on("checking-for-update", () => logger.log("Checking for updates..."));
  autoUpdater.on("update-available", (info) => {
    logger.log("Update available:", info.version);
    mainWindow?.webContents.send("update-available", { version: info.version, releaseDate: info.releaseDate });
  });
  autoUpdater.on("update-not-available", () => logger.log("No updates available"));
  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("update-download-progress", {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });
  autoUpdater.on("update-downloaded", () => {
    logger.log("Update downloaded");
    mainWindow?.webContents.send("update-downloaded");
  });
  autoUpdater.on("error", (err) => logger.error("Update error:", err.message));

  if (app.isPackaged || allowDevUpdates) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => logger.log("Update check failed:", err.message));
    }, 5000);
  } else {
    logger.log("Skipping automatic update check in development mode.");
  }

  if (mainWindow) startWakeWordDetector(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      startWakeWordDetector(win);
    }
  });
}).then(() => {
  app.on("window-all-closed", () => {
    if (productionServer) {
      productionServer.close();
      productionServer = null;
    }

    if (persistencePool) {
      persistencePool.end().catch((error: unknown) => {
        logger.error("Failed to close PostgreSQL pool:", error instanceof Error ? error.message : error);
      });
    }

    killWakeWordProcess();

    if (process.platform !== "darwin") app.quit();
  });
}).catch((error) => {
  logger.error("Failed to initialize application:", error.message);
});

app.on("window-all-closed", () => {
  if (productionServer) {
    productionServer.close();
    productionServer = null;
  }

  if (persistencePool) {
    persistencePool.end().catch((error: unknown) => {
      logger.error("Failed to close PostgreSQL pool:", error instanceof Error ? error.message : error);
    });
  }

  killWakeWordProcess();

  if (process.platform !== "darwin") app.quit();
});
