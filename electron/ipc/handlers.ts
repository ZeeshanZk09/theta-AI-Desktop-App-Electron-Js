/* eslint-disable @typescript-eslint/no-explicit-any */
import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { GoogleGenAI } from "@google/genai";
import axios, { type AxiosError } from "axios";
import { ipcMain, app, dialog, BrowserWindow, clipboard , Notification } from "electron";
import { autoUpdater } from "electron-updater";
import * as mammoth from "mammoth";
import * as mime from "mime-types";
const pdf = require("pdf-parse") as (dataBuffer: Buffer) => Promise<{ text: string }>;
import screenshot from "screenshot-desktop";

import { requireActionApproval, allowDevUpdates, mainWindow } from "../core/windowManager";
import { getGeminiToken, saveGeminiToken } from "../services/ai";
import {
  readPersistedState,
  writePersistedState,
  clearPersistedState,
  PERSISTENCE_KEYS,
  persistenceBackend,
  getPostgresConfig,
  POSTGRES_TABLE_NAME,
} from "../services/database";
import { getDetailedSystemInfo, getProcesses, killProcess, execCommand, BLOCKED_COMMAND_PATTERNS } from "../services/system";
import { logger } from "../utils/logger";
import {
  SemanticWorkspaceSearchSchema,
  FsOpSchema,
  ExecCommandSchema,
  HttpFetchSchema,
  KillProcessSchema,
} from "../utils/schemas";
import {
  resolveSearchRootPath,
  collectWorkspaceTextFiles,
  buildSemanticTerms,
  scoreSemanticMatch,
  extractSemanticSnippets,
} from "../utils/semanticSearch";

const pendingApprovalRequests = new Map();
const taskReminderTimers = new Map();

