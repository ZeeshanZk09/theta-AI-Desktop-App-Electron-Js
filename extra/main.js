const { app, BrowserWindow, ipcMain, powerSaveBlocker, nativeImage, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { exec } = require("node:child_process");
const { dialog } = require("electron");
const mime = require("mime-types");
const si = require("systeminformation");
const screenshot = require("screenshot-desktop");
const axios = require("axios");
const { Pool } = require("pg");
const keytar = require("keytar");
const { clipboard, Notification } = require("electron");
const http = require("node:http");
const { z } = require("zod");
require("dotenv").config();

const isDevelopment = process.env.NODE_ENV === "development";
const allowDevUpdates = process.env.ENABLE_DEV_UPDATES === "true";
const relaxedLocalSecurity = process.env.Theta_RELAXED_SECURITY !== "false";
const requireActionApproval = true;

const GEMINI_TOKEN_SERVICE_NAME = "ThetaDesktop";
const GEMINI_TOKEN_ACCOUNT_NAME = "gemini-api-key";

const BLOCKED_COMMAND_PATTERNS = [
  /rm\s+-rf/i,
  /format\s+c:/i,
  /shutdown/i,
  /del\s+\/[sf]/i,
  /mkfs/i,
  /rmdir\s+\/[sq]/i,
];

const FsOpSchema = z
  .object({
    operation: z.enum(["read-dir", "create-dir", "write-file", "read-file", "delete", "exists"]),
    path: z
      .string()
      .min(1)
      .max(4096)
      .refine((p) => !p.includes(".."), { message: "Path traversal not allowed" }),
    content: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.operation === "write-file" && typeof value.content !== "string") {
      ctx.addIssue({
        code: "custom",
        message: "content is required for write-file operation",
        path: ["content"],
      });
    }
  });

const ExecCommandSchema = z.object({
  command: z.string().min(1).max(2000),
});

const HttpFetchSchema = z.object({
  url: z
    .string()
    .min(1)
    .max(2048)
    .regex(/^https?:\/\//i, { message: "Invalid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

const KillProcessSchema = z.object({
  pid: z.number().int().positive(),
});

const SemanticWorkspaceSearchSchema = z.object({
  query: z.string().min(2).max(400),
  maxResults: z.number().int().min(1).max(30).optional(),
  maxFiles: z.number().int().min(20).max(4000).optional(),
  rootPath: z.string().min(1).max(4096).optional(),
});

// Configure chromium cache paths early to avoid cache move permission issues.
try {
  const cacheRoot = path.join(os.tmpdir(), "Theta-electron-cache");
  fs.mkdirSync(cacheRoot, { recursive: true });
  app.commandLine.appendSwitch("disk-cache-dir", cacheRoot);
  app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
} catch (error) {
  console.warn("Failed to set Chromium cache switches:", error.message);
}

// Production Server for YouTube embeds (file:// origin is blocked by YouTube)
let productionServer = null;
let productionPort = 45678;

// Document Parsers
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

// Auto-Updater
const { autoUpdater } = require("electron-updater");
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Enforce update signature verification for trusted updates
autoUpdater.verifySourceSignature = true;
autoUpdater.verifyUpdaterSignature = true;
console.log("Auto-Updater logic: Signature verification enabled.");

// FORCE DEV UPDATE CONFIG (For testing without building)
if (isDevelopment) {
  autoUpdater.forceDevUpdateConfig = allowDevUpdates;
  if (allowDevUpdates) {
    console.log("FORCE DEV UPDATE CONFIG ENABLED");
  } else {
    console.log("Dev mode: auto-update checks disabled (set ENABLE_DEV_UPDATES=true to enable).");
  }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Custom logger to send logs to renderer
autoUpdater.logger = {
  info(text) {
    console.log(text);
    if (typeof mainWindow !== "undefined" && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-log", text);
    }
  },
  warn(text) {
    console.warn(text);
    if (typeof mainWindow !== "undefined" && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-log", `WARN: ${text}`);
    }
  },
  error(text) {
    console.error(text);
    if (typeof mainWindow !== "undefined" && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-log", `ERROR: ${text}`);
    }
  },
};

// Initialize Google GenAI SDK
const { GoogleGenAI } = require("@google/genai");

let powerSaveId = null;
// Splash screen removed in favor of React-based loading screen

function createWindow() {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    backgroundColor: "#020406",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(
      process.env.NODE_ENV === "development"
        ? path.join(__dirname, "../public/logo.png")
        : path.join(process.resourcesPath, "public/logo.png")
    ),
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(devServerUrl);
  } else {
    // PRODUCTION: Serve via local HTTP server (YouTube blocks file:// embeds)
    startProductionServer()
      .then((port) => {
        mainWindow.loadURL(`http://localhost:${port}/index.html`);
      })
      .catch((err) => {
        console.error("Failed to start production server:", err);
        // Fallback to file loading if server fails
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
      });
  }

  return mainWindow;
}

// Production HTTP Server - serves dist folder on localhost
function startProductionServer() {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, "../dist");

    productionServer = http.createServer((req, res) => {
      let filePath = path.join(distPath, req.url === "/" ? "index.html" : req.url);

      // Security: prevent directory traversal
      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      const extname = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".ico": "image/x-icon",
      };

      const contentType = mimeTypes[extname] || "application/octet-stream";

      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === "ENOENT") {
            // SPA fallback - serve index.html for any unknown route
            fs.readFile(path.join(distPath, "index.html"), (err, indexContent) => {
              if (err) {
                res.writeHead(500);
                res.end("Server Error");
              } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(indexContent, "utf-8");
              }
            });
          } else {
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
          }
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content, "utf-8");
        }
      });
    });

    productionServer.listen(productionPort, "127.0.0.1", () => {
      console.log(`Production server running at http://localhost:${productionPort}`);
      resolve(productionPort);
    });

    productionServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        productionPort++;
        productionServer.listen(productionPort, "127.0.0.1");
      } else {
        reject(err);
      }
    });
  });
}

function setupPermissions(session) {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const requestOrigin = details?.requestingUrl || "";
      const isAllowedOrigin = isLocalRequestOrigin(requestOrigin);

      if (relaxedLocalSecurity && isAllowedOrigin) {
        callback(true);
        return;
      }

      const isAllowedPermission = ["media", "camera", "microphone"].includes(permission);

      if (isAllowedOrigin && isAllowedPermission) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );
}

// Utility Paths
const getMemoryPath = () => path.join(app.getPath("userData"), "memories.json");
const getUserProfilePath = () => path.join(app.getPath("userData"), "user_profile.json");
const getDashboardSettingsPath = () =>
  path.join(app.getPath("userData"), "dashboard_settings.json");
const getDashboardModulesStatePath = () =>
  path.join(app.getPath("userData"), "dashboard_modules_state.json");
