import React, { createContext, use, useState, useEffect, useMemo, useCallback } from "react";

import { logger } from "../lib/logger";

import type {
  Memory,
  UserProfile,
  DashboardSettings,
  HistoryMessage,
  FolderConfig,
  Note,
  Task,
  Contact,
} from "../types/index";

const electronAPI = window.electronAPI;

interface DataContextType {
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  handleAddMemory: (input: string) => Promise<void>;
  handleDeleteMemory: (id: string) => Promise<void>;
  handleMemoriesUpdated: (updatedMemories: Memory[]) => Promise<void>;

  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleUpdateProfile: (field: string, value: string) => Promise<void>;

  dashboardSettings: DashboardSettings;
  setDashboardSettings: React.Dispatch<React.SetStateAction<DashboardSettings>>;
  handleUpdateDashboardSettings: (settings: DashboardSettings) => Promise<void>;

  history: HistoryMessage[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryMessage[]>>;
  historySettings: Record<string, unknown>;
  setHistorySettings: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  handleUpdateHistorySettings: (settings: Record<string, unknown>) => Promise<void>;
  handleClearHistory: () => Promise<void>;

  importedFolders: FolderConfig[];
  setImportedFolders: React.Dispatch<React.SetStateAction<FolderConfig[]>>;
  handleImportFolder: () => Promise<void>;
  handleRemoveFolder: (idx: number) => void;
  handleOpenFolder: (folderPath: string) => Promise<void>;
  handleOpenVaultFolder: (folderName: string) => Promise<void>;

  vaultPath: string;
  setVaultPath: React.Dispatch<React.SetStateAction<string>>;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  handleSaveNote: (note: Note) => Promise<void>;
  handleDeleteNote: (id: string) => Promise<void>;

  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  handleSaveTasks: (updatedTasks: Task[]) => Promise<void>;

  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  handleAddContact: (name: string, phone: string) => Promise<void>;
  handleDeleteContact: (id: string) => Promise<void>;

  hasCheckedKey: boolean;
  setHasCheckedKey: React.Dispatch<React.SetStateAction<boolean>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    location: "",
    profession: "",
    bio: "",
  });
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    interests: ["Tech", "Pakistan", "Global Economy"],
    refreshInterval: 3600,
  });
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [historySettings, setHistorySettings] = useState<Record<string, unknown>>({
    maxContextMessages: 20,
    storeHistory: true,
  });
  const [importedFolders, setImportedFolders] = useState<FolderConfig[]>([]);
  const [vaultPath, setVaultPath] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasCheckedKey, setHasCheckedKey] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!electronAPI) {
      setHasCheckedKey(true);
      return;
    }

    const loadStartupData = async () => {
      try {
        const [
          loadedMemories,
          profile,
          loadedDashboardSettings,
          folders,
          vaultData,
          loadedHistory,
          loadedHistorySettings,
          loadedNotes,
          loadedTasks,
          loadedContacts,
        ] = await Promise.all([
          electronAPI.loadMemories().catch(() => []),
          electronAPI.loadUserProfile().catch(() => ({})),
          electronAPI.loadDashboardSettings().catch(() => null),
          electronAPI.loadImportedFolders().catch(() => []),
          electronAPI.initializeVault().catch(() => null),
          electronAPI.loadHistory().catch(() => []),
          electronAPI.loadHistorySettings().catch(() => null),
          electronAPI.loadNotes().catch(() => []),
          electronAPI.loadTasks().catch(() => []),
          electronAPI.loadContacts().catch(() => []),
        ]);

        if (!isMounted) return;

        if (Array.isArray(loadedMemories)) setMemories(loadedMemories);
        if (profile && Object.keys(profile).length > 0) setUserProfile(profile);
        if (loadedDashboardSettings) setDashboardSettings(loadedDashboardSettings);
        if (Array.isArray(folders)) setImportedFolders(folders);
        if (vaultData?.vaultBase) setVaultPath(vaultData.vaultBase);
        if (Array.isArray(loadedHistory)) setHistory(loadedHistory);
        if (loadedHistorySettings) setHistorySettings(loadedHistorySettings);
        if (Array.isArray(loadedNotes)) setNotes(loadedNotes);
        if (Array.isArray(loadedTasks)) setTasks(loadedTasks);
        if (Array.isArray(loadedContacts)) setContacts(loadedContacts);
      } catch (error) {
        logger.error("Error loading data:", error);
      }
    };

    const verifyApiKey = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const key = await electronAPI.getGeminiToken();
        if (isMounted) setHasCheckedKey(true); // Always set true to finish load
      } catch {
        if (isMounted) setHasCheckedKey(true);
      }
    };

    loadStartupData()
      .then(() => {
        verifyApiKey()
          .then(() => {
            if (isMounted) setHasCheckedKey(true);
          })
          .catch(() => {
            if (isMounted) setHasCheckedKey(true);
          });
      })
      .catch(() => {
        if (isMounted) setHasCheckedKey(true);
      });

    const fallback = window.setTimeout(() => {
      if (isMounted) setHasCheckedKey(true);
    }, 2000);
    return () => {
      isMounted = false;
      window.clearTimeout(fallback);
    };
  }, []);

  const handleUpdateProfile = useCallback(async (field: string, value: string) => {
      const updated = { ...userProfile, [field]: value };
      setUserProfile(updated);
      await electronAPI.saveUserProfile(updated);
    },
    [userProfile, setUserProfile]
  );

  const handleUpdateDashboardSettings = async (settings: DashboardSettings) => {
    setDashboardSettings(settings);
    await electronAPI.saveDashboardSettings(settings);
  };

  const handleAddMemory = useCallback(async (input: string) => {
      if (!input.trim()) return;
      const newMemo = {
        id: Date.now().toString(),
        content: input.trim(),
        category: "personal",
        timestamp: Date.now(),
      };
      const updated = [newMemo, ...memories];
      setMemories(updated);
      await electronAPI.saveMemories(updated);
    },
    [memories, setMemories]
  );

  const handleDeleteMemory = useCallback(async (id: string) => {
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      await electronAPI.saveMemories(updated);
    },
    [memories, setMemories]
  );

  const handleMemoriesUpdated = async (updatedMemories: Memory[]) => {
    setMemories(updatedMemories);
    await electronAPI.saveMemories(updatedMemories);
  };

  const handleUpdateHistorySettings = async (settings: Record<string, unknown>) => {
    setHistorySettings(settings);
    await electronAPI.saveHistorySettings(settings);
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear all conversation history?")) {
      setHistory([]);
      await electronAPI.clearHistory();
    }
  };

  const handleImportFolder = useCallback(async () => {
      const result = await electronAPI.pickFolder();
      if (result) {
        const newFolders = [...importedFolders, result];
        setImportedFolders(newFolders);
        await electronAPI.saveImportedFolders(newFolders);
      }
    },
    [importedFolders, setImportedFolders]
  );

  const handleRemoveFolder = useCallback(
    async (idx: number) => {
      const newFolders = importedFolders.filter((_, i) => i !== idx);
      setImportedFolders(newFolders);
      await electronAPI.saveImportedFolders(newFolders);
    },
    [importedFolders, setImportedFolders]
  );

  const handleOpenFolder = async (folderPath: string) => {
    await electronAPI.openSystemItem({ target: folderPath });
  };

  const handleOpenVaultFolder = async (folderName: string) => {
    await electronAPI.openVaultFolder(folderName);
  };

  const handleSaveNote = useCallback(async (note: Note) => {
      const updated = notes.some((n) => n.id === note.id)
        ? notes.map((n) => (n.id === note.id ? note : n))
        : [note, ...notes];
      setNotes(updated);
      await electronAPI.saveNotes(updated);
    },
    [notes, setNotes]
  );

  const handleDeleteNote = useCallback(async (id: string) => {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      await electronAPI.saveNotes(updated);
    },
    [notes, setNotes]
  );

  const handleSaveTasks = async (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    await electronAPI.saveTasks(updatedTasks).catch((err: Error) => console.error(err));
    if (electronAPI?.syncTaskReminders) {
      await electronAPI.syncTaskReminders({ tasks: updatedTasks });
    }
  };

  const handleAddContact = useCallback(async (name: string, phone: string) => {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      if (!trimmedName || !trimmedPhone) return;
      const existing = contacts.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      const updatedContacts = existing
        ? contacts.map((c) =>
            c.id === existing.id ? { ...c, phone: trimmedPhone, timestamp: Date.now() } : c
          )
        : [
            {
              id: Date.now().toString(),
              name: trimmedName,
              phone: trimmedPhone,
              timestamp: Date.now(),
            },
            ...contacts,
          ];
      setContacts(updatedContacts);
      await electronAPI.saveContacts(updatedContacts);
    },
    [contacts, setContacts]
  );

  const handleDeleteContact = useCallback(async (id: string) => {
      const updatedContacts = contacts.filter((c) => c.id !== id);
      setContacts(updatedContacts);
      await electronAPI.saveContacts(updatedContacts);
    },
    [contacts, setContacts]
  );

  const value = useMemo(
    () => ({
      memories,
      setMemories,
      handleAddMemory,
      handleDeleteMemory,
      handleMemoriesUpdated,
      userProfile,
      setUserProfile,
      handleUpdateProfile,
      dashboardSettings,
      setDashboardSettings,
      handleUpdateDashboardSettings,
      history,
      setHistory,
      historySettings,
      setHistorySettings,
      handleUpdateHistorySettings,
      handleClearHistory,
      importedFolders,
      setImportedFolders,
      handleImportFolder,
      handleRemoveFolder,
      handleOpenFolder,
      handleOpenVaultFolder,
      vaultPath,
      setVaultPath,
      notes,
      setNotes,
      handleSaveNote,
      handleDeleteNote,
      tasks,
      setTasks,
      handleSaveTasks,
      contacts,
      setContacts,
      handleAddContact,
      handleDeleteContact,
      hasCheckedKey,
      setHasCheckedKey,
    }),
    [
      contacts,
      dashboardSettings,
      handleAddContact,
      handleAddMemory,
      handleDeleteContact,
      handleDeleteMemory,
      handleDeleteNote,
      handleImportFolder,
      handleRemoveFolder,
      handleSaveNote,
      handleUpdateProfile,
      hasCheckedKey,
      history,
      historySettings,
      importedFolders,
      memories,
      notes,
      tasks,
      userProfile,
      vaultPath,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = use(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
