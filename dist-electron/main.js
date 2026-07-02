"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var path8 = __toESM(require("path"));
var import_electron5 = require("electron");
var import_electron_updater2 = require("electron-updater");

// electron/core/windowManager.ts
var path = __toESM(require("path"));
var import_electron = require("electron");

// electron/utils/logger.ts
var logger = {
  log: (...args) => {
    console.log("[Theta Backend]", ...args);
  },
  warn: (...args) => {
    console.warn("[Theta Backend WARNING]", ...args);
  },
  error: (...args) => {
    console.error("[Theta Backend ERROR]", ...args);
  },
  info: (...args) => {
    console.info("[Theta Backend INFO]", ...args);
  },
  debug: (...args) => {
    console.debug("[Theta Backend DEBUG]", ...args);
  }
};

// electron/core/windowManager.ts
var mainWindow = null;
var relaxedLocalSecurity = false;
var allowDevUpdates = false;
var requireActionApproval = true;
var getEnvFlag = (name, fallback) => {
  const val = process.env[name];
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return fallback;
};
var initializeFlags = () => {
  relaxedLocalSecurity = getEnvFlag("VITE_RELAXED_SECURITY", false);
  allowDevUpdates = getEnvFlag("VITE_ALLOW_DEV_UPDATES", false);
  requireActionApproval = getEnvFlag("VITE_REQUIRE_ACTION_APPROVAL", true);
};
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0a0a0a",
      symbolColor: "#ffffff",
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !relaxedLocalSecurity
    },
    show: false
  });
  mainWindow.setMenu(null);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import_electron.shell.openExternal(url).then(() => {
      logger.log(`Opened URL: ${url}`);
    }).catch((err) => {
      logger.error(`Failed to open URL: ${url}`, err);
    });
    return { action: "deny" };
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).then(() => {
      logger.log(`Loaded URL: ${process.env.VITE_DEV_SERVER_URL}`);
    }).catch((err) => {
      logger.error(`Failed to load URL: ${process.env.VITE_DEV_SERVER_URL}`, err);
    });
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html")).then(() => {
      logger.log(`Loaded file: ${path.join(__dirname, "../dist/index.html")}`);
    }).catch((err) => {
      logger.error(`Failed to load file: ${path.join(__dirname, "../dist/index.html")}`, err);
    });
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  return mainWindow;
}
function setupPermissions(session2) {
  session2.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      "media",
      "clipboard-read",
      "clipboard-sanitized-write",
      "window-management",
      "fullscreen"
    ];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      logger.warn(`Permission denied: ${permission}`);
      callback(false);
    }
  });
  session2.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowedPermissions = [
      "media",
      "clipboard-read",
      "clipboard-sanitized-write",
      "window-management",
      "fullscreen"
    ];
    if (allowedPermissions.includes(permission)) {
      return true;
    }
    logger.warn(`Permission check denied: ${permission}`);
    return false;
  });
}

// electron/ipc/handlers.ts
var import_node_child_process2 = require("child_process");
var fs5 = __toESM(require("fs"));
var path6 = __toESM(require("path"));
var import_genai = require("@google/genai");
var import_axios = __toESM(require("axios"));
var import_electron4 = require("electron");
var import_electron_updater = require("electron-updater");
var mammoth = __toESM(require("mammoth"));
var mime = __toESM(require("mime-types"));
var import_screenshot_desktop = __toESM(require("screenshot-desktop"));

// electron/services/ai.ts
var fs = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var import_electron2 = require("electron");
var keytar = __toESM(require("keytar"));
var GEMINI_TOKEN_SERVICE_NAME = "theta-ai-gemini-token";
var GEMINI_TOKEN_ACCOUNT_NAME = "default-user";
function getLegacySecretKeyPath() {
  return path2.join(import_electron2.app.getPath("userData"), "secret_key.json");
}
function getGeminiTokenFallbackPath() {
  return path2.join(import_electron2.app.getPath("userData"), "gemini_token_fallback.txt");
}
function readGeminiTokenFallback() {
  try {
    const fallbackPath = getGeminiTokenFallbackPath();
    if (!fs.existsSync(fallbackPath)) return null;
    const token = fs.readFileSync(fallbackPath, "utf8").trim();
    return token || null;
  } catch {
    return null;
  }
}
function writeGeminiTokenFallback(token) {
  try {
    if (typeof token !== "string" || !token.trim()) return false;
    fs.writeFileSync(getGeminiTokenFallbackPath(), token.trim(), "utf8");
    return true;
  } catch {
    return false;
  }
}
async function migrateAndDeleteLegacySecretKey() {
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
        logger.warn("Keytar migration fallback will use local token file:", error.message);
      }
      writeGeminiTokenFallback(legacyApiKey.trim());
    }
    fs.unlinkSync(legacyPath);
    logger.log("Migrated and removed legacy secret_key.json from userData.");
  } catch (error) {
    logger.error("Failed to migrate legacy secret key:", error.message);
  }
}
async function getGeminiToken() {
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
async function saveGeminiToken(token) {
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
      logger.warn("Keytar save failed. Falling back to local token file:", error.message);
    }
    const fallbackSaved = writeGeminiTokenFallback(normalized);
    return keytarSaved || fallbackSaved;
  } catch (e) {
    return false;
  }
}