const getFolderConfigPath = () => path.join(app.getPath("userData"), "imported_folders.json");
const getVaultPath = () => path.join(process.cwd(), "Theta_Vault");
const getLinkedInQueuePath = () => path.join(getVaultPath(), "BUSINESS", "linkedin_queue.json");
const getLinkedInHistoryPath = () =>
  path.join(getVaultPath(), "BUSINESS", "linkedin_post_history.json");
const getHistoryPath = () => path.join(app.getPath("userData"), "history.json");
const getHistorySettingsPath = () => path.join(app.getPath("userData"), "history_settings.json");
const getContactsPath = () => path.join(app.getPath("userData"), "contacts.json");
const getNotesPath = () => path.join(app.getPath("userData"), "notes.json");
const getTasksPath = () => path.join(app.getPath("userData"), "tasks.json");
const getTaskRemindersPath = () => path.join(app.getPath("userData"), "task_reminders.json");
const getApprovalAuditPath = () => path.join(app.getPath("userData"), "approval_audit_log.json");
const getLegacySecretKeyPath = () => path.join(app.getPath("userData"), "secret_key.json");
const getGeminiTokenFallbackPath = () => path.join(app.getPath("userData"), "gemini_token.txt");

const PERSISTENCE_KEYS = Object.freeze({
  memories: "memories",
  userProfile: "user_profile",
  dashboardSettings: "dashboard_settings",
  dashboardModulesState: "dashboard_modules_state",
  importedFolders: "imported_folders",
  linkedInQueue: "linkedin_queue",
  linkedInHistory: "linkedin_history",
  history: "history",
  historySettings: "history_settings",
  contacts: "contacts",
  notes: "notes",
  tasks: "tasks",
  taskReminders: "task_reminders",
  approvalAuditLog: "approval_audit_log",
});

const legacyPersistenceFileGetters = {
  [PERSISTENCE_KEYS.memories]: getMemoryPath,
  [PERSISTENCE_KEYS.userProfile]: getUserProfilePath,
  [PERSISTENCE_KEYS.dashboardSettings]: getDashboardSettingsPath,
  [PERSISTENCE_KEYS.dashboardModulesState]: getDashboardModulesStatePath,
  [PERSISTENCE_KEYS.importedFolders]: getFolderConfigPath,
  [PERSISTENCE_KEYS.linkedInQueue]: getLinkedInQueuePath,
  [PERSISTENCE_KEYS.linkedInHistory]: getLinkedInHistoryPath,
  [PERSISTENCE_KEYS.history]: getHistoryPath,
  [PERSISTENCE_KEYS.historySettings]: getHistorySettingsPath,
  [PERSISTENCE_KEYS.contacts]: getContactsPath,
  [PERSISTENCE_KEYS.notes]: getNotesPath,
  [PERSISTENCE_KEYS.tasks]: getTasksPath,
  [PERSISTENCE_KEYS.taskReminders]: getTaskRemindersPath,
  [PERSISTENCE_KEYS.approvalAuditLog]: getApprovalAuditPath,
};

const POSTGRES_TABLE_NAME = "theta_persistent_state";
const postgresConnectionString = process.env.THETA_DATABASE_URL || process.env.DATABASE_URL;
let persistencePool = null;
let persistenceBackend = "file";
let persistenceInitAttempted = false;

const getLegacyPersistencePath = (key) => {
  const getter = legacyPersistenceFileGetters[key];
  return typeof getter === "function" ? getter() : null;
};

const getPostgresConfig = () => {
  const sslRequired =
    process.env.THETA_PG_SSL === "true" ||
    process.env.PGSSLMODE === "require" ||
    process.env.PGSSLMODE === "verify-ca" ||
    process.env.PGSSLMODE === "verify-full";

  const sharedConfig = {
    max: Number(process.env.THETA_PG_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.THETA_PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.THETA_PG_CONNECT_TIMEOUT_MS || 10000),
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  };

  if (postgresConnectionString) {
    return {
      connectionString: postgresConnectionString,
      ...sharedConfig,
    };
  }

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD || "",
      database: process.env.PGDATABASE,
      ...sharedConfig,
    };
  }

  return null;
};