const estimateRiskLevel = (action = "", detail = "") => {
  const text = `${action} ${detail}`.toLowerCase();
  if (/shutdown|restart|format|rm\s+-rf|rmdir|del\s+\/|powershell|kill|delete|reg\s+add|sc\s+config|taskkill/i.test(text)) {
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

const appendApprovalAuditLog = async (entry: any) => {
  try {
    const current = await readApprovalAuditLog();
    const updated = [entry, ...current].slice(0, 1000);
    await writePersistedState(PERSISTENCE_KEYS.approvalAuditLog, updated);
  } catch (err) { const error = err as Error; 
    logger.error("Failed to append approval audit log:", error.message);
  }
};

export const requestRendererApproval = async ({ action, detail, payload, source }: any) => {
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

    mainWindow?.webContents.send("action-approval-requested", {
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

const writeTaskReminders = async (tasks: any[] = []) => {
  try {
    await writePersistedState(PERSISTENCE_KEYS.taskReminders, tasks);
  } catch (err) { const error = err as Error; 
    logger.error("Failed to write task reminders file:", error.message);
  }
};

const clearTaskReminderTimer = (taskId: string) => {
  const timer = taskReminderTimers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    taskReminderTimers.delete(taskId);
  }
};

const scheduleTaskReminderTimer = (task: any) => {
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
    } catch (err) { const error = err as Error; 
      logger.error("Failed to trigger task reminder notification:", error.message);
    }

    taskReminderTimers.delete(task.id);
    const reminders = await readTaskReminders();
    const remaining = reminders.filter((item) => item.id !== task.id);
    await writeTaskReminders(remaining);
  }, delay);

  taskReminderTimers.set(task.id, timer);
};

const syncTaskRemindersInternal = async (tasks: any[] = []) => {
  taskReminderTimers.forEach((timer, id) => {
    clearTimeout(timer);
    taskReminderTimers.delete(id);
  });

  const reminderTasks = tasks.filter((task) => task?.id && task?.reminder && task?.dueAt);
  await writeTaskReminders(reminderTasks);
  reminderTasks.forEach(scheduleTaskReminderTimer);
};

export const bootstrapTaskReminders = async () => {
  const reminders = await readTaskReminders();
  reminders.forEach(scheduleTaskReminderTimer);
};

export function registerHandlers() {
  ipcMain.handle("load-memories", async () => {
    try {
      const memories = await readPersistedState(PERSISTENCE_KEYS.memories, []);
      return Array.isArray(memories) ? memories : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load memories:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-memories", async (event, memories) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.memories, memories);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save memories:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-user-profile", async () => {
    try {
      const profile = await readPersistedState(PERSISTENCE_KEYS.userProfile, {});
      return profile && typeof profile === "object" ? profile : {};
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load user profile:", e?.message || e);
      return {};
    }
  });

  ipcMain.handle("save-user-profile", async (event, profile) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.userProfile, profile);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save user profile:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-dashboard-settings", async () => {
    try {
      const fallback = { interests: ["Tech", "Pakistan", "Global Economy"], refreshInterval: 3600 };
      const settings = await readPersistedState(PERSISTENCE_KEYS.dashboardSettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load dashboard settings:", e?.message || e);
      return { interests: [], refreshInterval: 3600 };
    }
  });

  ipcMain.handle("save-dashboard-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.dashboardSettings, settings);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save dashboard settings:", e?.message || e);
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
      dailyTimes: { businessIdeas: "08:00", linkedinPosts: "09:00" },
      refreshIntervals: { worldIntelligenceHours: 4 },
      businessIdeas: { date: "", ideas: [] },
      worldIntelligence: { events: [], stories: [], trends: [], generatedAt: 0 },
      linkedinDrafts: { date: "", drafts: [] },
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
      return await writePersistedState(PERSISTENCE_KEYS.linkedInQueue, Array.isArray(queue) ? queue : []);
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
      return await writePersistedState(PERSISTENCE_KEYS.linkedInHistory, Array.isArray(history) ? history : []);
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
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = result.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { headlines: ["Error parsing data"], weather: { today: "N/A" } };
    } catch (err) {  const e = err as Error;
      return { headlines: [`Error: ${e.message}`], weather: { today: "Error ⚠️" } };
    }
  });

  ipcMain.handle("load-histsory", async () => {
    try {
      const history = await readPersistedState(PERSISTENCE_KEYS.history, []);
      return Array.isArray(history) ? history : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load history:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-history", async (event, history) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.history, history);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save history:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("clear-history", async () => {
    try {
      return await clearPersistedState(PERSISTENCE_KEYS.history);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to clear history:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-history-settings", async () => {
    try {
      const fallback = { maxContextMessages: 20, storeHistory: true };
      const settings = await readPersistedState(PERSISTENCE_KEYS.historySettings, fallback);
      return settings && typeof settings === "object" ? settings : fallback;
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load history settings:", e?.message || e);
      return { maxContextMessages: 20, storeHistory: true };
    }
  });

  ipcMain.handle("save-history-settings", async (event, settings) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.historySettings, settings);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save history settings:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-contacts", async () => {
    try {
      const contacts = await readPersistedState(PERSISTENCE_KEYS.contacts, []);
      return Array.isArray(contacts) ? contacts : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load contacts:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-contacts", async (event, contacts) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.contacts, contacts);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save contacts:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-notes", async () => {
    try {
      const notes = await readPersistedState(PERSISTENCE_KEYS.notes, []);
      return Array.isArray(notes) ? notes : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load notes:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-notes", async (event, notes) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.notes, notes);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save notes:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-tasks", async () => {
    try {
      const tasks = await readPersistedState(PERSISTENCE_KEYS.tasks, []);
      return Array.isArray(tasks) ? tasks : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load tasks:", e?.message || e);
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
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save tasks:", e?.message || e);
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
    } catch (err) {  const e = err as Error;
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("sync-task-reminders", async (event, payload = {}) => {
    try {
      const tasks = Array.isArray(payload?.tasks) ? payload.tasks : [];
      await syncTaskRemindersInternal(tasks);
      return { success: true };
    } catch (err) {  const e = err as Error;
      return { success: false, error: e.message };
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

  ipcMain.handle("initialize-vault", async () => {
    try {
      const vaultBase = path.join(process.cwd(), "Theta_Vault");
      if (!fs.existsSync(vaultBase)) fs.mkdirSync(vaultBase, { recursive: true });
      const folderNames = ["DOCS", "BUSINESS", "EXCEL"];
      folderNames.forEach((folder) => {
        const p = path.join(vaultBase, folder);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      });
      return { vaultBase, folderNames };
    } catch (err) {  const e = err as Error;
      logger.error("Failed to initialize vault:", e?.message || e);
      return null;
    }
  });

  ipcMain.handle("open-vault-folder", async (event, folderName) => {
    try {
      const folderPath = path.join(process.cwd(), "Theta_Vault", folderName);
      const open = (await import("open")).default;
      await open(folderPath);
      return true;
    } catch (err) {
      const e = err as Error ;
      logger.error("Failed to open vault folder:", e?.message || e);
      return false;
    }
  });

  ipcMain.handle("load-imported-folders", async () => {
    try {
      const folders = await readPersistedState(PERSISTENCE_KEYS.importedFolders, []);
      return Array.isArray(folders) ? folders : [];
    } catch (err) {  const e = err as Error;
      logger.error("Failed to load imported folders:", e?.message || e);
      return [];
    }
  });

  ipcMain.handle("save-imported-folders", async (event, folders) => {
    try {
      return await writePersistedState(PERSISTENCE_KEYS.importedFolders, folders);
    } catch (err) {  const e = err as Error;
      logger.error("Failed to save imported folders:", e?.message || e);
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
    return { name: path.basename(filePaths[0]), path: filePaths[0] };
  });

  ipcMain.handle("semantic-workspace-search", async (event, args = {}) => {
    const parsed = SemanticWorkspaceSearchSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, error: "Invalid semantic search payload.", details: parsed.error.issues };
    }

    const { query, maxResults = 10, maxFiles = 900, rootPath } = parsed.data;

    if (requireActionApproval) {
      const decision: any = await requestRendererApproval({
        action: "Semantic Workspace Search",
        detail: `Query: ${query.slice(0, 160)}`,
        payload: parsed.data,
        source: "semantic-workspace-search",
      });
      if (!decision.approved) return { success: false, error: "User denied semantic workspace search." };
    }

    try {
      const resolvedRoot = resolveSearchRootPath(rootPath);
      const candidateFiles = collectWorkspaceTextFiles(resolvedRoot, maxFiles);
      const terms = buildSemanticTerms(query);
      const ranked: any[] = [];

      for (const filePath of candidateFiles) {
        let content = "";
        try {
          content = fs.readFileSync(filePath, "utf8");
        } catch {
          continue;
        }

        if (!content || content.includes("\u0000")) continue;

        const relativePath = path.relative(resolvedRoot, filePath).split(path.sep).join("/");
        const score = scoreSemanticMatch({ query, terms, relativePath, content });

        if (score <= 0) continue;

        const snippets = extractSemanticSnippets({ content, terms, query, maxSnippets: 3 });

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
    } catch (err) {  const e = err as Error;
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("get-gemini-token", async () => {
    return await getGeminiToken();
  });

  ipcMain.handle("save-gemini-token", async (event, token) => {
    return await saveGeminiToken(token);
  });

  ipcMain.handle("system-fs-op", async (event, args) => {
    const parsed = FsOpSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };

    const { operation, path: targetPath, content } = parsed.data;
    if (requireActionApproval) {
      const decision: any = await requestRendererApproval({
        action: "Filesystem Operation",
        detail: `${operation} on ${targetPath}`,
        payload: parsed.data,
        source: "system-fs-op",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      switch (operation) {
        case "read-dir": return fs.readdirSync(targetPath);
        case "create-dir":
          if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
          return true;
        case "write-file":
          fs.writeFileSync(targetPath, content || "");
          return true;
        case "read-file": return fs.readFileSync(targetPath, "utf8");
        case "delete":
          fs.rmSync(targetPath, { recursive: true, force: true });
          return true;
        case "exists": return fs.existsSync(targetPath);
        default: throw new Error("Unknown operation");
      }
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("system-open", async (event, { target }) => {
    try {
      const open = (await import("open")).default;
      await open(target);
      return true;
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("system-exec-command", async (event, args) => {
    const parsed = ExecCommandSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };

    const { command } = parsed.data;
    if (BLOCKED_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) {
      return { error: "Command blocked by security policy." };
    }

    if (requireActionApproval) {
      const decision: any = await requestRendererApproval({
        action: "Shell Command",
        detail: command,
        payload: parsed.data,
        source: "system-exec-command",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    return await execCommand(command);
  });

  ipcMain.handle("save-image", async (event, { base64Data }) => {
    try {
      const filePath = path.join(app.getPath("downloads"), `Theta_ai_${Date.now()}.png`);
      const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("read-file-content", async (event, { path: filePath }) => {
    try {
      if (!fs.existsSync(filePath)) return { error: "File not found" };

      const mimeType = mime.lookup(filePath) || "";
      const buffer = fs.readFileSync(filePath);

      if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        return { content: data.text };
      } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer });
        return { content: result.value };
      } else if (mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/javascript") {
        return { content: buffer.toString("utf8") };
      }

      return { content: `[Binary/Image File: ${path.basename(filePath)}]. The content of this file is visual or binary.` };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("pick-and-read-files", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Multimodal Files", extensions: ["jpg", "png", "jpeg", "webp", "pdf", "doc", "docx", "txt", "mp3", "wav", "mpeg"] }],
    });

    if (canceled) return [];

    const results = [];
    for (const filePath of filePaths) {
      const stats = fs.statSync(filePath);
      if (stats.size > 50 * 1024 * 1024) continue;

      const buffer = fs.readFileSync(filePath);
      const mimeType = mime.lookup(filePath) || "application/octet-stream";
      results.push({ name: path.basename(filePath), data: buffer.toString("base64"), mimeType, path: filePath });
    }
    return results;
  });

  ipcMain.handle("clipboard-read", async () => {
    try {
      return {
        text: clipboard.readText(),
        html: clipboard.readHTML(),
        image: clipboard.readImage().isEmpty() ? null : clipboard.readImage().toDataURL(),
      };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("clipboard-write", async (event, { text, html }) => {
    try {
      if (text) clipboard.writeText(text);
      if (html) clipboard.writeHTML(html);
      return { success: true };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("take-screenshot", async () => {
    try {
      const img = await screenshot({ format: "png" });
      return { success: true, data: img.toString("base64"), mimeType: "image/png" };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("send-notification", async (event, { title, body, icon }) => {
    try {
      const notification = new Notification({ title: title || "Theta AI", body: body || "", icon: icon || undefined });
      notification.show();
      return { success: true };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("http-fetch", async (event, args) => {
    const parsed = HttpFetchSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };

    const { url, method, headers, body } = parsed.data;
    if (requireActionApproval) {
      const decision: any = await requestRendererApproval({
        action: "HTTP Request",
        detail: `${(method || "GET").toUpperCase()} ${url}`,
        payload: parsed.data,
        source: "http-fetch",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      const response = await axios({ url, method: method || "GET", headers: headers || {}, data: body || undefined, timeout: 30000 });
      return { success: true, status: response.status, data: response.data, headers: response.headers };
    } catch (err) {  const e = err as Error;
      const axiosError = e as AxiosError;
      return { error: e.message, status: axiosError.response?.status, data: axiosError.response?.data };
    }
  });

  ipcMain.handle("get-detailed-system-info", async () => {
    return await getDetailedSystemInfo();
  });

  ipcMain.handle("window-control", async (event, { action }) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { error: "No focused window" };

      switch (action) {
        case "minimize": win.minimize(); break;
        case "maximize": win.isMaximized() ? win.unmaximize() : win.maximize(); break;
        case "close": win.close(); break;
        case "fullscreen": win.setFullScreen(!win.isFullScreen()); break;
      }
      return { success: true };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("get-processes", async () => {
    return await getProcesses();
  });

  ipcMain.handle("kill-process", async (event, args) => {
    const parsed = KillProcessSchema.safeParse(args);
    if (!parsed.success) return { error: "Invalid input", details: parsed.error.issues };

    const { pid } = parsed.data;
    if (requireActionApproval) {
      const decision: any = await requestRendererApproval({
        action: "Process Termination",
        detail: `Kill PID ${pid}`,
        payload: parsed.data,
        source: "kill-process",
      });
      if (!decision.approved) return { error: "User denied the action." };
    }

    try {
      killProcess(pid);
      return { success: true };
    } catch (err) {  const e = err as Error;
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
      await appendApprovalAuditLog({ ...pending.payload, approved: true, approvedAt: Date.now() });
    }

    pending.resolve({ approved: approved === true, risk: pending.payload.risk });
    return { success: true };
  });

  ipcMain.handle("send-whatsapp-keyboard", async (event, { name, message }) => {
    try {
      if (!name || !message) return { success: false, error: "Both contact name and message are required." };

      const escapeForSendKeys = (value: string) =>
        value.replace(/\+/g, "{+}").replace(/\^/g, "{^}").replace(/%/g, "{%}").replace(/~/g, "{~}")
             .replace(/\(/g, "{(}").replace(/\)/g, "{)}").replace(/\[/g, "{[}").replace(/\]/g, "{]}")
             .replace(/\{/g, "{{}").replace(/\}/g, "{}}").replace(/'/g, "''");

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
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`, { timeout: 90000 }, (error, stdout, stderr) => {
          if (error) resolve({ success: false, error: error.message, stdout, stderr, method: "powershell_sendkeys" });
          else resolve({ success: true, output: stdout, stderr, method: "powershell_sendkeys" });
        });
      });
    } catch (err) {  const e = err as Error;
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("keyboard-press", async (event, { key }) => {
    try {
      const keyMap: Record<string, string> = {
        enter: "{ENTER}", tab: "{TAB}", escape: "{ESC}", backspace: "{BACKSPACE}", delete: "{DELETE}",
        up: "{UP}", down: "{DOWN}", left: "{LEFT}", right: "{RIGHT}", home: "{HOME}", end: "{END}",
        pageup: "{PGUP}", pagedown: "{PGDN}", f1: "{F1}", f2: "{F2}", f3: "{F3}", f4: "{F4}", f5: "{F5}",
        f6: "{F6}", f7: "{F7}", f8: "{F8}", f9: "{F9}", f10: "{F10}", f11: "{F11}", f12: "{F12}",
        "ctrl+a": "^a", "ctrl+c": "^c", "ctrl+v": "^v", "ctrl+x": "^x", "ctrl+z": "^z", "ctrl+s": "^s",
        "ctrl+enter": "^{ENTER}", "alt+f4": "%{F4}", "alt+tab": "%{TAB}",
      };

      const lowerKey = key.toLowerCase();
      const sendKey = keyMap[lowerKey] || key;
      const isEnter = lowerKey === "enter";

      const psCommand = isEnter
        ? `Add-Type -AssemblyName System.Windows.Forms; Start-Sleep -Seconds 8; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`
        : `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKey}')`;

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 30000 }, (error) => {
          if (error) resolve({ error: error.message });
          else resolve({ success: true, key: sendKey, delayed: isEnter });
        });
      });
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("keyboard-type", async (event, { text, pressEnter }) => {
    try {
      const escapedText = text.toString().replace(/\+/g, "{+}").replace(/\^/g, "{^}").replace(/%/g, "{%}").replace(/~/g, "{~}")
                              .replace(/\(/g, "{(}").replace(/\)/g, "{)}").replace(/\[/g, "{[}").replace(/\]/g, "{]}")
                              .replace(/\{/g, "{{}").replace(/\}/g, "{}}");

      let psCommand;
      if (pressEnter) {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}'); Start-Sleep -Seconds 5; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`;
      } else {
        psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedText}')`;
      }

      return new Promise((resolve) => {
        exec(`powershell -Command "${psCommand}"`, { timeout: 20000 }, (error) => {
          if (error) resolve({ error: error.message });
          else resolve({ success: true, typed: text, enterPressed: pressEnter });
        });
      });
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("check-for-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("download-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {  const e = err as Error;
      return { error: e.message };
    }
  });

  ipcMain.handle("install-update", async () => {
    if (!app.isPackaged && !allowDevUpdates) return { success: false, skipped: true, reason: "Updates disabled in dev." };
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });

  ipcMain.handle("get-app-version", async () => {
    return app.getVersion();
  });
}
