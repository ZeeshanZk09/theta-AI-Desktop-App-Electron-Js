/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "node:fs";
import * as path from "node:path";

import { app } from "electron";
import { Pool } from "pg";

import { logger } from "../utils/logger";

export const PERSISTENCE_KEYS = Object.freeze({
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

const getMemoryPath = () => path.join(app.getPath("userData"), "memories.json");
const getUserProfilePath = () => path.join(app.getPath("userData"), "user_profile.json");
const getDashboardSettingsPath = () => path.join(app.getPath("userData"), "dashboard_settings.json");
const getDashboardModulesStatePath = () => path.join(app.getPath("userData"), "dashboard_modules_state.json");
const getFolderConfigPath = () => path.join(app.getPath("userData"), "imported_folders.json");
const getVaultPath = () => path.join(process.cwd(), "Theta_Vault");
const getLinkedInQueuePath = () => path.join(getVaultPath(), "BUSINESS", "linkedin_queue.json");
const getLinkedInHistoryPath = () => path.join(getVaultPath(), "BUSINESS", "linkedin_post_history.json");
const getHistoryPath = () => path.join(app.getPath("userData"), "history.json");
const getHistorySettingsPath = () => path.join(app.getPath("userData"), "history_settings.json");
const getContactsPath = () => path.join(app.getPath("userData"), "contacts.json");
const getNotesPath = () => path.join(app.getPath("userData"), "notes.json");
const getTasksPath = () => path.join(app.getPath("userData"), "tasks.json");
const getTaskRemindersPath = () => path.join(app.getPath("userData"), "task_reminders.json");
const getApprovalAuditPath = () => path.join(app.getPath("userData"), "approval_audit_log.json");

const legacyPersistenceFileGetters: Record<string, () => string> = {
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

export const POSTGRES_TABLE_NAME = "theta_persistent_state";
const postgresConnectionString = process.env.THETA_DATABASE_URL || process.env.DATABASE_URL;
export let persistencePool: Pool | null = null;
export let persistenceBackend: "postgres" | "file" = "file";
let persistenceInitAttempted = false;

export const getLegacyPersistencePath = (key: string): string | null => {
  const getter = legacyPersistenceFileGetters[key];
  return typeof getter === "function" ? getter() : null;
};

export const getPostgresConfig = () => {
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

export const ensurePostgresPersistence = async (): Promise<boolean> => {
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
    logger.log("Persistence backend: PostgreSQL");
    return true;
  } catch (error: any) {
    logger.error(
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

const ensureParentDir = (filePath: string) => {
  try {
    const parent = path.dirname(filePath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
  } catch (error: any) {
    logger.error("Failed to ensure parent directory:", error.message);
  }
};

export const readJsonFileSafe = (filePath: string, fallbackValue: any) => {
  try {
    if (!fs.existsSync(filePath)) return fallbackValue;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

export const writeJsonFileSafe = (filePath: string, value: any) => {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
};

export const readPersistedState = async (key: string, fallbackValue: any) => {
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
    } catch (error: any) {
      logger.error(`Failed to read persisted state for key "${key}":`, error.message);
    }
  }

  if (legacyPath) {
    return readJsonFileSafe(legacyPath, fallbackValue);
  }

  return fallbackValue;
};

export const writePersistedState = async (key: string, value: any): Promise<boolean> => {
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
    } catch (error: any) {
      logger.error(`Failed to write persisted state for key "${key}":`, error.message);
    }
  }

  if (legacyPath) {
    try {
      writeJsonFileSafe(legacyPath, normalizedValue);
      return true;
    } catch (error: any) {
      logger.error(`Failed to write legacy state for key "${key}":`, error.message);
      return false;
    }
  }

  return false;
};

export const clearPersistedState = async (key: string): Promise<boolean> => {
  const legacyPath = getLegacyPersistencePath(key);

  if (persistenceBackend === "postgres" && persistencePool) {
    try {
      await persistencePool.query(`DELETE FROM ${POSTGRES_TABLE_NAME} WHERE key = $1`, [key]);
      return true;
    } catch (error: any) {
      logger.error(`Failed to clear persisted state for key "${key}":`, error.message);
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

export const migrateLegacyStateToPostgres = async () => {
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
      logger.log(`Migrated legacy persisted state: ${key}`);
    } catch (error: any) {
      logger.error(`Failed to migrate legacy state for key "${key}":`, error.message);
    }
  }
};