const ensurePostgresPersistence = async () => {
  if (persistenceInitAttempted) {
    return persistenceBackend === "postgres";
  }

  persistenceInitAttempted = true;
  const pgConfig = getPostgresConfig();
  if (!pgConfig) {
    console.warn("Persistence backend: file (PostgreSQL config missing)");
    return false;
  }

  try {
    persistencePool = new Pool(pgConfig);
    await persistencePool.query("SELECT 1");
    await persistencePool.query(`
      CREATE TABLE IF NOT EXISTS ${POSTGRES_TABLE_NAME} (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    persistenceBackend = "postgres";
    console.log("Persistence backend: PostgreSQL");
    return true;
  } catch (error) {
    console.error(
      "Failed to initialize PostgreSQL persistence. Falling back to file storage.",
      error.message
    );
    if (persistencePool) {
      try {
        await persistencePool.end();
      } catch {
        // Ignore close errors and keep file fallback active.
      }
      persistencePool = null;
    }
    persistenceBackend = "file";
    return false;
  }
};

const ensureParentDir = (filePath) => {
  try {
    const parent = path.dirname(filePath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to ensure parent directory:", error.message);
  }
};

const readJsonFileSafe = (filePath, fallbackValue) => {
  try {
    if (!fs.existsSync(filePath)) return fallbackValue;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeJsonFileSafe = (filePath, value) => {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
};

const SEMANTIC_SEARCH_IGNORED_DIRS = new Set([
  ".git",
  ".venv",
  ".vscode",
  "node_modules",
  "dist",
  "build",
  "dist_electron",
  "backend_env",
  "__pycache__",
  "Stonic_Vault",
  "Theta_Vault",
  "audio",
  "screenshot",
  "Documents",
]);

const SEMANTIC_SEARCH_ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".txt",
  ".py",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".sql",
  ".csv",
  ".xml",
  ".env",
]);

const SEMANTIC_SYNONYM_MAP = {
  ai: ["assistant", "model", "intelligence"],
  auth: ["authentication", "login", "signin", "token"],
  bug: ["issue", "error", "fix", "failure"],
  config: ["configuration", "setting", "env", "option"],
  db: ["database", "postgres", "postgresql", "sql"],
  linkedin: ["post", "draft", "queue", "publish"],
  memory: ["memories", "profile", "history", "preferences"],
  performance: ["optimize", "speed", "latency", "slow"],
  search: ["find", "lookup", "discover", "query"],
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countOccurrences = (text = "", term = "") => {
  if (!text || !term) return 0;
  const regex = new RegExp(escapeRegex(term), "g");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

const buildSemanticTerms = (query = "") => {
  const baseTokens = String(query)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length >= 2);

  const terms = new Set(baseTokens);
  baseTokens.forEach((token) => {
    const expanded = SEMANTIC_SYNONYM_MAP[token];
    if (Array.isArray(expanded)) {
      expanded.forEach((term) => terms.add(term));
    }
  });

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length >= 3) {
    terms.add(normalizedQuery);
  }

  return Array.from(terms);
};

const resolveSearchRootPath = (requestedRootPath) => {
  const workspaceRoot = path.resolve(process.cwd());
  if (!requestedRootPath) return workspaceRoot;

  const candidate = path.resolve(requestedRootPath);
  if (candidate.startsWith(workspaceRoot)) {
    return candidate;
  }

  return workspaceRoot;
};

const collectWorkspaceTextFiles = (rootPath, maxFiles) => {
  const resolvedRoot = path.resolve(rootPath);
  const queue = [resolvedRoot];
  const files = [];
  const maxFileBytes = 1_000_000;

  while (queue.length > 0 && files.length < maxFiles) {
    const currentDir = queue.pop();
    if (!currentDir) continue;

    let entries = [];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SEMANTIC_SEARCH_IGNORED_DIRS.has(entry.name)) continue;
        queue.push(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = path.extname(entry.name).toLowerCase();
      if (!SEMANTIC_SEARCH_ALLOWED_EXTENSIONS.has(extension)) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > maxFileBytes) continue;
      } catch {
        continue;
      }

      files.push(fullPath);
      if (files.length >= maxFiles) break;
    }
  }

  return files;
};

const scoreSemanticMatch = ({ query, terms, relativePath, content }) => {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const fileLower = relativePath.toLowerCase();
  let score = 0;

  if (queryLower.length >= 3 && contentLower.includes(queryLower)) {
    score += 120;
  }

  if (queryLower.length >= 3 && fileLower.includes(queryLower)) {
    score += 90;
  }

  for (const term of terms) {
    if (!term) continue;
    const inFile = countOccurrences(fileLower, term);
    const inContent = countOccurrences(contentLower, term);

    if (inFile > 0) {
      score += Math.min(inFile, 4) * 15;
    }

    if (inContent > 0) {
      score += Math.min(inContent, 30) * (term.length >= 5 ? 4 : 2);
    }
  }

  return score;
};

const extractSemanticSnippets = ({ content, terms, query, maxSnippets = 3 }) => {
  const lines = content.split(/\r?\n/);
  const queryLower = query.toLowerCase();
  const ranked = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineLower = line.toLowerCase();
    let lineScore = 0;

    if (queryLower.length >= 3 && lineLower.includes(queryLower)) {
      lineScore += 10;
    }

    for (const term of terms) {
      if (!term) continue;
      const occurrences = countOccurrences(lineLower, term);
      if (occurrences > 0) {
        lineScore += Math.min(occurrences, 8);
      }
    }

    if (lineScore > 0) {
      ranked.push({
        line: index + 1,
        score: lineScore,
        text: line.trim(),
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  return ranked
    .slice(0, maxSnippets)
    .map((item) => ({ line: item.line, text: item.text.slice(0, 240) }));
};

const readPersistedState = async (key, fallbackValue) => {
  const legacyPath = getLegacyPersistencePath(key);

  if (persistenceBackend === "postgres" && persistencePool) {
    try {
      const result = await persistencePool.query(
        `SELECT value FROM ${POSTGRES_TABLE_NAME} WHERE key = $1 LIMIT 1`,
        [key]
      );

      if (result.rows.length > 0) {
        const value = result.rows[0].value;
        return value ?? fallbackValue;
      }

      if (legacyPath) {
        const legacyValue = readJsonFileSafe(legacyPath, undefined);
        if (legacyValue !== undefined) {
          await writePersistedState(key, legacyValue);
          return legacyValue;
        }
      }

      return fallbackValue;
    } catch (error) {
      console.error(`Failed to read persisted state for key "${key}":`, error.message);
    }
  }

  if (legacyPath) {
    return readJsonFileSafe(legacyPath, fallbackValue);
  }

  return fallbackValue;
};

const writePersistedState = async (key, value) => {
  const normalizedValue = value === undefined ? null : value;
  const legacyPath = getLegacyPersistencePath(key);

  if (persistenceBackend === "postgres" && persistencePool) {
    try {
      await persistencePool.query(
        `
          INSERT INTO ${POSTGRES_TABLE_NAME} (key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [key, JSON.stringify(normalizedValue)]
      );
      return true;
    } catch (error) {
      console.error(`Failed to write persisted state for key "${key}":`, error.message);
    }
  }

  if (legacyPath) {
    try {
      writeJsonFileSafe(legacyPath, normalizedValue);
      return true;
    } catch (error) {
      console.error(`Failed to write legacy state for key "${key}":`, error.message);
      return false;
    }
  }

  return false;
};

const clearPersistedState = async (key) => {
  const legacyPath = getLegacyPersistencePath(key);

  if (persistenceBackend === "postgres" && persistencePool) {
    try {
      await persistencePool.query(`DELETE FROM ${POSTGRES_TABLE_NAME} WHERE key = $1`, [key]);
      return true;
    } catch (error) {
      console.error(`Failed to clear persisted state for key "${key}":`, error.message);
    }
  }

  if (legacyPath) {
    try {
      if (fs.existsSync(legacyPath)) {
        fs.unlinkSync(legacyPath);
      }
      return true;
    } catch {
      return false;
    }
  }

  return false;
};

const migrateLegacyStateToPostgres = async () => {
  if (persistenceBackend !== "postgres" || !persistencePool) return;

  const keys = Object.values(PERSISTENCE_KEYS);
  for (const key of keys) {
    const legacyPath = getLegacyPersistencePath(key);
    if (!legacyPath || !fs.existsSync(legacyPath)) continue;

    try {
      const existing = await persistencePool.query(
        `SELECT 1 FROM ${POSTGRES_TABLE_NAME} WHERE key = $1 LIMIT 1`,
        [key]
      );
      if (existing.rows.length > 0) continue;

      const legacyValue = readJsonFileSafe(legacyPath, undefined);
      if (legacyValue === undefined) continue;

      await writePersistedState(key, legacyValue);
      console.log(`Migrated legacy persisted state: ${key}`);
    } catch (error) {
      console.error(`Failed to migrate legacy state for key "${key}":`, error.message);
    }
  }
};

const pendingApprovalRequests = new Map();
const taskReminderTimers = new Map();

const estimateRiskLevel = (action = "", detail = "") => {
  const text = `${action} ${detail}`.toLowerCase();

  if (
    /shutdown|restart|format|rm\s+-rf|rmdir|del\s+\/|powershell|kill|delete|reg\s+add|sc\s+config|taskkill/i.test(
      text
    )
  ) {
    return "red";
  }

  if (/http request|post |put |patch |delete |filesystem|write-file|create-dir/i.test(text)) {
    return "yellow";
  }

  return "green";
};

