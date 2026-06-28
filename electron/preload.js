const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Zoom controls
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
  getZoomFactor: () => webFrame.getZoomFactor(),

  // Subscriptions
  onUpdateLog: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('update-log', subscription);
    return () => ipcRenderer.removeListener('update-log', subscription);
  },
  onWakeWordDetected: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('wake-word-detected', subscription);
    return () => ipcRenderer.removeListener('wake-word-detected', subscription);
  },
  onUpdateAvailable: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('update-available', subscription);
    return () => ipcRenderer.removeListener('update-available', subscription);
  },
  onUpdateDownloadProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('update-download-progress', subscription);
    return () => ipcRenderer.removeListener('update-download-progress', subscription);
  },
  onUpdateDownloaded: (callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on('update-downloaded', subscription);
    return () => ipcRenderer.removeListener('update-downloaded', subscription);
  },

  // Data and settings
  loadMemories: () => ipcRenderer.invoke('load-memories'),
  saveMemories: (memories) => ipcRenderer.invoke('save-memories', memories),
  loadUserProfile: () => ipcRenderer.invoke('load-user-profile'),
  saveUserProfile: (profile) => ipcRenderer.invoke('save-user-profile', profile),
  loadDashboardSettings: () => ipcRenderer.invoke('load-dashboard-settings'),
  saveDashboardSettings: (settings) => ipcRenderer.invoke('save-dashboard-settings', settings),
  loadDashboardModulesState: () => ipcRenderer.invoke('load-dashboard-modules-state'),
  saveDashboardModulesState: (state) => ipcRenderer.invoke('save-dashboard-modules-state', state),
  loadImportedFolders: () => ipcRenderer.invoke('load-imported-folders'),
  saveImportedFolders: (folders) => ipcRenderer.invoke('save-imported-folders', folders),
  initializeVault: () => ipcRenderer.invoke('initialize-vault'),
  getPersistenceStatus: () => ipcRenderer.invoke('get-persistence-status'),

  loadLinkedInQueue: () => ipcRenderer.invoke('load-linkedin-queue'),
  saveLinkedInQueue: (queue) => ipcRenderer.invoke('save-linkedin-queue', queue),
  loadLinkedInHistory: () => ipcRenderer.invoke('load-linkedin-history'),
  saveLinkedInHistory: (history) => ipcRenderer.invoke('save-linkedin-history', history),

  loadHistory: () => ipcRenderer.invoke('load-history'),
  saveHistory: (history) => ipcRenderer.invoke('save-history', history),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  loadHistorySettings: () => ipcRenderer.invoke('load-history-settings'),
  saveHistorySettings: (settings) => ipcRenderer.invoke('save-history-settings', settings),

  loadContacts: () => ipcRenderer.invoke('load-contacts'),
  saveContacts: (contacts) => ipcRenderer.invoke('save-contacts', contacts),

  loadNotes: () => ipcRenderer.invoke('load-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  loadTasks: () => ipcRenderer.invoke('load-tasks'),
  saveTasks: (tasks) => ipcRenderer.invoke('save-tasks', tasks),
  scheduleTaskReminder: (payload) => ipcRenderer.invoke('schedule-task-reminder', payload),
  syncTaskReminders: (payload) => ipcRenderer.invoke('sync-task-reminders', payload),

  // Vault and file picking
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openVaultFolder: (folderName) => ipcRenderer.invoke('open-vault-folder', folderName),
  pickAndReadFiles: () => ipcRenderer.invoke('pick-and-read-files'),
  readFileContent: (payload) => ipcRenderer.invoke('read-file-content', payload),
  fetchDashboardData: (payload) => ipcRenderer.invoke('fetch-dashboard-data', payload),
  semanticWorkspaceSearch: (payload) => ipcRenderer.invoke('semantic-workspace-search', payload),

  // Secrets and versioning
  getGeminiToken: () => ipcRenderer.invoke('get-gemini-token'),
  saveGeminiToken: (token) => ipcRenderer.invoke('save-gemini-token', token),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Updates
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // Tool execution actions
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  sendWhatsAppKeyboard: (payload) => ipcRenderer.invoke('send-whatsapp-keyboard', payload),
  systemFsOp: (payload) => ipcRenderer.invoke('system-fs-op', payload),
  executeSystemCommand: (payload) => ipcRenderer.invoke('system-exec-command', payload),
  openSystemItem: (payload) => ipcRenderer.invoke('system-open', payload),
  readClipboard: () => ipcRenderer.invoke('clipboard-read'),
  writeClipboard: (payload) => ipcRenderer.invoke('clipboard-write', payload),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  sendNotification: (payload) => ipcRenderer.invoke('send-notification', payload),
  httpFetch: (payload) => ipcRenderer.invoke('http-fetch', payload),
  getDetailedSystemInfo: () => ipcRenderer.invoke('get-detailed-system-info'),
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  killProcess: (payload) => ipcRenderer.invoke('kill-process', payload),
  windowControl: (payload) => ipcRenderer.invoke('window-control', payload),
  keyboardPress: (payload) => ipcRenderer.invoke('keyboard-press', payload),
  keyboardType: (payload) => ipcRenderer.invoke('keyboard-type', payload),

  // Unified approval dialog for risky actions
  requestActionApproval: (payload) => ipcRenderer.invoke('request-action-approval', payload),
  onActionApprovalRequested: (callback) => {
    const subscription = (_event, payload) => callback(payload);
    ipcRenderer.on('action-approval-requested', subscription);
    return () => ipcRenderer.removeListener('action-approval-requested', subscription);
  },
  respondActionApproval: (payload) => ipcRenderer.invoke('submit-action-approval', payload),

  loadApprovalAuditLog: () => ipcRenderer.invoke('load-approval-audit-log'),
  clearApprovalAuditLog: () => ipcRenderer.invoke('clear-approval-audit-log'),
});