// electron/services/database.ts
var fs2 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var import_electron3 = require("electron");
var import_pg = require("pg");
var PERSISTENCE_KEYS = Object.freeze({
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
  approvalAuditLog: "approval_audit_log"
});
var getMemoryPath = () => path3.join(import_electron3.app.getPath("userData"), "memories.json");
var getUserProfilePath = () => path3.join(import_electron3.app.getPath("userData"), "user_profile.json");
var getDashboardSettingsPath = () => path3.join(import_electron3.app.getPath("userData"), "dashboard_settings.json");
var getDashboardModulesStatePath = () => path3.join(import_electron3.app.getPath("userData"), "dashboard_modules_state.json");
var getFolderConfigPath = () => path3.join(import_electron3.app.getPath("userData"), "imported_folders.json");
var getVaultPath = () => path3.join(process.cwd(), "Theta_Vault");
var getLinkedInQueuePath = () => path3.join(getVaultPath(), "BUSINESS", "linkedin_queue.json");
var getLinkedInHistoryPath = () => path3.join(getVaultPath(), "BUSINESS", "linkedin_post_history.json");
var getHistoryPath = () => path3.join(import_electron3.app.getPath("userData"), "history.json");
var getHistorySettingsPath = () => path3.join(import_electron3.app.getPath("userData"), "history_settings.json");
var getContactsPath = () => path3.join(import_electron3.app.getPath("userData"), "contacts.json");
var getNotesPath = () => path3.join(import_electron3.app.getPath("userData"), "notes.json");
var getTasksPath = () => path3.join(import_electron3.app.getPath("userData"), "tasks.json");
var getTaskRemindersPath = () => path3.join(import_electron3.app.getPath("userData"), "task_reminders.json");
var getApprovalAuditPath = () => path3.join(import_electron3.app.getPath("userData"), "approval_audit_log.json");
var legacyPersistenceFileGetters = {
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
  [PERSISTENCE_KEYS.approvalAuditLog]: getApprovalAuditPath
};
var POSTGRES_TABLE_NAME = "theta_persistent_state";
var postgresConnectionString = process.env.THETA_DATABASE_URL || process.env.DATABASE_URL;
var persistencePool = null;
var persistenceBackend = "file";
var persistenceInitAttempted = false;
var getLegacyPersistencePath = (key) => {
  const getter = legacyPersistenceFileGetters[key];
  return typeof getter === "function" ? getter() : null;
};
var getPostgresConfig = () => {
  const sslRequired = process.env.THETA_PG_SSL === "true" || process.env.PGSSLMODE === "require" || process.env.PGSSLMODE === "verify-ca" || process.env.PGSSLMODE === "verify-full";
  const sharedConfig = {
    max: Number(process.env.THETA_PG_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.THETA_PG_IDLE_TIMEOUT_MS || 3e4),
    connectionTimeoutMillis: Number(process.env.THETA_PG_CONNECT_TIMEOUT_MS || 1e4),
    ssl: sslRequired ? { rejectUnauthorized: false } : void 0
  };
  if (postgresConnectionString) {
    return {
      connectionString: postgresConnectionString,
      ...sharedConfig
    };
  }
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD || "",
      database: process.env.PGDATABASE,
      ...sharedConfig
    };
  }
  return null;
};
var ensurePostgresPersistence = async () => {
  if (persistenceInitAttempted) {
    return persistenceBackend === "postgres";
  }
  persistenceInitAttempted = true;
  const pgConfig = getPostgresConfig();
  if (!pgConfig) {
    logger.warn("Persistence backend: file (PostgreSQL config missing)");
    return false;
  }
  try {
    persistencePool = new import_pg.Pool(pgConfig);
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
    logger.log("Persistence backend: PostgreSQL");
    return true;
  } catch (error) {
    logger.error(
      "Failed to initialize PostgreSQL persistence. Falling back to file storage.",
      error.message
    );
    if (persistencePool) {
      try {
        await persistencePool.end();
      } catch {
      }
      persistencePool = null;
    }
    persistenceBackend = "file";
    return false;
  }
};
var ensureParentDir = (filePath) => {
  try {
    const parent = path3.dirname(filePath);
    if (!fs2.existsSync(parent)) {
      fs2.mkdirSync(parent, { recursive: true });
    }
  } catch (error) {
    logger.error("Failed to ensure parent directory:", error.message);
  }
};
var readJsonFileSafe = (filePath, fallbackValue) => {
  try {
    if (!fs2.existsSync(filePath)) return fallbackValue;
    const parsed = JSON.parse(fs2.readFileSync(filePath, "utf8"));
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};
var writeJsonFileSafe = (filePath, value) => {
  ensureParentDir(filePath);
  fs2.writeFileSync(filePath, JSON.stringify(value, null, 2));
};
var readPersistedState = async (key, fallbackValue) => {
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
        const legacyValue = readJsonFileSafe(legacyPath, void 0);
        if (legacyValue !== void 0) {
          await writePersistedState(key, legacyValue);
          return legacyValue;
        }
      }
      return fallbackValue;
    } catch (error) {
      logger.error(`Failed to read persisted state for key "${key}":`, error.message);
    }
  }
  if (legacyPath) {
    return readJsonFileSafe(legacyPath, fallbackValue);
  }
  return fallbackValue;
};
var writePersistedState = async (key, value) => {
  const normalizedValue = value === void 0 ? null : value;
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
      logger.error(`Failed to write persisted state for key "${key}":`, error.message);
    }
  }
  if (legacyPath) {
    try {
      writeJsonFileSafe(legacyPath, normalizedValue);
      return true;
    } catch (error) {
      logger.error(`Failed to write legacy state for key "${key}":`, error.message);
      return false;
    }
  }
  return false;
};
var clearPersistedState = async (key) => {
  const legacyPath = getLegacyPersistencePath(key);
  if (persistenceBackend === "postgres" && persistencePool) {
    try {
      await persistencePool.query(`DELETE FROM ${POSTGRES_TABLE_NAME} WHERE key = $1`, [key]);
      return true;
    } catch (error) {
      logger.error(`Failed to clear persisted state for key "${key}":`, error.message);
    }
  }
  if (legacyPath) {
    try {
      if (fs2.existsSync(legacyPath)) {
        fs2.unlinkSync(legacyPath);
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
};
var migrateLegacyStateToPostgres = async () => {
  if (persistenceBackend !== "postgres" || !persistencePool) return;
  const keys = Object.values(PERSISTENCE_KEYS);
  for (const key of keys) {
    const legacyPath = getLegacyPersistencePath(key);
    if (!legacyPath || !fs2.existsSync(legacyPath)) continue;
    try {
      const existing = await persistencePool.query(
        `SELECT 1 FROM ${POSTGRES_TABLE_NAME} WHERE key = $1 LIMIT 1`,
        [key]
      );
      if (existing.rows.length > 0) continue;
      const legacyValue = readJsonFileSafe(legacyPath, void 0);
      if (legacyValue === void 0) continue;
      await writePersistedState(key, legacyValue);
      logger.log(`Migrated legacy persisted state: ${key}`);
    } catch (error) {
      logger.error(`Failed to migrate legacy state for key "${key}":`, error.message);
    }
  }
};

// electron/services/system.ts
var import_node_child_process = require("child_process");
var fs3 = __toESM(require("fs"));
var path4 = __toESM(require("path"));
var si = __toESM(require("systeminformation"));
var BLOCKED_COMMAND_PATTERNS = [
  /rm\s+-rf\s+\//,
  /rmdir\s+\/s\s+\/q\s+[a-zA-Z]:\\/i,
  /del\s+\/f\s+\/s\s+\/q\s+[a-zA-Z]:\\/i,
  /mkfs/,
  /dd\s+if=/,
  /format\s+[a-zA-Z]:/i,
  />\s*\/dev\/(sda|hda|nvme)/,
  />\s*\\\\.\\PhysicalDrive/
];
var wakeWordProcess = null;
function resolveWakeWordScriptPath() {
  const candidates = [
    path4.join(process.cwd(), "wake_word_bg.py"),
    path4.join(__dirname, "../wake_word_bg.py"),
    path4.join(process.resourcesPath || "", "wake_word_bg.py")
  ];
  for (const candidate of candidates) {
    if (candidate && fs3.existsSync(candidate)) {
      return candidate;
    }
  }
  return path4.join(__dirname, "../wake_word_bg.py");
}
function resolvePythonExecutable() {
  const explicitPath = process.env.Theta_PYTHON_PATH;
  if (explicitPath && fs3.existsSync(explicitPath)) {
    return explicitPath;
  }
  if (process.platform === "win32") {
    const venvPython = path4.join(process.cwd(), ".venv", "Scripts", "python.exe");
    if (fs3.existsSync(venvPython)) {
      return venvPython;
    }
  }
  return "python";
}
function startWakeWordDetector(mainWindow2) {
  if (wakeWordProcess) return;
  const pythonExecutable = resolvePythonExecutable();
  const wakeWordScript = resolveWakeWordScriptPath();
  logger.log(`Starting Wake Word Detector (Python): ${pythonExecutable}`);
  try {
    wakeWordProcess = (0, import_node_child_process.spawn)(pythonExecutable, [wakeWordScript]);
    wakeWordProcess.stdout?.on("data", (data) => {
      try {
        const output = data.toString().trim();
        const lines = output.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          const result = JSON.parse(line);
          mainWindow2.webContents.send("wake-word-detected", result);
        }
      } catch (e) {
        logger.error("Error parsing wake word output:", e);
      }
    });
    wakeWordProcess.stderr?.on("data", (data) => {
      logger.error(`Wake Word Error: ${data}`);
    });
    wakeWordProcess.on("close", (code) => {
      logger.log(`Wake word process exited with code ${code}`);
      wakeWordProcess = null;
    });
  } catch (error) {
    logger.error("Failed to start wake word detector:", error);
  }
}
function killWakeWordProcess() {
  if (wakeWordProcess) {
    wakeWordProcess.kill();
    wakeWordProcess = null;
  }
}
async function getDetailedSystemInfo() {
  const [cpu2, mem2, graphics2, os, network, battery2, fsSize2] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.osInfo(),
    si.networkInterfaces(),
    si.battery(),
    si.fsSize()
  ]);
  return { cpu: cpu2, mem: mem2, graphics: graphics2, os, network, battery: battery2, fsSize: fsSize2 };
}
async function getProcesses() {
  const processes2 = await si.processes();
  const sorted = processes2.list.sort((a, b) => b.cpu - a.cpu).slice(0, 20).map((p) => ({ name: p.name, pid: p.pid, cpu: p.cpu, mem: p.mem }));
  return sorted;
}
function killProcess(pid) {
  process.kill(pid);
}
function execCommand(command) {
  return new Promise((resolve2) => {
    (0, import_node_child_process.exec)(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve2({ success: !error, stdout, stderr, error: error?.message });
    });
  });
}

