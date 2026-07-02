import { contextBridge, ipcRenderer, webFrame, type IpcRendererEvent } from "electron";

import type { Memory, UserProfile, DashboardSettings, HistoryMessage, FolderConfig, Note, Task, Contact } from "../src/types/index";

contextBridge.exposeInMainWorld("electronAPI", {
  // Zoom controls
  setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
  getZoomFactor: () => webFrame.getZoomFactor(),

  // Subscriptions
  onUpdateLog: (callback: (value: string) => void) => {
    const subscription = (_event: IpcRendererEvent, value: string) => callback(value);
    ipcRenderer.on("update-log", subscription);
    return () => ipcRenderer.removeListener("update-log", subscription);
  },
  onWakeWordDetected: (callback: (value: string | { detected: boolean }) => void) => {
    const subscription = (_event: IpcRendererEvent, value: string | { detected: boolean }) => callback(value);
    ipcRenderer.on("wake-word-detected", subscription);
    return () => ipcRenderer.removeListener("wake-word-detected", subscription);
  },
  onUpdateAvailable: (callback: (value: { version: string }) => void) => {
    const subscription = (_event: IpcRendererEvent, value: { version: string }) => callback(value);
    ipcRenderer.on("update-available", subscription);
    return () => ipcRenderer.removeListener("update-available", subscription);
  },
  onUpdateDownloadProgress: (callback: (value: { percent: number }) => void) => {
    const subscription = (_event: IpcRendererEvent, value: { percent: number }) => callback(value);
    ipcRenderer.on("update-download-progress", subscription);
    return () => ipcRenderer.removeListener("update-download-progress", subscription);
  },
  onUpdateDownloaded: (callback: (info?: { version: string }) => void) => {
    const subscription = (_event: IpcRendererEvent, info?: { version: string }) => callback(info);
    ipcRenderer.on("update-downloaded", subscription);
    return () => ipcRenderer.removeListener("update-downloaded", subscription);
  },

  // Data and settings
  loadMemories: () => ipcRenderer.invoke("load-memories"),
  saveMemories: (memories: Memory[]) => ipcRenderer.invoke("save-memories", memories),
  loadUserProfile: () => ipcRenderer.invoke("load-user-profile"),
  saveUserProfile: (profile: UserProfile) => ipcRenderer.invoke("save-user-profile", profile),
  loadDashboardSettings: () => ipcRenderer.invoke("load-dashboard-settings"),
  saveDashboardSettings: (settings: DashboardSettings) => ipcRenderer.invoke("save-dashboard-settings", settings),
  loadDashboardModulesState: () => ipcRenderer.invoke("load-dashboard-modules-state"),
  saveDashboardModulesState: (state: Record<string, boolean>) => ipcRenderer.invoke("save-dashboard-modules-state", state),
  loadImportedFolders: () => ipcRenderer.invoke("load-imported-folders"),
  saveImportedFolders: (folders: FolderConfig[]) => ipcRenderer.invoke("save-imported-folders", folders),
  initializeVault: () => ipcRenderer.invoke("initialize-vault"),
  getPersistenceStatus: () => ipcRenderer.invoke("get-persistence-status"),

  loadLinkedInQueue: () => ipcRenderer.invoke("load-linkedin-queue"),
  saveLinkedInQueue: (queue: { id: string; url: string }[]) => ipcRenderer.invoke("save-linkedin-queue", queue),
  loadLinkedInHistory: () => ipcRenderer.invoke("load-linkedin-history"),
  saveLinkedInHistory: (history: { id: string; url: string; timestamp: number }[]) => ipcRenderer.invoke("save-linkedin-history", history),

  loadHistory: () => ipcRenderer.invoke("load-history"),
  saveHistory: (history: HistoryMessage[]) => ipcRenderer.invoke("save-history", history),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  loadHistorySettings: () => ipcRenderer.invoke("load-history-settings"),
  saveHistorySettings: (settings: Record<string, boolean | number | string>) => ipcRenderer.invoke("save-history-settings", settings),

  loadContacts: () => ipcRenderer.invoke("load-contacts"),
  saveContacts: (contacts: Contact[]) => ipcRenderer.invoke("save-contacts", contacts),

  loadNotes: () => ipcRenderer.invoke("load-notes"),
  saveNotes: (notes: Note[]) => ipcRenderer.invoke("save-notes", notes),
  loadTasks: () => ipcRenderer.invoke("load-tasks"),
  saveTasks: (tasks: Task[]) => ipcRenderer.invoke("save-tasks", tasks),
  scheduleTaskReminder: (payload: { id: string; time: number }) => ipcRenderer.invoke("schedule-task-reminder", payload),
  syncTaskReminders: (payload: { tasks: Task[] }) => ipcRenderer.invoke("sync-task-reminders", payload),

  // Vault and file picking
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  openVaultFolder: (folderName: string) => ipcRenderer.invoke("open-vault-folder", folderName),
  pickAndReadFiles: () => ipcRenderer.invoke("pick-and-read-files"),
  readFileContent: (payload: { path: string }) => ipcRenderer.invoke("read-file-content", payload),
  fetchDashboardData: (payload: { endpoint?: string }) => ipcRenderer.invoke("fetch-dashboard-data", payload),
  semanticWorkspaceSearch: (payload: { query: string }) => ipcRenderer.invoke("semantic-workspace-search", payload),

  // Secrets and versioning
  getGeminiToken: () => ipcRenderer.invoke("get-gemini-token"),
  saveGeminiToken: (token: string) => ipcRenderer.invoke("save-gemini-token", token),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // Updates
  checkForUpdate: () => ipcRenderer.invoke("check-for-update"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // Tool execution actions
  saveImage: (payload: { data: string; name: string }) => ipcRenderer.invoke("save-image", payload),
  sendWhatsAppKeyboard: (payload: { number: string; text: string }) => ipcRenderer.invoke("send-whatsapp-keyboard", payload),
  systemFsOp: (payload: { op: string; path: string; data?: string }) => ipcRenderer.invoke("system-fs-op", payload),
  executeSystemCommand: (payload: { command: string; args: string[] }) => ipcRenderer.invoke("system-exec-command", payload),
  openSystemItem: (payload: { target: string }) => ipcRenderer.invoke("system-open", payload),
  readClipboard: () => ipcRenderer.invoke("clipboard-read"),
  writeClipboard: (payload: { text: string }) => ipcRenderer.invoke("clipboard-write", payload),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
  sendNotification: (payload: { title: string; body: string }) => ipcRenderer.invoke("send-notification", payload),
  httpFetch: (payload: { url: string; method?: string; body?: string }) => ipcRenderer.invoke("http-fetch", payload),
  getDetailedSystemInfo: () => ipcRenderer.invoke("get-detailed-system-info"),
  getProcesses: () => ipcRenderer.invoke("get-processes"),
  killProcess: (payload: { pid: number }) => ipcRenderer.invoke("kill-process", payload),
  windowControl: (payload: { action: string; windowId?: string }) => ipcRenderer.invoke("window-control", payload),
  keyboardPress: (payload: { key: string }) => ipcRenderer.invoke("keyboard-press", payload),
  keyboardType: (payload: { text: string }) => ipcRenderer.invoke("keyboard-type", payload),

  // Unified approval dialog for risky actions
  requestActionApproval: (payload: { id: string; action: string; details: string }) => ipcRenderer.invoke("request-action-approval", payload),
  onActionApprovalRequested: (callback: (payload: { id: string; action: string; details: string }) => void) => {
    const subscription = (_event: IpcRendererEvent, payload: { id: string; action: string; details: string }) => callback(payload);
    ipcRenderer.on("action-approval-requested", subscription);
    return () => ipcRenderer.removeListener("action-approval-requested", subscription);
  },
  respondActionApproval: (payload: { id: string; approved: boolean }) => ipcRenderer.invoke("submit-action-approval", payload),

  loadApprovalAuditLog: () => ipcRenderer.invoke("load-approval-audit-log"),
  clearApprovalAuditLog: () => ipcRenderer.invoke("clear-approval-audit-log"),
});
