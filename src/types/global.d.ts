import type { UserProfile, DashboardSettings, FolderConfig, Memory, Note, Task, Contact, HistoryMessage, DashboardData } from './index';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    electronAPI: {
      getGeminiToken: () => Promise<string | null>;
      saveGeminiToken: (token: string) => Promise<boolean>;
      
      loadUserProfile: () => Promise<UserProfile>;
      saveUserProfile: (profile: UserProfile) => Promise<void>;
      
      loadDashboardSettings: () => Promise<DashboardSettings>;
      saveDashboardSettings: (settings: DashboardSettings) => Promise<void>;

      loadMemories: () => Promise<Memory[]>;
      saveMemories: (memories: Memory[]) => Promise<void>;

      loadHistory: () => Promise<HistoryMessage[]>;
      saveHistory: (history: HistoryMessage[]) => Promise<void>;
      clearHistory: () => Promise<void>;

      loadHistorySettings: () => Promise<Record<string, unknown>>;
      saveHistorySettings: (settings: Record<string, unknown>) => Promise<void>;

      loadImportedFolders: () => Promise<FolderConfig[]>;
      saveImportedFolders: (folders: FolderConfig[]) => Promise<void>;

      loadDashboardModulesState: () => Promise<unknown>;
      saveDashboardModulesState: (state: unknown) => Promise<void>;
      loadLinkedInQueue: () => Promise<unknown[]>;
      saveLinkedInQueue: (queue: unknown[]) => Promise<void>;
      loadLinkedInHistory: () => Promise<unknown[]>;
      saveLinkedInHistory: (history: unknown[]) => Promise<void>;
      httpFetch: (payload: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<unknown>;
      requestActionApproval: (payload: unknown) => Promise<boolean>;
      keyboardType: (text: string) => Promise<void>;
      keyboardPress: (key: string) => Promise<void>;
      writeClipboard: (text: string) => Promise<void>;
      sendNotification: (payload: {title: string; body: string}) => Promise<void>;
      fetchDashboardData: (params: { location?: string; interests: string[] }) => Promise<DashboardData>;

      initializeVault: () => Promise<{ vaultBase: string } | null>;
      
      loadNotes: () => Promise<Note[]>;
      saveNotes: (notes: Note[]) => Promise<void>;

      loadTasks: () => Promise<Task[]>;
      saveTasks: (tasks: Task[]) => Promise<void>;
      syncTaskReminders?: (data: { tasks: Task[] }) => Promise<void>;

      loadContacts: () => Promise<Contact[]>;
      saveContacts: (contacts: Contact[]) => Promise<void>;
      
      setIgnoreMouseEvents: (ignore: boolean) => void;
      closeWidget: () => void;
      openMainApp: () => void;
      openSettings: () => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      closeApp: () => void;
      setZoomFactor: (factor: number) => void;
      getZoomFactor: () => number;
      pickFolder: () => Promise<FolderConfig | null>;
      pickAndReadFiles: () => Promise<Array<{ name: string; data: string; mimeType: string; path: string; }>>;
      openSystemItem: (args: { target: string }) => Promise<void>;
      openVaultFolder: (folderName: string) => Promise<void>;
      onWakeWordDetected: (callback: (data: { type: string; msg?: string; text?: string; command?: string }) => void) => () => void;
      getProcesses: () => Promise<unknown>;
      executeSystemCommand: (payload: { command: string; args?: string[] }) => Promise<void>;
      onActionApprovalRequested: (callback: (payload: { id: string; action: string; details: string; risk?: "green" | "yellow" | "red"; requestId?: string }) => void) => () => void;
      respondActionApproval: (payload: { requestId: string; approved: boolean }) => Promise<void>;
      getAppVersion: () => Promise<string>;
      loadApprovalAuditLog: () => Promise<unknown[]>;
      clearApprovalAuditLog: () => Promise<void>;
      onUpdateLog: (callback: (message: string) => void) => () => void;
      onUpdateAvailable: (callback: (value: { version: string; releaseDate?: string }) => void) => () => void;
      onUpdateDownloadProgress: (callback: (value: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void;
      onUpdateDownloaded: (callback: (info?: { version: string }) => void) => () => void;
      checkForUpdate: () => Promise<{ success: boolean; version?: string }>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      fetchDashboardData?: (payload: { location?: string; interests?: string[]; endpoint?: string }) => Promise<unknown>;
      [key: string]: unknown;
    };
  }
}

export {};