const readApprovalAuditLog = async () => {
  const value = await readPersistedState(PERSISTENCE_KEYS.approvalAuditLog, []);
  return Array.isArray(value) ? value : [];
};

const appendApprovalAuditLog = async (entry) => {
  try {
    const current = await readApprovalAuditLog();
    const updated = [entry, ...current].slice(0, 1000);
    await writePersistedState(PERSISTENCE_KEYS.approvalAuditLog, updated);
  } catch (error) {
    console.error("Failed to append approval audit log:", error.message);
  }
};

const requestRendererApproval = async ({ action, detail, payload, source }) => {
  if (!requireActionApproval) {
    return { approved: true, bypassed: true, risk: estimateRiskLevel(action, detail) };
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return { approved: false, error: "No active UI window available for approval." };
  }

  const risk = estimateRiskLevel(action, detail);
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (pendingApprovalRequests.has(requestId)) {
        pendingApprovalRequests.delete(requestId);
        resolve({ approved: false, timeout: true, risk });
      }
    }, 120000);

    pendingApprovalRequests.set(requestId, {
      resolve,
      timeout,
      payload: {
        requestId,
        action,
        detail,
        payload,
        source: source || "unknown",
        risk,
        requestedAt: Date.now(),
      },
    });

    mainWindow.webContents.send("action-approval-requested", {
      requestId,
      action,
      detail,
      payload,
      source: source || "unknown",
      risk,
      requestedAt: Date.now(),
    });
  });
};

const readTaskReminders = async () => {
  const value = await readPersistedState(PERSISTENCE_KEYS.taskReminders, []);
  return Array.isArray(value) ? value : [];
};

const writeTaskReminders = async (tasks = []) => {
  try {
    await writePersistedState(PERSISTENCE_KEYS.taskReminders, tasks);
  } catch (error) {
    console.error("Failed to write task reminders file:", error.message);
  }
};

const clearTaskReminderTimer = (taskId) => {
  const timer = taskReminderTimers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    taskReminderTimers.delete(taskId);
  }
};

const scheduleTaskReminderTimer = (task) => {
  if (!task?.id) return;

  clearTaskReminderTimer(task.id);

  if (!task.reminder || !task.dueAt) return;

  const dueTimestamp = new Date(task.dueAt).getTime();
  if (!Number.isFinite(dueTimestamp)) return;

  const delay = dueTimestamp - Date.now();
  if (delay <= 0) return;

  const timer = setTimeout(async () => {
    try {
      const notification = new Notification({
        title: "Task Reminder",
        body: task.text || "You have a pending task reminder.",
      });
      notification.show();
      shell.beep();
    } catch (error) {
      console.error("Failed to trigger task reminder notification:", error.message);
    }

    taskReminderTimers.delete(task.id);
    const reminders = await readTaskReminders();
    const remaining = reminders.filter((item) => item.id !== task.id);
    await writeTaskReminders(remaining);
  }, delay);

  taskReminderTimers.set(task.id, timer);
};

const syncTaskRemindersInternal = async (tasks = []) => {
  taskReminderTimers.forEach((timer, id) => {
    clearTimeout(timer);
    taskReminderTimers.delete(id);
  });

  const reminderTasks = tasks.filter((task) => task?.id && task?.reminder && task?.dueAt);
  await writeTaskReminders(reminderTasks);
  reminderTasks.forEach(scheduleTaskReminderTimer);
};

const bootstrapTaskReminders = async () => {
  const reminders = await readTaskReminders();
  reminders.forEach(scheduleTaskReminderTimer);
};

const isLocalRequestOrigin = (requestOrigin = "") => {
  if (!requestOrigin) return false;
  if (requestOrigin.startsWith("app://") || requestOrigin.startsWith("file://")) return true;

  try {
    const parsed = new URL(requestOrigin);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const readGeminiTokenFallback = () => {
  try {
    const fallbackPath = getGeminiTokenFallbackPath();
    if (!fs.existsSync(fallbackPath)) return null;

    const token = fs.readFileSync(fallbackPath, "utf8").trim();
    return token || null;
  } catch {
    return null;
  }
};

const writeGeminiTokenFallback = (token) => {
  try {
    if (typeof token !== "string" || !token.trim()) return false;
    fs.writeFileSync(getGeminiTokenFallbackPath(), token.trim(), "utf8");
    return true;
  } catch {
    return false;
  }
};

function getRendererCsp() {
  if (relaxedLocalSecurity) {
    return (
      [
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
      ].join("; ") + ";"
    );
  }

  return (
    [
      "default-src 'self'",
      "script-src 'self' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self' http://localhost:* ws://localhost:* https://*.googleapis.com https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://*.supabase.co",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com",
      "object-src 'none'",
    ].join("; ") + ";"
  );
}

const migrateAndDeleteLegacySecretKey = async () => {
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
      } catch (error) {
        console.warn("Keytar migration fallback will use local token file:", error.message);
      }
      writeGeminiTokenFallback(legacyApiKey.trim());
    }

    fs.unlinkSync(legacyPath);
    console.log("Migrated and removed legacy secret_key.json from userData.");
  } catch (error) {
    console.error("Failed to migrate legacy secret key:", error.message);
  }
};