// electron/utils/schemas.ts
var import_zod = require("zod");
var FsOpSchema = import_zod.z.object({
  operation: import_zod.z.enum(["read-dir", "create-dir", "write-file", "read-file", "delete", "exists"]),
  path: import_zod.z.string().min(1).max(4096).refine((p) => !p.includes(".."), { message: "Path traversal not allowed" }),
  content: import_zod.z.string().optional()
}).superRefine((value, ctx) => {
  if (value.operation === "write-file" && typeof value.content !== "string") {
    ctx.addIssue({
      code: "custom",
      message: "content is required for write-file operation",
      path: ["content"]
    });
  }
});
var ExecCommandSchema = import_zod.z.object({
  command: import_zod.z.string().min(1).max(2e3)
});
var HttpFetchSchema = import_zod.z.object({
  url: import_zod.z.string().min(1).max(2048).regex(/^https?:\/\//i, { message: "Invalid URL" }),
  method: import_zod.z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).optional(),
  headers: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).optional(),
  body: import_zod.z.any().optional()
});
var KillProcessSchema = import_zod.z.object({
  pid: import_zod.z.number().int().positive()
});
var SemanticWorkspaceSearchSchema = import_zod.z.object({
  query: import_zod.z.string().min(2).max(400),
  maxResults: import_zod.z.number().int().min(1).max(30).optional(),
  maxFiles: import_zod.z.number().int().min(20).max(4e3).optional(),
  rootPath: import_zod.z.string().min(1).max(4096).optional()
});

// electron/utils/semanticSearch.ts
var fs4 = __toESM(require("fs"));
var path5 = __toESM(require("path"));
var SEMANTIC_SEARCH_IGNORED_DIRS = /* @__PURE__ */ new Set([
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
  "Documents"
]);
var SEMANTIC_SEARCH_ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([
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
  ".env"
]);
var SEMANTIC_SYNONYM_MAP = {
  ai: ["assistant", "model", "intelligence"],
  auth: ["authentication", "login", "signin", "token"],
  bug: ["issue", "error", "fix", "failure"],
  config: ["configuration", "setting", "env", "option"],
  db: ["database", "postgres", "postgresql", "sql"],
  linkedin: ["post", "draft", "queue", "publish"],
  memory: ["memories", "profile", "history", "preferences"],
  performance: ["optimize", "speed", "latency", "slow"],
  search: ["find", "lookup", "discover", "query"]
};
var escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
var countOccurrences = (text = "", term = "") => {
  if (!text || !term) return 0;
  const regex = new RegExp(escapeRegex(term), "g");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};
