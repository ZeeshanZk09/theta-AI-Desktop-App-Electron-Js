"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Zoom controls
  setZoomFactor: (factor) => import_electron.webFrame.setZoomFactor(factor),
  getZoomFactor: () => import_electron.webFrame.getZoomFactor(),
  // Subscriptions
  onUpdateLog: (callback) => {
    const subscription = (_event, value) => callback(value);
    import_electron.ipcRenderer.on("update-log", subscription);
    return () => import_electron.ipcRenderer.removeListener("update-log", subscription);
  },
  onWakeWordDetected: (callback) => {
    const subscription = (_event, value) => callback(value);
    import_electron.ipcRenderer.on("wake-word-detected", subscription);
    return () => import_electron.ipcRenderer.removeListener("wake-word-detected", subscription);
  },
  onUpdateAvailable: (callback) => {
    const subscription = (_event, value) => callback(value);
    import_electron.ipcRenderer.on("update-available", subscription);
    return () => import_electron.ipcRenderer.removeListener("update-available", subscription);
  },
  onUpdateDownloadProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    import_electron.ipcRenderer.on("update-download-progress", subscription);
    return () => import_electron.ipcRenderer.removeListener("update-download-progress", subscription);
  },
  onUpdateDownloaded: (callback) => {
    const subscription = (_event, info) => callback(info);
    import_electron.ipcRenderer.on("update-downloaded", subscription);
    return () => import_electron.ipcRenderer.removeListener("update-downloaded", subscription);
  },
  // Data and settings
  loadMemories: () => import_electron.ipcRenderer.invoke("load-memories"),
  saveMemories: (memories) => import_electron.ipcRenderer.invoke("save-memories", memories),
  loadUserProfile: () => import_electron.ipcRenderer.invoke("load-user-profile"),
  saveUserProfile: (profile) => import_electron.ipcRenderer.invoke("save-user-profile", profile),
  loadDashboardSettings: () => import_electron.ipcRenderer.invoke("load-dashboard-settings"),
  saveDashboardSettings: (settings) => import_electron.ipcRenderer.invoke("save-dashboard-settings", settings),
  loadDashboardModulesState: () => import_electron.ipcRenderer.invoke("load-dashboard-modules-state"),
  saveDashboardModulesState: (state) => import_electron.ipcRenderer.invoke("save-dashboard-modules-state", state),
  loadImportedFolders: () => import_electron.ipcRenderer.invoke("load-imported-folders"),
  saveImportedFolders: (folders) => import_electron.ipcRenderer.invoke("save-imported-folders", folders),
  initializeVault: () => import_electron.ipcRenderer.invoke("initialize-vault"),
  getPersistenceStatus: () => import_electron.ipcRenderer.invoke("get-persistence-status"),
  loadLinkedInQueue: () => import_electron.ipcRenderer.invoke("load-linkedin-queue"),
  saveLinkedInQueue: (queue) => import_electron.ipcRenderer.invoke("save-linkedin-queue", queue),
  loadLinkedInHistory: () => import_electron.ipcRenderer.invoke("load-linkedin-history"),
  saveLinkedInHistory: (history) => import_electron.ipcRenderer.invoke("save-linkedin-history", history),
  loadHistory: () => import_electron.ipcRenderer.invoke("load-history"),
  saveHistory: (history) => import_electron.ipcRenderer.invoke("save-history", history),
  clearHistory: () => import_electron.ipcRenderer.invoke("clear-history"),
  loadHistorySettings: () => import_electron.ipcRenderer.invoke("load-history-settings"),
  saveHistorySettings: (settings) => import_electron.ipcRenderer.invoke("save-history-settings", settings),
  loadContacts: () => import_electron.ipcRenderer.invoke("load-contacts"),
  saveContacts: (contacts) => import_electron.ipcRenderer.invoke("save-contacts", contacts),
  loadNotes: () => import_electron.ipcRenderer.invoke("load-notes"),
  saveNotes: (notes) => import_electron.ipcRenderer.invoke("save-notes", notes),
  loadTasks: () => import_electron.ipcRenderer.invoke("load-tasks"),
  saveTasks: (tasks) => import_electron.ipcRenderer.invoke("save-tasks", tasks),
  scheduleTaskReminder: (payload) => import_electron.ipcRenderer.invoke("schedule-task-reminder", payload),
  syncTaskReminders: (payload) => import_electron.ipcRenderer.invoke("sync-task-reminders", payload),
  // Vault and file picking
  pickFolder: () => import_electron.ipcRenderer.invoke("pick-folder"),
  openVaultFolder: (folderName) => import_electron.ipcRenderer.invoke("open-vault-folder", folderName),
  pickAndReadFiles: () => import_electron.ipcRenderer.invoke("pick-and-read-files"),
  readFileContent: (payload) => import_electron.ipcRenderer.invoke("read-file-content", payload),
  fetchDashboardData: (payload) => import_electron.ipcRenderer.invoke("fetch-dashboard-data", payload),
  semanticWorkspaceSearch: (payload) => import_electron.ipcRenderer.invoke("semantic-workspace-search", payload),
  // Secrets and versioning
  getGeminiToken: () => import_electron.ipcRenderer.invoke("get-gemini-token"),
  saveGeminiToken: (token) => import_electron.ipcRenderer.invoke("save-gemini-token", token),
  getAppVersion: () => import_electron.ipcRenderer.invoke("get-app-version"),
  // Updates
  checkForUpdate: () => import_electron.ipcRenderer.invoke("check-for-update"),
  downloadUpdate: () => import_electron.ipcRenderer.invoke("download-update"),
  installUpdate: () => import_electron.ipcRenderer.invoke("install-update"),
  // Tool execution actions
  saveImage: (payload) => import_electron.ipcRenderer.invoke("save-image", payload),
  sendWhatsAppKeyboard: (payload) => import_electron.ipcRenderer.invoke("send-whatsapp-keyboard", payload),
  systemFsOp: (payload) => import_electron.ipcRenderer.invoke("system-fs-op", payload),
  executeSystemCommand: (payload) => import_electron.ipcRenderer.invoke("system-exec-command", payload),
  openSystemItem: (payload) => import_electron.ipcRenderer.invoke("system-open", payload),
  readClipboard: () => import_electron.ipcRenderer.invoke("clipboard-read"),
  writeClipboard: (payload) => import_electron.ipcRenderer.invoke("clipboard-write", payload),
  takeScreenshot: () => import_electron.ipcRenderer.invoke("take-screenshot"),
  sendNotification: (payload) => import_electron.ipcRenderer.invoke("send-notification", payload),
  httpFetch: (payload) => import_electron.ipcRenderer.invoke("http-fetch", payload),
  getDetailedSystemInfo: () => import_electron.ipcRenderer.invoke("get-detailed-system-info"),
  getProcesses: () => import_electron.ipcRenderer.invoke("get-processes"),
  killProcess: (payload) => import_electron.ipcRenderer.invoke("kill-process", payload),
  windowControl: (payload) => import_electron.ipcRenderer.invoke("window-control", payload),
  keyboardPress: (payload) => import_electron.ipcRenderer.invoke("keyboard-press", payload),
  keyboardType: (payload) => import_electron.ipcRenderer.invoke("keyboard-type", payload),
  // Unified approval dialog for risky actions
  requestActionApproval: (payload) => import_electron.ipcRenderer.invoke("request-action-approval", payload),
  onActionApprovalRequested: (callback) => {
    const subscription = (_event, payload) => callback(payload);
    import_electron.ipcRenderer.on("action-approval-requested", subscription);
    return () => import_electron.ipcRenderer.removeListener("action-approval-requested", subscription);
  },
  respondActionApproval: (payload) => import_electron.ipcRenderer.invoke("submit-action-approval", payload),
  loadApprovalAuditLog: () => import_electron.ipcRenderer.invoke("load-approval-audit-log"),
  clearApprovalAuditLog: () => import_electron.ipcRenderer.invoke("clear-approval-audit-log")
});
//# sourceMappingURL=preload.js.map