// --- IPC Handlers Registration ---
function registerHandlers() {
  // Memory Management
  ipcMain.handle("load-memories", async () => {
    try {
      const memories = await readPersistedState(PERSISTENCE_KEYS.memories, []);
      return Array.isArray(memories) ? memories : [];
    } catch (e) {
      console.error("Failed to load memories:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-memories", async (event, memories) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.memories, memories);
    } catch (e) {
      console.error("Failed to save memories:", e?.message || e);
      return false;
    }
  });

  // User Profile
  ipcMain.handle("load-user-profile", async () => {
    try {
      const profile = await readPersistedState(PERSISTENCE_KEYS.userProfile, {});
      return profile && typeof profile === "object" ? profile : {};
    } catch (e) {
      console.error("Failed to load user profile:", e?.message || e);
      return {};
    }
  });

  ipcMain.handle("save-user-profile", async (event, profile) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.userProfile, profile);
    } catch (e) {
      console.error("Failed to save user profile:", e?.message || e);
      return false;
    }
  });

  // Dashboard Settings & Fetching
  ipcMain.handle("load-dashboard-settings", async () => {
    try {
      const fallback = { interests: ["Tech", "Pakistan", "Global Economy"], refreshInterval: 3600 };
      const settings = await readPersistedState(PERSISTENCE_KEYS.dashboardSettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (e) {
      console.error("Failed to load dashboard settings:", e?.message || e);
      return { interests: [], refreshInterval: 3600 };
    }
  });

  ipcMain.handle("save-dashboard-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.dashboardSettings, settings);
    } catch (e) {
      console.error("Failed to save dashboard settings:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-dashboard-modules-state", async () => {
    const fallback = {
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

    const state = await readPersistedState(PERSISTENCE_KEYS.dashboardModulesState, fallback);
    return state && typeof state === "object" ? state : fallback;
  });

  ipcMain.handle("save-dashboard-modules-state", async (event, state) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.dashboardModulesState, state);
    } catch {
      return false;
    }
  });

  ipcMain.handle("load-linkedin-queue", async () => {
    const queue = await readPersistedState(PERSISTENCE_KEYS.linkedInQueue, []);
    return Array.isArray(queue) ? queue : [];
  });

  ipcMain.handle("save-linkedin-queue", async (event, queue) => {
    try {
      return await writePersistedState(
        PERSISTENCE_KEYS.linkedInQueue,
        Array.isArray(queue) ? queue : []
      );
    } catch {
      return false;
    }
  });

  ipcMain.handle("load-linkedin-history", async () => {
    const history = await readPersistedState(PERSISTENCE_KEYS.linkedInHistory, []);
    return Array.isArray(history) ? history : [];
  });

  ipcMain.handle("save-linkedin-history", async (event, history) => {
    try {
      return await writePersistedState(
        PERSISTENCE_KEYS.linkedInHistory,
        Array.isArray(history) ? history : []
      );
    } catch {
      return false;
    }
  });

  ipcMain.handle("fetch-dashboard-data", async (event, { location, interests }) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Search for top 5 news headlines for: ${interests.join(", ")} in ${location || "Pakistan"}. Also get weather. Respond in ROMAN URDU and return JSON: {"headlines": [...], "weather": {"today": "...", "tomorrow": "...", "dayAfter": "..."}}`;
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
      });
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { headlines: ["Error parsing data"], weather: { today: "N/A" } };
    } catch (error) {
      return { headlines: [`Error: ${error.message}`], weather: { today: "Error ⚠️" } };
    }
  });

  // History
  ipcMain.handle("load-history", async () => {
    try {
      const history = await readPersistedState(PERSISTENCE_KEYS.history, []);
      return Array.isArray(history) ? history : [];
    } catch (e) {
      console.error("Failed to load history:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-history", async (event, history) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.history, history);
    } catch (e) {
      console.error("Failed to save history:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("clear-history", async () => {
    try {
      return await clearPersistedState(PERSISTENCE_KEYS.history);
    } catch (e) {
      console.error("Failed to clear history:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-history-settings", async () => {
    try {
      const fallback = { maxContextMessages: 20, storeHistory: true };
      const settings = await readPersistedState(PERSISTENCE_KEYS.historySettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (e) {
      console.error("Failed to load history settings:", e?.message || e);
      return { maxContextMessages: 20, storeHistory: true };
    }
  });

  ipcMain.handle("save-history-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.historySettings, settings);
    } catch (e) {
      console.error("Failed to save history settings:", e?.message || e);
      return false;
    }
  });

  // Contacts
  ipcMain.handle("load-contacts", async () => {
    try {
      const contacts = await readPersistedState(PERSISTENCE_KEYS.contacts, []);
      return Array.isArray(contacts) ? contacts : [];
    } catch (e) {
      console.error("Failed to load contacts:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-contacts", async (event, contacts) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.contacts, contacts);
    } catch (e) {
      console.error("Failed to save contacts:", e?.message || e);
      return false;
    }
  });

  // Notes
  ipcMain.handle("load-notes", async () => {
    try {
      const notes = await readPersistedState(PERSISTENCE_KEYS.notes, []);
      return Array.isArray(notes) ? notes : [];
    } catch (e) {
      console.error("Failed to load notes:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-notes", async (event, notes) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.notes, notes);
    } catch (e) {
      console.error("Failed to save notes:", e?.message || e);
      return false;
    }
  });

  // Tasks
  ipcMain.handle("load-tasks", async () => {
    try {
      const tasks = await readPersistedState(PERSISTENCE_KEYS.tasks, []);
      return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      console.error("Failed to load tasks:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-tasks", async (event, tasks) => {
    try {
      await writePersistedState(PERSISTENCE_KEYS.tasks, tasks);
      if (Array.isArray(tasks)) {
        await syncTaskRemindersInternal(tasks);
      }
      return true;
    } catch (e) {
      console.error("Failed to save tasks:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("schedule-task-reminder", async (event, payload = {}) => {
    try {
      const task = payload?.task;
      if (!task?.id) return { success: false, error: "Task id is required" };

      const current = (await readTaskReminders()).filter((item) => item.id !== task.id);
      if (task?.reminder && task?.dueAt) {
        current.push(task);
      }

      await writeTaskReminders(current);
      scheduleTaskReminderTimer(task);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("sync-task-reminders", async (event, payload = {}) => {
    try {
      const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
      await syncTaskRemindersInternal(tasks);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("load-approval-audit-log", async () => {
    return await readApprovalAuditLog();
  });

  ipcMain.handle("clear-approval-audit-log", async () => {
    try {
      return await clearPersistedState(PERSISTENCE_KEYS.approvalAuditLog);
    } catch {
      return false;
    }
  });

  // Vault & Folders
  ipcMain.handle("initialize-vault", async () => {
    console.log("IPC: Initializing Vault...");
    try {
      const vaultBase = getVaultPath();
      if (!fs.existsSync(vaultBase)) fs.mkdirSync(vaultBase, { recursive: true });
      const folderNames = ["DOCS", "BUSINESS", "EXCEL"];
      folderNames.forEach((folder) => {
        const p = path.join(vaultBase, folder);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      });
      return { vaultBase, folderNames };
    } catch (e) {
      console.error("Failed to initialize vault:", e?.message || e);
      return null;
    }
  });

  ipcMain.handle("open-vault-folder", async (event, folderName) => {
    try {
      const folderPath = path.join(getVaultPath(), folderName);
      const open = (await import("open")).default;
      await open(folderPath);
      return true;
    } catch (e) {
      console.error("Failed to open vault folder:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-imported-folders", async () => {
    try {
      const folders = await readPersistedState(PERSISTENCE_KEYS.importedFolders, []);
      return Array.isArray(folders) ? folders : [];
    } catch (e) {
      console.error("Failed to load imported folders:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-imported-folders", async (event, folders) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.importedFolders, folders);
    } catch (e) {
      console.error("Failed to save imported folders:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("get-persistence-status", async () => {
    return {
      backend: persistenceBackend,
      postgresEnabled: persistenceBackend === "postgres",
      postgresConfigured: Boolean(getPostgresConfig()),
      table: POSTGRES_TABLE_NAME,
    };
  });

  ipcMain.handle("pick-folder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Folder to Import",
    });
    if (canceled || filePaths.length === 0) return null;
    return {
      name: path.basename(filePaths[0]),
      path: filePaths[0],
    };
  });

  ipcMain.handle("semantic-workspace-search", async (event, args = {}) => {
    const parsed = SemanticWorkspaceSearchSchema.safeParse(args);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid semantic search payload.",
        details: parsed.error.issues,
      };
    }

    const { query, maxResults = 10, maxFiles = 900, rootPath } = parsed.data;

    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Semantic Workspace Search",
        detail: `Query: ${query.slice(0, 160)}`,
        payload: parsed.data,
        source: "semantic-workspace-search",
      });
      if (!decision.approved) {
        return { success: false, error: "User denied semantic workspace search." };
      }
    }

    try {
      const resolvedRoot = resolveSearchRootPath(rootPath);
      const candidateFiles = collectWorkspaceTextFiles(resolvedRoot, maxFiles);
      const terms = buildSemanticTerms(query);
      const ranked = [];

      for (const filePath of candidateFiles) {
        let content = "";
        try {
          content = fs.readFileSync(filePath, "utf8");
        } catch {
          continue;
        }

        if (!content || content.includes("\u0000")) {
          continue;
        }

        const relativePath = path.relative(resolvedRoot, filePath).split(path.sep).join("/");
        const score = scoreSemanticMatch({
          query,
          terms,
          relativePath,
          content,
        });

        if (score <= 0) {
          continue;
        }

        const snippets = extractSemanticSnippets({
          content,
          terms,
          query,
          maxSnippets: 3,
        });

        let stat = null;
        try {
          stat = fs.statSync(filePath);
        } catch {
          stat = null;
        }

        ranked.push({
          path: relativePath,
          score,
          snippets,
          sizeBytes: stat?.size || 0,
          modifiedAt: stat?.mtime ? stat.mtime.toISOString() : null,
        });
      }

      ranked.sort((a, b) => b.score - a.score);

      return {
        success: true,
        query,
        rootPath: resolvedRoot,
        searchedFiles: candidateFiles.length,
        matchedFiles: ranked.length,
        results: ranked.slice(0, maxResults),
      };
    } catch (error) {
      console.error("Semantic workspace search failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // System Tools
  ipcMain.handle("get-gemini-token", async () => {
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
  });

  ipcMain.handle("save-gemini-token", async (event, token) => {
    try {
      if (typeof token !== "string" || !token.trim()) {
        return false;
      }
      const normalized = token.trim();
      let keytarSaved = false;

      try {
        await keytar.setPassword(GEMINI_TOKEN_SERVICE_NAME, GEMINI_TOKEN_ACCOUNT_NAME, normalized);
        keytarSaved = true;
      } catch (error) {
        console.warn("Keytar save failed. Falling back to local token file:", error.message);
      }

      const fallbackSaved = writeGeminiTokenFallback(normalized);
      return keytarSaved || fallbackSaved;
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle("system-fs-op", async (event, args) => {
    const parsed = FsOpSchema.safeParse(args);
    if (!parsed.success) {
      return { error: "Invalid input", details: parsed.error.issues };
    }

    const { operation, path: targetPath, content } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Filesystem Operation",
        detail: `${operation} on ${targetPath}`,
        payload: parsed.data,
        source: "system-fs-op",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      switch (operation) {
        case "read-dir":
          return fs.readdirSync(targetPath);
        case "create-dir":
          if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
          return true;
        case "write-file":
          fs.writeFileSync(targetPath, content);
          return true;
        case "read-file":
          return fs.readFileSync(targetPath, "utf8");
        case "delete":
          fs.rmSync(targetPath, { recursive: true, force: true });
          return true;
        case "exists":
          return fs.existsSync(targetPath);
        default:
          throw new Error("Unknown operation");
      }
    } catch (e) {
      throw e;
    }
  });

  ipcMain.handle("system-open", async (event, { target }) => {
    const open = (await import("open")).default;
    await open(target);
    return true;
  });

  ipcMain.handle("system-exec-command", async (event, args) => {
    const parsed = ExecCommandSchema.safeParse(args);
    if (!parsed.success) {
      return { error: "Invalid input", details: parsed.error.issues };
    }

    const { command } = parsed.data;
    if (BLOCKED_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
      return { error: "Command blocked by security policy." };
    }

    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Shell Command",
        detail: command,
        payload: parsed.data,
        source: "system-exec-command",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    return new Promise((resolve) => {
      exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        resolve({ success: !error, stdout, stderr, error: error?.message });
      });
    });
  });

  ipcMain.handle("save-image", async (event, { base64Data }) => {
    try {
      const filePath = path.join(app.getPath("downloads"), `Theta_ai_${Date.now()}.png`);
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (e) {
      throw e;
    }
  });

  ipcMain.handle("read-file-content", async (event, { path: filePath }) => {
    try {
      if (!fs.existsSync(filePath)) return { error: "File not found" };

      const mimeType = mime.lookup(filePath);
      const buffer = fs.readFileSync(filePath);

      if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        return { content: data.text };
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // docx
        const result = await mammoth.extractRawText({ buffer });
        return { content: result.value };
      } else if (
        mimeType.startsWith("text/") ||
        mimeType === "application/json" ||
        mimeType === "application/javascript"
      ) {
        return { content: buffer.toString("utf8") };
      }

      // Fallback for images or binary: return a note (since vision processing happens via multimodal API, but if that fails, we can't do much more here without a vision model)
      return {
        content: `[Binary/Image File: ${path.basename(filePath)}]. The content of this file is visual or binary.`,
      };
    } catch (e) {
      console.error("File Read Error:", e);
      return { error: e.message };
    }
  });

  ipcMain.handle("pick-and-read-files", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Multimodal Files",
          extensions: [
            "jpg",
            "png",
            "jpeg",
            "webp",
            "pdf",
            "doc",
            "docx",
            "txt",
            "mp3",
            "wav",
            "mpeg",
          ],
        },
      ],
    });

    if (canceled) return [];

    const results = [];
    for (const filePath of filePaths) {
      const stats = fs.statSync(filePath);
      // Limit to 50MB per file for inline playback safely
      if (stats.size > 50 * 1024 * 1024) {
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const mimeType = mime.lookup(filePath) || "application/octet-stream";
      results.push({
        name: path.basename(filePath),
        data: buffer.toString("base64"),
        mimeType,
        path: filePath,
      });
    }
    return results;
  });

  // ===== NEW JARVIS-LEVEL HANDLERS =====

  // Clipboard Operations
  ipcMain.handle("clipboard-read", async () => {
    try {
      return {
        text: clipboard.readText(),
        html: clipboard.readHTML(),
        image: clipboard.readImage().isEmpty() ? null : clipboard.readImage().toDataURL(),
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("clipboard-write", async (event, { text, html }) => {
    try {
      if (text) clipboard.writeText(text);
      if (html) clipboard.writeHTML(html);
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  // Screenshot
  ipcMain.handle("take-screenshot", async () => {
    try {
      const img = await screenshot({ format: "png" });
      return {
        success: true,
        data: img.toString("base64"),
        mimeType: "image/png",
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  // System Notifications
  ipcMain.handle("send-notification", async (event, { title, body, icon }) => {
    try {
      const notification = new Notification({
        title: title || "Theta AI",
        body: body || "",
        icon: icon || undefined,
      });
      notification.show();
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  // HTTP Request (for external APIs)
  ipcMain.handle("http-fetch", async (event, args) => {
    const parsed = HttpFetchSchema.safeParse(args);
    if (!parsed.success) {
      return { error: "Invalid input", details: parsed.error.issues };
    }

    const { url, method, headers, body } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "HTTP Request",
        detail: `${(method || "GET").toUpperCase()} ${url}`,
        payload: parsed.data,
        source: "http-fetch",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      const response = await axios({
        url,
        method: method || "GET",
        headers: headers || {},
        data: body || undefined,
        timeout: 30000,
      });
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (e) {
      return {
        error: e.message,
        status: e.response?.status,
        data: e.response?.data,
      };
    }
  });

  // Detailed System Info
  ipcMain.handle("get-detailed-system-info", async () => {
    try {
      const [cpu, mem, graphics, os, network, battery, fsSize] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.osInfo(),
        si.networkInterfaces(),
        si.battery(),
        si.fsSize(),
      ]);
      return { cpu, mem, graphics, os, network, battery, fsSize };
    } catch (e) {
      return { error: e.message };
    }
  });

  // Window Control
  ipcMain.handle("window-control", async (event, { action }) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { error: "No focused window" };

      switch (action) {
        case "minimize":
          win.minimize();
          break;
        case "maximize":
          win.isMaximized() ? win.unmaximize() : win.maximize();
          break;
        case "close":
          win.close();
          break;
        case "fullscreen":
          win.setFullScreen(!win.isFullScreen());
          break;
      }
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  // Get Running Processes (for task management)
  ipcMain.handle("get-processes", async () => {
    try {
      const processes = await si.processes();
      // Return top 20 by CPU usage
      const sorted = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 20)
        .map((p) => ({ name: p.name, pid: p.pid, cpu: p.cpu, mem: p.mem }));
      return sorted;
    } catch (e) {
      return { error: e.message };
    }
  });

  // Kill Process
  ipcMain.handle("kill-process", async (event, args) => {
    const parsed = KillProcessSchema.safeParse(args);
    if (!parsed.success) {
      return { error: "Invalid input", details: parsed.error.issues };
    }

    const { pid } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Process Termination",
        detail: `Kill PID ${pid}`,
        payload: parsed.data,
        source: "kill-process",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      process.kill(pid);
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("request-action-approval", async (event, payload = {}) => {
    const { action, detail, source, rawPayload } = payload;
    return requestRendererApproval({
      action: action || "Action Request",
      detail: detail || "No details provided",
      payload: rawPayload || null,
      source: source || "request-action-approval",
    });
  });

  ipcMain.handle("submit-action-approval", async (event, payload = {}) => {
    const { requestId, approved } = payload;
    const pending = pendingApprovalRequests.get(requestId);
    if (!pending) return { success: false, error: "Approval request not found or expired." };

    clearTimeout(pending.timeout);
    pendingApprovalRequests.delete(requestId);

    if (approved) {
      await appendApprovalAuditLog({
        ...pending.payload,
        approved: true,
        approvedAt: Date.now(),
      });
    }

    pending.resolve({ approved: approved === true, risk: pending.payload.risk });
    return { success: true };
  });

  // ===== WHATSAPP AUTOMATION - POWERSHELL SENDKEYS =====
  ipcMain.handle("send-whatsapp-keyboard", async (event, { name, message }) => {
    try {
      if (!name || !message) {
        return {
          success: false,
          error: "Both contact name and message are required.",
        };
      }

      console.log(`\n========== WHATSAPP AUTOMATION START ==========`);
      console.log(`[WhatsApp Robot] Contact: ${name}`);
      console.log(`[WhatsApp Robot] Message: ${message}`);
      console.log(`[WhatsApp Robot] Time: ${new Date().toLocaleTimeString()}`);
      console.log(`[WhatsApp Robot] Method: PowerShell SendKeys`);

      const escapeForSendKeys = (value) =>
        value
          .replace(/\+/g, "{+}")
          .replace(/\^/g, "{^}")
          .replace(/%/g, "{%}")
          .replace(/~/g, "{~}")
          .replace(/\(/g, "{(}")
          .replace(/\)/g, "{)}")
          .replace(/\[/g, "{[}")
          .replace(/\]/g, "{]}")
          .replace(/\{/g, "{{}")
          .replace(/\}/g, "{}}")
          .replace(/'/g, "''");

      const safeName = escapeForSendKeys(String(name));
      const safeMessage = escapeForSendKeys(String(message));

      const psScript = [
        "Add-Type -AssemblyName System.Windows.Forms",
        'Start-Process "whatsapp:"',
        "Start-Sleep -Seconds 4",
        "[System.Windows.Forms.SendKeys]::SendWait('^n')",
        "Start-Sleep -Milliseconds 1200",
        `[System.Windows.Forms.SendKeys]::SendWait('${safeName}')`,
        "Start-Sleep -Milliseconds 1200",
        "[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')",
        "Start-Sleep -Milliseconds 700",
        `[System.Windows.Forms.SendKeys]::SendWait('${safeMessage}')`,
        "Start-Sleep -Milliseconds 500",
        "[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')",
      ].join("; ");

      return await new Promise((resolve) => {
        exec(
          `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`,
          { timeout: 90000 },
          (error, stdout, stderr) => {
            if (error) {
              resolve({
                success: false,
                error: error.message,
                stdout,
                stderr,
                method: "powershell_sendkeys",
              });
              return;
            }

            resolve({
              success: true,
              output: stdout,
              stderr,
              method: "powershell_sendkeys",
            });
          }
        );
      });
    } catch (error) {
      console.error(`\n========== CRITICAL ERROR ==========`);
      console.error(error);
      console.error(`========== ERROR END ==========\n`);

      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ===== WINDOW CONTROLS =====  // Press specific keys (Enter, Tab, Escape, etc.)
  ipcMain.handle("keyboard-press", async (event, { key }) => {
    try {
      // Map common key names to SendKeys format
      const keyMap = {
        enter: "{ENTER}",
        tab: "{TAB}",
        escape: "{ESC}",
        backspace: "{BACKSPACE}",
        delete: "{DELETE}",
        up: "{UP}",
        down: "{DOWN}",
        left: "{LEFT}",
        right: "{RIGHT}",
        home: "{HOME}",
        end: "{END}",
        pageup: "{PGUP}",
        pagedown: "{PGDN}",
        f1: "{F1}",
        f2: "{F2}",
        f3: "{F3}",
        f4: "{F4}",
        f5: "{F5}",
        f6: "{F6}",
        f7: "{F7}",
        f8: "{F8}",
        f9: "{F9}",
        f10: "{F10}",
        f11: "{F11}",
        f12: "{F12}",
        "ctrl+a": "^a",
        "ctrl+c": "^c",
        "ctrl+v": "^v",
        "ctrl+x": "^x",
        "ctrl+z": "^z",
        "ctrl+s": "^s",
        "ctrl+enter": "^{ENTER}",
        "alt+f4": "%{F4}",
        "alt+tab": "%{TAB}",
      };

      const lowerKey = key.toLowerCase();
      const sendKey = keyMap[lowerKey] || key;

      // Built-in delay: If it's Enter, ALWAYS wait 8 seconds.
      const isEnter = lowerKey === "enter";

      const psCommand = isEnter
        ? `Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Seconds 8; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`
        : `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`;

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 30000 }, (error, stdout, stderr) => {
          if (error) {
            resolve({ error: error.message });
          } else {
            resolve({ success: true, key: sendKey, delayed: isEnter });
          }
        });
      });
    } catch (e) {
      return { error: e.message };
    }
  });

  // Type text and optionally press Enter
  ipcMain.handle("keyboard-type", async (event, { text, pressEnter }) => {
    try {
      // Escape special SendKeys characters
      const escapedText = text
        .replace(/\+/g, "{+}")
        .replace(/\^/g, "{^}")
        .replace(/%/g, "{%}")
        .replace(/~/g, "{~}")
        .replace(/\(/g, "{(}")
        .replace(/\)/g, "{)}")
        .replace(/\[/g, "{[}")
        .replace(/\]/g, "{]}")
        .replace(/\{/g, "{{}")
        .replace(/\}/g, "{}}");

      let psCommand;
      if (pressEnter) {
        // If pressing enter, type text, WAIT 2 SECONDS, then press Enter
        psCommand = `
          Add-Type -AssemblyName System.Windows.Forms;
          [System.Windows.Forms.SendKeys]::SendWait('${escapedText}');
          Start-Sleep -Seconds 5;
          [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
        `;
      } else {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')`;
      }

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 20000 }, (error, stdout, stderr) => {
          if (error) {
            resolve({ error: error.message });
          } else {
            resolve({ success: true, typed: text, enterPressed: pressEnter });
          }
        });
      });
    } catch (e) {
      return { error: e.message };
    }
  });

  // ===== AUTO-UPDATE HANDLERS =====
  ipcMain.handle("check-for-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) {
      return { success: false, skipped: true, reason: "Updates are disabled in development mode." };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("download-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) {
      return { success: false, skipped: true, reason: "Updates are disabled in development mode." };
    }

    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle("install-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) {
      return { success: false, skipped: true, reason: "Updates are disabled in development mode." };
    }

    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });

  ipcMain.handle("get-app-version", async () => {
    return app.getVersion();
  });
}

