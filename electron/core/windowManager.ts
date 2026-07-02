/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from "node:path";

import { BrowserWindow, shell } from "electron";

import { logger } from "../utils/logger";

let mainWindow: BrowserWindow | null = null;
let relaxedLocalSecurity = false;
let allowDevUpdates = false;
let requireActionApproval = true;

const getEnvFlag = (name: string, fallback: boolean) => {
  const val = process.env[name];
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return fallback;
};

const initializeFlags = () => {
  relaxedLocalSecurity = getEnvFlag("VITE_RELAXED_SECURITY", false);
  allowDevUpdates = getEnvFlag("VITE_ALLOW_DEV_UPDATES", false);
  requireActionApproval = getEnvFlag("VITE_REQUIRE_ACTION_APPROVAL", true);
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0a0a0a",
      symbolColor: "#ffffff",
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !relaxedLocalSecurity,
    },
    show: false,
  });

  mainWindow.setMenu(null);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).then(() => {
      logger.log(`Opened URL: ${url}`);
    }).catch((err) => {
      logger.error(`Failed to open URL: ${url}`, err);
    })
    return { action: "deny" };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).then(() => {
      logger.log(`Loaded URL: ${process.env.VITE_DEV_SERVER_URL}`);
    }).catch((err) => {
      logger.error(`Failed to load URL: ${process.env.VITE_DEV_SERVER_URL}`, err);
    })
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html")).then(() => {
      logger.log(`Loaded file: ${path.join(__dirname, "../dist/index.html")}`);
    }).catch((err) => {
      logger.error(`Failed to load file: ${path.join(__dirname, "../dist/index.html")}`, err);
    })
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  return mainWindow;
}

function setupPermissions(session: any) {
  session.defaultSession.setPermissionRequestHandler((webContents: any, permission: string, callback: any) => {
    const allowedPermissions = [
      "media",
      "clipboard-read",
      "clipboard-sanitized-write",
      "window-management",
      "fullscreen",
    ];

    if (allowedPermissions.includes(permission)) {
      // eslint-disable-next-line n/no-callback-literal
      callback(true);
    } else {
      logger.warn(`Permission denied: ${permission}`);
      // eslint-disable-next-line n/no-callback-literal
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents: any, permission: string) => {
    const allowedPermissions = [
      "media",
      "clipboard-read",
      "clipboard-sanitized-write",
      "window-management",
      "fullscreen",
    ];

    if (allowedPermissions.includes(permission)) {
      return true;
    }

    logger.warn(`Permission check denied: ${permission}`);
    return false;
  });
}


export {
  createWindow,
  setupPermissions,
  mainWindow,
  relaxedLocalSecurity,
  allowDevUpdates,
  requireActionApproval,
  initializeFlags,
}