var buildSemanticTerms = (query = "") => {
  const baseTokens = String(query).toLowerCase().split(/[^a-z0-9_]+/).filter((token) => token.length >= 2);
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
var resolveSearchRootPath = (requestedRootPath) => {
  const workspaceRoot = path5.resolve(process.cwd());
  if (!requestedRootPath) return workspaceRoot;
  const candidate = path5.resolve(requestedRootPath);
  if (candidate.startsWith(workspaceRoot)) {
    return candidate;
  }
  return workspaceRoot;
};
var collectWorkspaceTextFiles = (rootPath, maxFiles) => {
  const resolvedRoot = path5.resolve(rootPath);
  const queue = [resolvedRoot];
  const files = [];
  const maxFileBytes = 1e6;
  while (queue.length > 0 && files.length < maxFiles) {
    const currentDir = queue.pop();
    if (!currentDir) continue;
    let entries = [];
    try {
      entries = fs4.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path5.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (SEMANTIC_SEARCH_IGNORED_DIRS.has(entry.name)) continue;
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path5.extname(entry.name).toLowerCase();
      if (!SEMANTIC_SEARCH_ALLOWED_EXTENSIONS.has(extension)) continue;
      try {
        const stat = fs4.statSync(fullPath);
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
var scoreSemanticMatch = ({
  query,
  terms,
  relativePath,
  content
}) => {
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
var extractSemanticSnippets = ({
  content,
  terms,
  query,
  maxSnippets = 3
}) => {
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
        text: line.trim()
      });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, maxSnippets).map((item) => ({ line: item.line, text: item.text.slice(0, 240) }));
};

// electron/ipc/handlers.ts
var pdf = require("pdf-parse");
var pendingApprovalRequests = /* @__PURE__ */ new Map();
var taskReminderTimers = /* @__PURE__ */ new Map();
var estimateRiskLevel = (action = "", detail = "") => {
  const text = `${action} ${detail}`.toLowerCase();
  if (/shutdown|restart|format|rm\s+-rf|rmdir|del\s+\/|powershell|kill|delete|reg\s+add|sc\s+config|taskkill/i.test(text)) {
    return "red";
  }
  if (/http request|post |put |patch |delete |filesystem|write-file|create-dir/i.test(text)) {
    return "yellow";
  }
  return "green";
};
var readApprovalAuditLog = async () => {
  const value = await readPersistedState(PERSISTENCE_KEYS.approvalAuditLog, []);
  return Array.isArray(value) ? value : [];
};
var appendApprovalAuditLog = async (entry) => {
  try {
    const current = await readApprovalAuditLog();
    const updated = [entry, ...current].slice(0, 1e3);
    await writePersistedState(PERSISTENCE_KEYS.approvalAuditLog, updated);
  } catch (err) {
    const error = err;
    logger.error("Failed to append approval audit log:", error.message);
  }
};
var requestRendererApproval = async ({ action, detail, payload, source }) => {
  if (!requireActionApproval) {
    return { approved: true, bypassed: true, risk: estimateRiskLevel(action, detail) };
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { approved: false, error: "No active UI window available for approval." };
  }
  const risk = estimateRiskLevel(action, detail);
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return new Promise((resolve2) => {
    const timeout = setTimeout(() => {
      if (pendingApprovalRequests.has(requestId)) {
        pendingApprovalRequests.delete(requestId);
        resolve2({ approved: false, timeout: true, risk });
      }
    }, 12e4);
    pendingApprovalRequests.set(requestId, {
      resolve: resolve2,
      timeout,
      payload: {
        requestId,
        action,
        detail,
        payload,
        source: source || "unknown",
        risk,
        requestedAt: Date.now()
      }
    });
    mainWindow?.webContents.send("action-approval-requested", {
      requestId,
      action,
      detail,
      payload,
      source: source || "unknown",
      risk,
      requestedAt: Date.now()
    });
  });
};
var readTaskReminders = async () => {
  const value = await readPersistedState(PERSISTENCE_KEYS.taskReminders, []);
  return Array.isArray(value) ? value : [];
};
var writeTaskReminders = async (tasks = []) => {
  try {
    await writePersistedState(PERSISTENCE_KEYS.taskReminders, tasks);
  } catch (err) {
    const error = err;
    logger.error("Failed to write task reminders file:", error.message);
  }
};
var clearTaskReminderTimer = (taskId) => {
  const timer = taskReminderTimers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    taskReminderTimers.delete(taskId);
  }
};
var scheduleTaskReminderTimer = (task) => {
  if (!task?.id) return;
  clearTaskReminderTimer(task.id);
  if (!task.reminder || !task.dueAt) return;
  const dueTimestamp = new Date(task.dueAt).getTime();
  if (!Number.isFinite(dueTimestamp)) return;
  const delay = dueTimestamp - Date.now();
  if (delay <= 0) return;
  const timer = setTimeout(async () => {
    try {
      const notification = new import_electron4.Notification({
        title: "Task Reminder",
        body: task.text || "You have a pending task reminder."
      });
      notification.show();
    } catch (err) {
      const error = err;
      logger.error("Failed to trigger task reminder notification:", error.message);
    }
    taskReminderTimers.delete(task.id);
    const reminders = await readTaskReminders();
    const remaining = reminders.filter((item) => item.id !== task.id);
    await writeTaskReminders(remaining);
  }, delay);
  taskReminderTimers.set(task.id, timer);
};
var syncTaskRemindersInternal = async (tasks = []) => {
  taskReminderTimers.forEach((timer, id) => {
    clearTimeout(timer);
    taskReminderTimers.delete(id);
  });
  const reminderTasks = tasks.filter((task) => task?.id && task?.reminder && task?.dueAt);
  await writeTaskReminders(reminderTasks);
  reminderTasks.forEach(scheduleTaskReminderTimer);
};
var bootstrapTaskReminders = async () => {
  const reminders = await readTaskReminders();
  reminders.forEach(scheduleTaskReminderTimer);
};
function registerHandlers() {
  import_electron4.ipcMain.handle("load-memories", async () => {
    try {
      const memories = await readPersistedState(PERSISTENCE_KEYS.memories, []);
      return Array.isArray(memories) ? memories : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load memories:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-memories", async (event, memories) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.memories, memories);
    } catch (err) {
      const e = err;
      logger.error("Failed to save memories:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-user-profile", async () => {
    try {
      const profile = await readPersistedState(PERSISTENCE_KEYS.userProfile, {});
      return profile && typeof profile === "object" ? profile : {};
    } catch (err) {
      const e = err;
      logger.error("Failed to load user profile:", e?.message || e);
      return {};
    }
  });
  import_electron4.ipcMain.handle("save-user-profile", async (event, profile) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.userProfile, profile);
    } catch (err) {
      const e = err;
      logger.error("Failed to save user profile:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-dashboard-settings", async () => {
    try {
      const fallback = { interests: ["Tech", "Pakistan", "Global Economy"], refreshInterval: 3600 };
      const settings = await readPersistedState(PERSISTENCE_KEYS.dashboardSettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (err) {
      const e = err;
      logger.error("Failed to load dashboard settings:", e?.message || e);
      return { interests: [], refreshInterval: 3600 };
    }
  });
  import_electron4.ipcMain.handle("save-dashboard-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.dashboardSettings, settings);
    } catch (err) {
      const e = err;
      logger.error("Failed to save dashboard settings:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-dashboard-modules-state", async () => {
    const fallback = {
      moduleOrder: ["businessIdeas", "newsWorld", "marketTrends", "linkedinQueue"],
      collapsed: {},
      visibility: {
        headlinesWeather: false,
        businessIdeas: true,
        newsWorld: true,
        marketTrends: true,
        linkedinQueue: true
      },
      dailyTimes: { businessIdeas: "08:00", linkedinPosts: "09:00" },
      refreshIntervals: { worldIntelligenceHours: 4 },
      businessIdeas: { date: "", ideas: [] },
      worldIntelligence: { events: [], stories: [], trends: [], generatedAt: 0 },
      linkedinDrafts: { date: "", drafts: [] }
    };
    const state = await readPersistedState(PERSISTENCE_KEYS.dashboardModulesState, fallback);
    return state && typeof state === "object" ? state : fallback;
  });
  import_electron4.ipcMain.handle("save-dashboard-modules-state", async (event, state) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.dashboardModulesState, state);
    } catch {
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-linkedin-queue", async () => {
    const queue = await readPersistedState(PERSISTENCE_KEYS.linkedInQueue, []);
    return Array.isArray(queue) ? queue : [];
  });
  import_electron4.ipcMain.handle("save-linkedin-queue", async (event, queue) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.linkedInQueue, Array.isArray(queue) ? queue : []);
    } catch {
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-linkedin-history", async () => {
    const history = await readPersistedState(PERSISTENCE_KEYS.linkedInHistory, []);
    return Array.isArray(history) ? history : [];
  });
  import_electron4.ipcMain.handle("save-linkedin-history", async (event, history) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.linkedInHistory, Array.isArray(history) ? history : []);
    } catch {
      return false;
    }
  });
  import_electron4.ipcMain.handle("fetch-dashboard-data", async (event, { location, interests }) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const prompt = `Search for top 5 news headlines for: ${interests.join(", ")} in ${location || "Pakistan"}. Also get weather. Respond in ROMAN URDU and return JSON: {"headlines": [...], "weather": {"today": "...", "tomorrow": "...", "dayAfter": "..."}}`;
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { tools: [{ googleSearch: {} }] }
      });
      const text = result.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { headlines: ["Error parsing data"], weather: { today: "N/A" } };
    } catch (err) {
      const e = err;
      return { headlines: [`Error: ${e.message}`], weather: { today: "Error \u26A0\uFE0F" } };
    }
  });
  import_electron4.ipcMain.handle("load-histsory", async () => {
    try {
      const history = await readPersistedState(PERSISTENCE_KEYS.history, []);
      return Array.isArray(history) ? history : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load history:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-history", async (event, history) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.history, history);
    } catch (err) {
      const e = err;
      logger.error("Failed to save history:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("clear-history", async () => {
    try {
      return await clearPersistedState(PERSISTENCE_KEYS.history);
    } catch (err) {
      const e = err;
      logger.error("Failed to clear history:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-history-settings", async () => {
    try {
      const fallback = { maxContextMessages: 20, storeHistory: true };
      const settings = await readPersistedState(PERSISTENCE_KEYS.historySettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (err) {
      const e = err;
      logger.error("Failed to load history settings:", e?.message || e);
      return { maxContextMessages: 20, storeHistory: true };
    }
  });
  import_electron4.ipcMain.handle("save-history-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.historySettings, settings);
    } catch (err) {
      const e = err;
      logger.error("Failed to save history settings:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-contacts", async () => {
    try {
      const contacts = await readPersistedState(PERSISTENCE_KEYS.contacts, []);
      return Array.isArray(contacts) ? contacts : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load contacts:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-contacts", async (event, contacts) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.contacts, contacts);
    } catch (err) {
      const e = err;
      logger.error("Failed to save contacts:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-notes", async () => {
    try {
      const notes = await readPersistedState(PERSISTENCE_KEYS.notes, []);
      return Array.isArray(notes) ? notes : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load notes:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-notes", async (event, notes) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.notes, notes);
    } catch (err) {
      const e = err;
      logger.error("Failed to save notes:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-tasks", async () => {
    try {
      const tasks = await readPersistedState(PERSISTENCE_KEYS.tasks, []);
      return Array.isArray(tasks) ? tasks : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load tasks:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-tasks", async (event, tasks) => {
    try {
      await writePersistedState(PERSISTENCE_KEYS.tasks, tasks);
      if (Array.isArray(tasks)) {
        await syncTaskRemindersInternal(tasks);
      }
      return true;
    } catch (err) {
      const e = err;
      logger.error("Failed to save tasks:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("schedule-task-reminder", async (event, payload = {}) => {
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
    } catch (err) {
      const e = err;
      return { success: false, error: e.message };
    }
  });
  import_electron4.ipcMain.handle("sync-task-reminders", async (event, payload = {}) => {
    try {
      const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
      await syncTaskRemindersInternal(tasks);
      return { success: true };
    } catch (err) {
      const e = err;
      return { success: false, error: e.message };
    }
  });
  import_electron4.ipcMain.handle("load-approval-audit-log", async () => {
    return await readApprovalAuditLog();
  });
  import_electron4.ipcMain.handle("clear-approval-audit-log", async () => {
    try {
      return await clearPersistedState(PERSISTENCE_KEYS.approvalAuditLog);
    } catch {
      return false;
    }
  });
  import_electron4.ipcMain.handle("initialize-vault", async () => {
    try {
      const vaultBase = path6.join(process.cwd(), "Theta_Vault");
      if (!fs5.existsSync(vaultBase)) fs5.mkdirSync(vaultBase, { recursive: true });
      const folderNames = ["DOCS", "BUSINESS", "EXCEL"];
      folderNames.forEach((folder) => {
        const p = path6.join(vaultBase, folder);
        if (!fs5.existsSync(p)) fs5.mkdirSync(p, { recursive: true });
      });
      return { vaultBase, folderNames };
    } catch (err) {
      const e = err;
      logger.error("Failed to initialize vault:", e?.message || e);
      return null;
    }
  });
  import_electron4.ipcMain.handle("open-vault-folder", async (event, folderName) => {
    try {
      const folderPath = path6.join(process.cwd(), "Theta_Vault", folderName);
      const open = (await import("open")).default;
      await open(folderPath);
      return true;
    } catch (err) {
      const e = err;
      logger.error("Failed to open vault folder:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("load-imported-folders", async () => {
    try {
      const folders = await readPersistedState(PERSISTENCE_KEYS.importedFolders, []);
      return Array.isArray(folders) ? folders : [];
    } catch (err) {
      const e = err;
      logger.error("Failed to load imported folders:", e?.message || e);
      return [];
    }
  });
  import_electron4.ipcMain.handle("save-imported-folders", async (event, folders) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.importedFolders, folders);
    } catch (err) {
      const e = err;
      logger.error("Failed to save imported folders:", e?.message || e);
      return false;
    }
  });
  import_electron4.ipcMain.handle("get-persistence-status", async () => {
    return {
      backend: persistenceBackend,
      postgresEnabled: persistenceBackend === "postgres",
      postgresConfigured: Boolean(getPostgresConfig()),
      table: POSTGRES_TABLE_NAME
    };
  });
  import_electron4.ipcMain.handle("pick-folder", async () => {
    const { canceled, filePaths } = await import_electron4.dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Folder to Import"
    });
    if (canceled || filePaths.length === 0) return null;
    return { name: path6.basename(filePaths[0]), path: filePaths[0] };
  });
  import_electron4.ipcMain.handle("semantic-workspace-search", async (event, args = {}) => {
    const parsed = SemanticWorkspaceSearchSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, error: "Invalid semantic search payload.", details: parsed.error.issues };
    }
    const { query, maxResults = 10, maxFiles = 900, rootPath } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Semantic Workspace Search",
        detail: `Query: ${query.slice(0, 160)}`,
        payload: parsed.data,
        source: "semantic-workspace-search"
      });
      if (!decision.approved) return { success: false, error: "User denied semantic workspace search." };
    }
    try {
      const resolvedRoot = resolveSearchRootPath(rootPath);
      const candidateFiles = collectWorkspaceTextFiles(resolvedRoot, maxFiles);
      const terms = buildSemanticTerms(query);
      const ranked = [];
      for (const filePath of candidateFiles) {
        let content = "";
        try {
          content = fs5.readFileSync(filePath, "utf8");
        } catch {
          continue;
        }
        if (!content || content.includes("\0")) continue;
        const relativePath = path6.relative(resolvedRoot, filePath).split(path6.sep).join("/");
        const score = scoreSemanticMatch({ query, terms, relativePath, content });
        if (score <= 0) continue;
        const snippets = extractSemanticSnippets({ content, terms, query, maxSnippets: 3 });
        let stat = null;
        try {
          stat = fs5.statSync(filePath);
        } catch {
          stat = null;
        }
        ranked.push({
          path: relativePath,
          score,
          snippets,
          sizeBytes: stat?.size || 0,
          modifiedAt: stat?.mtime ? stat.mtime.toISOString() : null
        });
      }
      ranked.sort((a, b) => b.score - a.score);
      return {
        success: true,
        query,
        rootPath: resolvedRoot,
        searchedFiles: candidateFiles.length,
        matchedFiles: ranked.length,
        results: ranked.slice(0, maxResults)
      };
    } catch (err) {
      const e = err;
      return { success: false, error: e.message };
    }
  });
  import_electron4.ipcMain.handle("get-gemini-token", async () => {
    return await getGeminiToken();
  });
  import_electron4.ipcMain.handle("save-gemini-token", async (event, token) => {
    return await saveGeminiToken(token);
  });
  import_electron4.ipcMain.handle("system-fs-op", async (event, args) => {
    const parsed = FsOpSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };
    const { operation, path: targetPath, content } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Filesystem Operation",
        detail: `${operation} on ${targetPath}`,
        payload: parsed.data,
        source: "system-fs-op"
      });
      if (!decision.approved) return { error: "User denied the action." };
    }
    try {
      switch (operation) {
        case "read-dir":
          return fs5.readdirSync(targetPath);
        case "create-dir":
          if (!fs5.existsSync(targetPath)) fs5.mkdirSync(targetPath, { recursive: true });
          return true;
        case "write-file":
          fs5.writeFileSync(targetPath, content || "");
          return true;
        case "read-file":
          return fs5.readFileSync(targetPath, "utf8");
        case "delete":
          fs5.rmSync(targetPath, { recursive: true, force: true });
          return true;
        case "exists":
          return fs5.existsSync(targetPath);
        default:
          throw new Error("Unknown operation");
      }
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("system-open", async (event, { target }) => {
    try {
      const open = (await import("open")).default;
      await open(target);
      return true;
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("system-exec-command", async (event, args) => {
    const parsed = ExecCommandSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };
    const { command } = parsed.data;
    if (BLOCKED_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
      return { error: "Command blocked by security policy." };
    }
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Shell Command",
        detail: command,
        payload: parsed.data,
        source: "system-exec-command"
      });
      if (!decision.approved) return { error: "User denied the action." };
    }
    return await execCommand(command);
  });
  import_electron4.ipcMain.handle("save-image", async (event, { base64Data }) => {
    try {
      const filePath = path6.join(import_electron4.app.getPath("downloads"), `Theta_ai_${Date.now()}.png`);
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
      fs5.writeFileSync(filePath, buffer);
      return filePath;
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("read-file-content", async (event, { path: filePath }) => {
    try {
      if (!fs5.existsSync(filePath)) return { error: "File not found" };
      const mimeType = mime.lookup(filePath) || "";
      const buffer = fs5.readFileSync(filePath);
      if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        return { content: data.text };
      } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer });
        return { content: result.value };
      } else if (mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/javascript") {
        return { content: buffer.toString("utf8") };
      }
      return { content: `[Binary/Image File: ${path6.basename(filePath)}]. The content of this file is visual or binary.` };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("pick-and-read-files", async () => {
    const { canceled, filePaths } = await import_electron4.dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Multimodal Files", extensions: ["jpg", "png", "jpeg", "webp", "pdf", "doc", "docx", "txt", "mp3", "wav", "mpeg"] }]
    });
    if (canceled) return [];
    const results = [];
    for (const filePath of filePaths) {
      const stats = fs5.statSync(filePath);
      if (stats.size > 50 * 1024 * 1024) continue;
      const buffer = fs5.readFileSync(filePath);
      const mimeType = mime.lookup(filePath) || "application/octet-stream";
      results.push({ name: path6.basename(filePath), data: buffer.toString("base64"), mimeType, path: filePath });
    }
    return results;
  });
  import_electron4.ipcMain.handle("clipboard-read", async () => {
    try {
      return {
        text: import_electron4.clipboard.readText(),
        html: import_electron4.clipboard.readHTML(),
        image: import_electron4.clipboard.readImage().isEmpty() ? null : import_electron4.clipboard.readImage().toDataURL()
      };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("clipboard-write", async (event, { text, html }) => {
    try {
      if (text) import_electron4.clipboard.writeText(text);
      if (html) import_electron4.clipboard.writeHTML(html);
      return { success: true };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("take-screenshot", async () => {
    try {
      const img = await (0, import_screenshot_desktop.default)({ format: "png" });
      return { success: true, data: img.toString("base64"), mimeType: "image/png" };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("send-notification", async (event, { title, body, icon }) => {
    try {
      const notification = new import_electron4.Notification({ title: title || "Theta AI", body: body || "", icon: icon || void 0 });
      notification.show();
      return { success: true };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("http-fetch", async (event, args) => {
    const parsed = HttpFetchSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };
    const { url, method, headers, body } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "HTTP Request",
        detail: `${(method || "GET").toUpperCase()} ${url}`,
        payload: parsed.data,
        source: "http-fetch"
      });
      if (!decision.approved) return { error: "User denied the action." };
    }
    try {
      const response = await (0, import_axios.default)({ url, method: method || "GET", headers: headers || {}, data: body || void 0, timeout: 3e4 });
      return { success: true, status: response.status, data: response.data, headers: response.headers };
    } catch (err) {
      const e = err;
      const axiosError = e;
      return { error: e.message, status: axiosError.response?.status, data: axiosError.response?.data };
    }
  });
  import_electron4.ipcMain.handle("get-detailed-system-info", async () => {
    return await getDetailedSystemInfo();
  });
  import_electron4.ipcMain.handle("window-control", async (event, { action }) => {
    try {
      const win = import_electron4.BrowserWindow.getFocusedWindow();
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
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("get-processes", async () => {
    return await getProcesses();
  });
  import_electron4.ipcMain.handle("kill-process", async (event, args) => {
    const parsed = KillProcessSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };
    const { pid } = parsed.data;
    if (requireActionApproval) {
      const decision = await requestRendererApproval({
        action: "Process Termination",
        detail: `Kill PID ${pid}`,
        payload: parsed.data,
        source: "kill-process"
      });
      if (!decision.approved) return { error: "User denied the action." };
    }
    try {
      killProcess(pid);
      return { success: true };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("request-action-approval", async (event, payload = {}) => {
    const { action, detail, source, rawPayload } = payload;
    return requestRendererApproval({
      action: action || "Action Request",
      detail: detail || "No details provided",
      payload: rawPayload || null,
      source: source || "request-action-approval"
    });
  });
  import_electron4.ipcMain.handle("submit-action-approval", async (event, payload = {}) => {
    const { requestId, approved } = payload;
    const pending = pendingApprovalRequests.get(requestId);
    if (!pending) return { success: false, error: "Approval request not found or expired." };
    clearTimeout(pending.timeout);
    pendingApprovalRequests.delete(requestId);
    if (approved) {
      await appendApprovalAuditLog({ ...pending.payload, approved: true, approvedAt: Date.now() });
    }
    pending.resolve({ approved: approved === true, risk: pending.payload.risk });
    return { success: true };
  });
  import_electron4.ipcMain.handle("send-whatsapp-keyboard", async (event, { name, message }) => {
    try {
      if (!name || !message) return { success: false, error: "Both contact name and message are required." };
      const escapeForSendKeys = (value) => value.replace(/\+/g, "{+}").replace(/\^/g, "{^}").replace(/%/g, "{%}").replace(/~/g, "{~}").replace(/\(/g, "{(}").replace(/\)/g, "{)}").replace(/\[/g, "{[}").replace(/\]/g, "{]}").replace(/\{/g, "{{}").replace(/\}/g, "{}}").replace(/'/g, "''");
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
        "[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')"
      ].join("; ");
      return await new Promise((resolve2) => {
        (0, import_node_child_process2.exec)(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, { timeout: 9e4 }, (error, stdout, stderr) => {
          if (error) resolve2({ success: false, error: error.message, stdout, stderr, method: "powershell_sendkeys" });
          else resolve2({ success: true, output: stdout, stderr, method: "powershell_sendkeys" });
        });
      });
    } catch (err) {
      const e = err;
      return { success: false, error: e.message };
    }
  });
  import_electron4.ipcMain.handle("keyboard-press", async (event, { key }) => {
    try {
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
        "alt+tab": "%{TAB}"
      };
      const lowerKey = key.toLowerCase();
      const sendKey = keyMap[lowerKey] || key;
      const isEnter = lowerKey === "enter";
      const psCommand = isEnter ? `Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Seconds 8; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')` : `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`;
      return new Promise((resolve2) => {
        (0, import_node_child_process2.exec)(`powershell -Command "${psCommand}"`, { timeout: 3e4 }, (error) => {
          if (error) resolve2({ error: error.message });
          else resolve2({ success: true, key: sendKey, delayed: isEnter });
        });
      });
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("keyboard-type", async (event, { text, pressEnter }) => {
    try {
      const escapedText = text.toString().replace(/\+/g, "{+}").replace(/\^/g, "{^}").replace(/%/g, "{%}").replace(/~/g, "{~}").replace(/\(/g, "{(}").replace(/\)/g, "{)}").replace(/\[/g, "{[}").replace(/\]/g, "{]}").replace(/\{/g, "{{}").replace(/\}/g, "{}}");
      let psCommand;
      if (pressEnter) {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}'); Start-Sleep -Seconds 5; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`;
      } else {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')`;
      }
      return new Promise((resolve2) => {
        (0, import_node_child_process2.exec)(`powershell -Command "${psCommand}"`, { timeout: 2e4 }, (error) => {
          if (error) resolve2({ error: error.message });
          else resolve2({ success: true, typed: text, enterPressed: pressEnter });
        });
      });
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("check-for-update", async () => {
    if (!import_electron4.app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    try {
      const result = await import_electron_updater.autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("download-update", async () => {
    if (!import_electron4.app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    try {
      await import_electron_updater.autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      const e = err;
      return { error: e.message };
    }
  });
  import_electron4.ipcMain.handle("install-update", async () => {
    if (!import_electron4.app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    import_electron_updater.autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });
  import_electron4.ipcMain.handle("get-app-version", async () => {
    return import_electron4.app.getVersion();
  });
}

// electron/utils/server.ts
var fs6 = __toESM(require("fs"));
var http = __toESM(require("http"));
var path7 = __toESM(require("path"));
function startProductionServer(distPath, initialPort = 45678) {
  return new Promise((resolve2, reject) => {
    let currentPort = initialPort;
    const productionServer2 = http.createServer((req, res) => {
      const filePath = path7.join(distPath, req.url === "/" ? "index.html" : req.url || "");
      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      const extname3 = path7.extname(filePath).toLowerCase();
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
        ".ico": "image/x-icon"
      };
      const contentType = mimeTypes[extname3] || "application/octet-stream";
      fs6.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === "ENOENT") {
            fs6.readFile(path7.join(distPath, "index.html"), (err, indexContent) => {
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
    productionServer2.listen(currentPort, "127.0.0.1", () => {
      logger.log(`Production server running at http://localhost:${currentPort}`);
      resolve2(currentPort);
    });
    productionServer2.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        currentPort++;
        productionServer2.listen(currentPort, "127.0.0.1");
      } else {
        reject(err);
      }
    });
  });
}

// electron/main.ts
var productionServer = null;
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
      "object-src 'none'"
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
    "object-src 'none'"
  ].join("; ") + ";";
}
import_electron5.app.whenReady().then(async () => {
  initializeFlags();
  logger.log(`Security mode: ${relaxedLocalSecurity ? "RELAXED_LOCAL" : "STRICT"}`);
  logger.log(`Approval gate: ${requireActionApproval ? "ENABLED" : "DISABLED"}`);
  if (!process.env.VITE_DEV_SERVER_URL) {
    logger.log("Starting production fallback server...");
    try {
      const distPath = path8.join(__dirname, "../dist");
      await startProductionServer(distPath, 45678);
    } catch (e) {
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
  setupPermissions(import_electron5.session);
  import_electron5.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = getRendererCsp();
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp]
      }
    });
  });
  registerHandlers();
  bootstrapTaskReminders().catch((error) => {
    logger.error("Failed to bootstrap task reminders:", error.message);
  });
  const mainWindow2 = createWindow();
  import_electron_updater2.autoUpdater.on("checking-for-update", () => logger.log("Checking for updates..."));
  import_electron_updater2.autoUpdater.on("update-available", (info) => {
    logger.log("Update available:", info.version);
    mainWindow2?.webContents.send("update-available", { version: info.version, releaseDate: info.releaseDate });
  });
  import_electron_updater2.autoUpdater.on("update-not-available", () => logger.log("No updates available"));
  import_electron_updater2.autoUpdater.on("download-progress", (progress) => {
    mainWindow2?.webContents.send("update-download-progress", {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });
  import_electron_updater2.autoUpdater.on("update-downloaded", () => {
    logger.log("Update downloaded");
    mainWindow2?.webContents.send("update-downloaded");
  });
  import_electron_updater2.autoUpdater.on("error", (err) => logger.error("Update error:", err.message));
  if (import_electron5.app.isPackaged || allowDevUpdates) {
    setTimeout(() => {
      import_electron_updater2.autoUpdater.checkForUpdates().catch((err) => logger.log("Update check failed:", err.message));
    }, 5e3);
  } else {
    logger.log("Skipping automatic update check in development mode.");
  }
  if (mainWindow2) startWakeWordDetector(mainWindow2);
  import_electron5.app.on("activate", () => {
    if (import_electron5.BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      startWakeWordDetector(win);
    }
  });
}).then(() => {
  import_electron5.app.on("window-all-closed", () => {
    if (productionServer) {
      productionServer.close();
      productionServer = null;
    }
    if (persistencePool) {
      persistencePool.end().catch((error) => {
        logger.error("Failed to close PostgreSQL pool:", error instanceof Error ? error.message : error);
      });
    }
    killWakeWordProcess();
    if (process.platform !== "darwin") import_electron5.app.quit();
  });
}).catch((error) => {
  logger.error("Failed to initialize application:", error.message);
});
import_electron5.app.on("window-all-closed", () => {
  if (productionServer) {
    productionServer.close();
    productionServer = null;
  }
  if (persistencePool) {
    persistencePool.end().catch((error) => {
      logger.error("Failed to close PostgreSQL pool:", error instanceof Error ? error.message : error);
    });
  }
  killWakeWordProcess();
  if (process.platform !== "darwin") import_electron5.app.quit();
});
//# sourceMappingURL=main.js.map