let wakeWordProcess = null;

function resolveWakeWordScriptPath() {
  const candidates = [
    path.join(process.cwd(), "wake_word_bg.py"),
    path.join(__dirname, "../wake_word_bg.py"),
    path.join(process.resourcesPath || "", "wake_word_bg.py"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(__dirname, "../wake_word_bg.py");
}

function resolvePythonExecutable() {
  const explicitPath = process.env.Theta_PYTHON_PATH;
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  if (process.platform === "win32") {
    const venvPython = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    if (fs.existsSync(venvPython)) {
      return venvPython;
    }
  }

  return "python";
}

function startWakeWordDetector(mainWindow) {
  if (wakeWordProcess) return;

  const pythonExecutable = resolvePythonExecutable();
  const wakeWordScript = resolveWakeWordScriptPath();
  console.log(`Starting Wake Word Detector (Python): ${pythonExecutable}`);
  wakeWordProcess = spawn(pythonExecutable, [wakeWordScript]);

  wakeWordProcess.stdout.on("data", (data) => {
    try {
      const output = data.toString().trim();
      const lines = output.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        const result = JSON.parse(line);
        // Forward all events (WAKE_WORD, INFO, ERROR) to the UI
        mainWindow.webContents.send("wake-word-detected", result);
      }
    } catch (e) {
      console.error("Error parsing wake word output:", e);
    }
  });

  wakeWordProcess.stderr.on("data", (data) => {
    console.error(`Wake Word Error: ${data}`);
  });

  wakeWordProcess.on("close", (code) => {
    console.log(`Wake word process exited with code ${code}`);
    wakeWordProcess = null;
  });
}

app.whenReady().then(async () => {
  const { session } = require("electron");
  console.log(`Security mode: ${relaxedLocalSecurity ? "RELAXED_LOCAL" : "STRICT"}`);
  console.log(`Approval gate: ${requireActionApproval ? "ENABLED" : "DISABLED"}`);

  const postgresReady = await ensurePostgresPersistence();
  if (postgresReady) {
    await migrateLegacyStateToPostgres();
  }

  migrateAndDeleteLegacySecretKey().catch((error) => {
    console.error("Legacy key migration failed:", error.message);
  });
  setupPermissions(session);

  // CSP policy for renderer responses
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
    console.error("Failed to bootstrap task reminders:", error.message);
  });

  const mainWindow = createWindow();

  // ===== AUTO-UPDATE EVENTS =====
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    if (mainWindow) {
      mainWindow.webContents.send("update-available", {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");
  });

  autoUpdater.on("download-progress", (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send("update-download-progress", {
        percent: Math.round(progress.percent),
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded");
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("Update error:", err.message);
  });

  // Check for updates 5 seconds after app start
  if (app.isPackaged || allowDevUpdates) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log("Update check failed:", err.message);
      });
    }, 5000);
  } else {
    console.log("Skipping automatic update check in development mode.");
  }

  // Connect wake word detector to main window
  if (mainWindow) startWakeWordDetector(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      startWakeWordDetector(win);
    }
  });
});

app.on("window-all-closed", () => {
  // Cleanup production server
  if (productionServer) {
    productionServer.close();
    productionServer = null;
  }

  if (persistencePool) {
    persistencePool.end().catch((error) => {
      console.error("Failed to close PostgreSQL pool:", error.message);
    });
    persistencePool = null;
  }

  if (wakeWordProcess) {
    wakeWordProcess.kill();
    wakeWordProcess = null;
  }

  if (process.platform !== "darwin") app.quit();
});
