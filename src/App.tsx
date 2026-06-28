import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Settings } from 'lucide-react';

import { useGeminiLive } from './hooks/useGeminiLive';
import { useZoom } from './hooks/useZoom';
import { useAudio } from './hooks/useAudio';
import { ConnectionStatus } from './types';

// Modals
import MemoryModal from './components/modals/MemoryModal';
import UserProfileModal from './components/modals/UserProfileModal';
import DashboardSettingsModal from './components/modals/DashboardSettingsModal';
import HistoryModal from './components/modals/HistoryModal';
import SecretKeyModal from './components/modals/SecretKeyModal';
import SettingsModal from './components/modals/SettingsModal';
import ContactsModal from './components/modals/ContactsModal';
import ActionApprovalModal, {
  ActionApprovalRequest,
} from './components/modals/ActionApprovalModal';

// Modules
import LoadingScreen from './components/modules/LoadingScreen';
import SidebarLeft from './components/modules/SidebarLeft';
import SidebarRight from './components/modules/SidebarRight';
import VisualHub from './components/modules/VisualHub';
import SystemConnections from './components/modules/SystemConnections';
import FolderExplorer from './components/modules/FolderExplorer';
import SystemControls from './components/modules/SystemControls';
import AIGlobePortal from './components/modules/AIGlobePortal';
import NotesSection from './components/modules/NotesSection';
import TasksSection from './components/modules/TasksSection';
import UpdateNotification from './components/modules/UpdateNotification';
import YouTubePlayer from './components/modules/YouTubePlayer';
import DashboardGrid from './components/modules/DashboardGrid';

// Safely access electronAPI from window
const electronAPI = (window as any).electronAPI;

const logAppFlow = (stage: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (details) {
    console.debug(`[AppFlow ${timestamp}] ${stage}`, details);
    return;
  }
  console.debug(`[AppFlow ${timestamp}] ${stage}`);
};

interface AdvisorRecommendation {
  id: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  command?: string;
  risk: 'green' | 'yellow' | 'red';
}

function App() {
  useZoom(); // Initialize zoom shortcuts
  const { playClick } = useAudio();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [inputMode, setInputMode] = useState('voice');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedDiagram, setGeneratedDiagram] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [hasCheckedKey, setHasCheckedKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isDiagramRendering, setIsDiagramRendering] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'chat' | 'terminal'>('chat');

  // Visual Hub Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Internal loading removed (Handled by native splash screen)
  const [isVisualHubExpanded, setIsVisualHubExpanded] = useState(false);

  // Memory & User State
  const [memories, setMemories] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>({
    name: '',
    location: '',
    profession: '',
    bio: '',
  });
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [dashboardSettings, setDashboardSettings] = useState<any>({
    interests: ['Tech', 'Pakistan', 'Global Economy'],
    refreshInterval: 3600,
  });
  const [history, setHistory] = useState<any[]>([]);
  const [historySettings, setHistorySettings] = useState<any>({
    maxContextMessages: 20,
    storeHistory: true,
  });

  const [importedFolders, setImportedFolders] = useState<{ name: string; path: string }[]>([]);
  const [vaultPath, setVaultPath] = useState<string>('');
  const [editingFolderIdx, setEditingFolderIdx] = useState<number | null>(null);
  const [tempFolderName, setTempFolderName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; data: string; mimeType: string; path?: string }[]
  >([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [advisorRecommendations, setAdvisorRecommendations] = useState<AdvisorRecommendation[]>([]);
  const [isAdvisorScanning, setIsAdvisorScanning] = useState(false);
  const [pendingApprovalRequest, setPendingApprovalRequest] =
    useState<ActionApprovalRequest | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const pendingDeepDivePromptRef = useRef<string | null>(null);

  const highCpuProcessSeenRef = useRef<Record<string, number>>({});
  const notifiedAdvisorIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyPersistTimerRef = useRef<number | null>(null);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;

    if (!electronAPI) {
      console.error('electronAPI bridge is unavailable. Preload may not have loaded.');
      setHasCheckedKey(true);
      return;
    }

    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, label: string) => {
      return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
          .then((value) => {
            window.clearTimeout(timer);
            resolve(value);
          })
          .catch((error) => {
            window.clearTimeout(timer);
            reject(error);
          });
      });
    };

    const safeInvoke = async <T,>(label: string, invoke: () => Promise<T>, timeoutMs = 5000) => {
      try {
        return await withTimeout(invoke(), timeoutMs, label);
      } catch (error) {
        console.error(`Failed to ${label}:`, error);
        return undefined;
      }
    };

    const loadStartupData = async () => {
      const [
        loadedMemories,
        profile,
        dashboardSettings,
        folders,
        vaultData,
        loadedHistory,
        loadedHistorySettings,
        loadedNotes,
        loadedTasks,
        loadedContacts,
      ] = await Promise.all([
        safeInvoke('load memories', () => electronAPI.loadMemories()),
        safeInvoke('load user profile', () => electronAPI.loadUserProfile()),
        safeInvoke('load dashboard settings', () => electronAPI.loadDashboardSettings()),
        safeInvoke('load imported folders', () => electronAPI.loadImportedFolders()),
        safeInvoke<any>('initialize vault', () => electronAPI.initializeVault()),
        safeInvoke('load history', () => electronAPI.loadHistory()),
        safeInvoke('load history settings', () => electronAPI.loadHistorySettings()),
        safeInvoke('load notes', () => electronAPI.loadNotes()),
        safeInvoke('load tasks', () => electronAPI.loadTasks()),
        safeInvoke('load contacts', () => electronAPI.loadContacts()),
      ]);

      if (!isMounted) return;

      if (Array.isArray(loadedMemories)) setMemories(loadedMemories);
      if (profile && Object.keys(profile).length > 0) setUserProfile(profile);
      if (dashboardSettings) setDashboardSettings(dashboardSettings);
      if (Array.isArray(folders)) setImportedFolders(folders);
      if (vaultData?.vaultBase) setVaultPath(vaultData.vaultBase);
      if (Array.isArray(loadedHistory)) setHistory(loadedHistory);
      if (loadedHistorySettings) setHistorySettings(loadedHistorySettings);
      if (Array.isArray(loadedNotes)) setNotes(loadedNotes);
      if (Array.isArray(loadedTasks)) setTasks(loadedTasks);
      if (Array.isArray(loadedContacts)) setContacts(loadedContacts);
    };

    const verifyApiKey = async () => {
      const key = await safeInvoke<string | null>(
        'read API key',
        () => electronAPI.getGeminiToken(),
        7000
      );
      if (!isMounted) return;

      setHasCheckedKey(true);
      if (!key) {
        setIsSecretKeyModalOpen(true);
      }
    };

    loadStartupData();
    verifyApiKey();

    // Never leave the UI in an indefinite black gate state.
    const keyGateFallback = window.setTimeout(() => {
      if (isMounted) setHasCheckedKey(true);
    }, 2000);

    return () => {
      isMounted = false;
      window.clearTimeout(keyGateFallback);
    };
  }, []);

  const handleUpdateDashboardSettings = async (settings: any) => {
    setDashboardSettings(settings);
    await electronAPI.saveDashboardSettings(settings);
  };

  const handleUpdateProfile = async (field: string, value: string) => {
    const updated = { ...userProfile, [field]: value };
    setUserProfile(updated);
    await electronAPI.saveUserProfile(updated);
  };

  const handleAddMemory = async () => {
    if (!newMemoryInput.trim()) return;
    const newMemo = {
      id: Date.now().toString(),
      content: newMemoryInput.trim(),
      category: 'personal',
      timestamp: Date.now(),
    };
    const updated = [newMemo, ...memories];
    setMemories(updated);
    await electronAPI.saveMemories(updated);
    setNewMemoryInput('');
  };

  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    await electronAPI.saveMemories(updated);
  };

  const handleImportFolder = async () => {
    const result = await electronAPI.pickFolder();
    if (result) {
      const newFolders = [...importedFolders, result];
      setImportedFolders(newFolders);
      electronAPI.saveImportedFolders(newFolders);
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    await electronAPI.openSystemItem({ target: folderPath });
  };

  const handleOpenVaultFolder = async (folderName: string) => {
    await electronAPI.openVaultFolder(folderName);
  };

  const handleRemoveFolder = (idx: number) => {
    const newFolders = importedFolders.filter((_, i) => i !== idx);
    setImportedFolders(newFolders);
    electronAPI.saveImportedFolders(newFolders);
  };

  const handleStartRename = (idx: number, name: string) => {
    setEditingFolderIdx(idx);
    setTempFolderName(name);
  };

  const handleFinishRename = () => {
    if (editingFolderIdx !== null && tempFolderName.trim()) {
      const newFolders = [...importedFolders];
      newFolders[editingFolderIdx].name = tempFolderName;
      setImportedFolders(newFolders);
      electronAPI.saveImportedFolders(newFolders);
    }
    setEditingFolderIdx(null);
  };

  const handleSaveNote = async (note: any) => {
    const updated = notes.find((n) => n.id === note.id)
      ? notes.map((n) => (n.id === note.id ? note : n))
      : [note, ...notes];
    setNotes(updated);
    await electronAPI.saveNotes(updated);
  };

  const handleDeleteNote = async (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    await electronAPI.saveNotes(updated);
  };

  const handleSaveTasks = async (updatedTasks: any[]) => {
    setTasks(updatedTasks);
    await electronAPI.saveTasks(updatedTasks);

    if (electronAPI?.syncTaskReminders) {
      await electronAPI.syncTaskReminders({ tasks: updatedTasks });
    }
  };

  const handleAddContact = async (name: string, phone: string) => {
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
  };

  const handleDeleteContact = async (id: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    setContacts(updatedContacts);
    await electronAPI.saveContacts(updatedContacts);
  };

  const handleImageGenerated = useCallback((url: string) => {
    setGeneratedImage(url);
    setIsVisualHubExpanded(true);
  }, []);

  const handleDiagramGenerated = useCallback((html: string) => {
    setGeneratedDiagram(html);
    setIsVisualHubExpanded(true);
  }, []);

  const handleMemoriesUpdated = useCallback(async (updatedMemories: any[]) => {
    setMemories(updatedMemories);
    await electronAPI.saveMemories(updatedMemories);
  }, []);

  const handleDashboardUpdate = useCallback((data: any) => {
    setDashboardData(data);
    setIsDashboardLoading(false);
  }, []);

  const handleYouTubePlay = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
  }, []);

  // Construct vault info for AI context
  const vaultInfo = {
    path: vaultPath || 'Documents/Theta_Vault',
    folders: importedFolders,
  };

  // Use history as initial history for AI context
  const initialHistory = history.slice(
    -Math.max(1, Number(historySettings?.maxContextMessages || 20))
  );

  // Integrate Gemini Voice AI
  const {
    connect,
    disconnect,
    status,
    messages,
    analyser,
    micAnalyser,
    currentOutput,
    isThinking,
    currentThought,
    thinkingEnabled,
    setThinkingEnabled,
    addLog,
    logs,
    sendTextMessage,
    sendMultimodalMessage,
    sendVideoFrame,
  } = useGeminiLive({
    onSpeakingChanged: setIsAISpeaking,
    userProfile,
    onVisualizingChanged: setIsVisualizing,
    onImageGenerated: handleImageGenerated,
    onDiagramGenerated: handleDiagramGenerated,
    onMemoriesUpdated: handleMemoriesUpdated,
    onContactsUpdated: setContacts,
    vaultInfo,
    initialHistory,
    historySettings,
    onDashboardUpdated: handleDashboardUpdate,
    onNotesUpdated: setNotes,
    onTasksUpdated: setTasks,
    onYouTubePlay: handleYouTubePlay,
    attachedFiles,
  });

  const handleDeepDiveIdea = useCallback(
    (idea: {
      title: string;
      summary: string;
      relevance: string;
      feasibility: number;
      trendLink?: string;
    }) => {
      const deepDivePrompt = `Deep dive this business idea with an execution plan:\n\nTitle: ${idea.title}\nSummary: ${idea.summary}\nWhy relevant today: ${idea.relevance}\nFeasibility: ${idea.feasibility}/5\nTrend source: ${idea.trendLink || 'N/A'}\n\nProvide: 1) market angle 2) 7-day execution steps 3) key risks 4) expected ROI assumptions.`;

      setActiveTab('intelligence');
      if (status === ConnectionStatus.CONNECTED) {
        sendTextMessage(deepDivePrompt);
      } else {
        pendingDeepDivePromptRef.current = deepDivePrompt;
        connect();
      }
    },
    [connect, sendTextMessage, status]
  );

  // Wake Word Command queue
  const pendingWakeWordCommand = useRef<string | null>(null);

  const handleApprovalDecision = useCallback(async (requestId: string, approved: boolean) => {
    logAppFlow('approval:respond:start', { requestId, approved });
    await electronAPI.respondActionApproval({ requestId, approved });
    setPendingApprovalRequest((current) => (current?.requestId === requestId ? null : current));
    logAppFlow('approval:respond:completed', { requestId, approved });
  }, []);

  const resolveApprovalByUtterance = useCallback(
    async (utterance: string) => {
      if (!pendingApprovalRequest) return false;

      const normalized = utterance.trim().toLowerCase();
      if (!normalized) return false;

      logAppFlow('approval:utterance:received', {
        requestId: pendingApprovalRequest.requestId,
        utterance: normalized.slice(0, 120),
      });

      const allowPattern =
        /^(allow|approve|approved|yes|ok|okay|go ahead|do it|haan|han|ji|sure)\b/i;
      const rejectPattern = /^(reject|deny|no|cancel|stop|mat|don't|do not)\b/i;

      if (allowPattern.test(normalized)) {
        await handleApprovalDecision(pendingApprovalRequest.requestId, true);
        addLog('success', 'Approval accepted via voice/text response.');
        logAppFlow('approval:utterance:accepted', { requestId: pendingApprovalRequest.requestId });
        return true;
      }

      if (rejectPattern.test(normalized)) {
        await handleApprovalDecision(pendingApprovalRequest.requestId, false);
        addLog('warning', 'Approval rejected via voice/text response.');
        logAppFlow('approval:utterance:rejected', { requestId: pendingApprovalRequest.requestId });
        return true;
      }

      logAppFlow('approval:utterance:notMatched', { requestId: pendingApprovalRequest.requestId });
      return false;
    },
    [addLog, handleApprovalDecision, pendingApprovalRequest]
  );

  // Handle Wake Word Detection
  useEffect(() => {
    if (!electronAPI) return;

    const unsubscribe = electronAPI.onWakeWordDetected(async (data: any) => {
      console.log('Wake word event:', data);
      logAppFlow('wakeWord:event', {
        type: data?.type,
        hasCommand: Boolean(data?.command),
      });

      // Handle INFO logs from Python
      if (data.type === 'INFO') {
        addLog('info', `WakeWord Engine: ${data.msg}`);
        return;
      }

      // Handle ERROR logs from Python
      if (data.type === 'ERROR') {
        addLog('error', `WakeWord Engine Error: ${data.msg}`);
        return;
      }

      // Handle actual WAKE_WORD detection
      if (data.type === 'WAKE_WORD') {
        addLog('success', `Wake Word Detected: "${data.text}"`);
        logAppFlow('wakeWord:detected', {
          text: String(data?.text || ''),
          commandPreview: String(data?.command || '').slice(0, 120),
        });

        if (data.command) {
          const handled = await resolveApprovalByUtterance(data.command);
          if (handled) {
            pendingWakeWordCommand.current = null;
            logAppFlow('wakeWord:approvalResolvedFromCommand');
            return;
          }

          pendingWakeWordCommand.current = data.command;
          logAppFlow('wakeWord:queuedCommand', {
            commandPreview: String(data.command).slice(0, 120),
          });
        }

        if (status === ConnectionStatus.DISCONNECTED) {
          logAppFlow('wakeWord:connectingForCommand');
          connect();
        } else if (status === ConnectionStatus.CONNECTED && data.command) {
          const handled = await resolveApprovalByUtterance(data.command);
          if (handled) {
            pendingWakeWordCommand.current = null;
            logAppFlow('wakeWord:approvalResolvedWhileConnected');
            return;
          }

          logAppFlow('wakeWord:sendingCommand', {
            commandPreview: String(data.command).slice(0, 120),
          });
          sendTextMessage(data.command);
          pendingWakeWordCommand.current = null;
        }
      }
    });

    return () => unsubscribe();
  }, [status, connect, sendTextMessage, addLog, resolveApprovalByUtterance]);

  // Execute pending command once connected
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED && pendingWakeWordCommand.current) {
      logAppFlow('wakeWord:flushPendingCommand', {
        commandPreview: String(pendingWakeWordCommand.current).slice(0, 120),
      });
      sendTextMessage(pendingWakeWordCommand.current);
      pendingWakeWordCommand.current = null;
    }

    if (status === ConnectionStatus.CONNECTED && pendingDeepDivePromptRef.current) {
      logAppFlow('deepDive:flushPendingPrompt');
      sendTextMessage(pendingDeepDivePromptRef.current);
      pendingDeepDivePromptRef.current = null;
    }
  }, [status, sendTextMessage]);

  const refreshDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    logAppFlow('dashboard:refresh:start', {
      connected: status === ConnectionStatus.CONNECTED,
      location: String(userProfile.location || ''),
      interestsCount: Array.isArray(dashboardSettings?.interests)
        ? dashboardSettings.interests.length
        : 0,
    });

    try {
      if (status === ConnectionStatus.CONNECTED) {
        const prompt = `[SYSTEM_INIT_FETCH] Search for today's top 5 headlines and weather in ${
          userProfile.location || 'my area'
        } based on my interests: ${dashboardSettings.interests.join(', ')}. 
        Use the update_dashboard tool to provide the information. Do not respond verbally unless I ask.`;
        sendTextMessage(prompt, true);
        logAppFlow('dashboard:refresh:promptSentViaAI');
        return;
      }

      const response = await electronAPI.fetchDashboardData({
        location: userProfile.location,
        interests: dashboardSettings.interests,
      });

      if (response && response.headlines) {
        setDashboardData(response);
        logAppFlow('dashboard:refresh:completed', {
          headlineCount: Array.isArray(response.headlines) ? response.headlines.length : 0,
        });
      }
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      logAppFlow('dashboard:refresh:failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDashboardLoading(false);
    }
  }, [status, userProfile.location, dashboardSettings.interests, sendTextMessage]);

  const runSystemHealthScan = useCallback(async () => {
    setIsAdvisorScanning(true);
    const now = Date.now();

    try {
      const [systemInfoRaw, processesRaw] = await Promise.all([
        electronAPI.getDetailedSystemInfo(),
        electronAPI.getProcesses(),
      ]);

      const systemInfo = systemInfoRaw || {};
      const processes = Array.isArray(processesRaw) ? processesRaw : [];
      const recommendations: AdvisorRecommendation[] = [];

      const totalRam = Number(systemInfo?.mem?.total || 0);
      const activeRam = Number(systemInfo?.mem?.active || systemInfo?.mem?.used || 0);
      if (totalRam > 0) {
        const ramUsage = (activeRam / totalRam) * 100;
        if (ramUsage >= 85) {
          recommendations.push({
            id: 'high-ram-usage',
            title: `High RAM usage detected (${ramUsage.toFixed(1)}%)`,
            explanation:
              'Your memory usage is close to capacity, which can slow app switching and cause stutter.',
            suggestedAction:
              'Open Task Manager and close heavy apps, or let Theta open Task Manager for you.',
            command: 'start taskmgr',
            risk: 'yellow',
          });
        }
      }

      const currentHighCpuIds = new Set<string>();
      for (const process of processes) {
        const cpu = Number(process?.cpu || 0);
        const pid = process?.pid;
        const name = process?.name || 'unknown';
        if (!pid || cpu <= 40) continue;

        const key = `${pid}:${name}`;
        currentHighCpuIds.add(key);
        if (!highCpuProcessSeenRef.current[key]) {
          highCpuProcessSeenRef.current[key] = now;
          continue;
        }

        const seenForMs = now - highCpuProcessSeenRef.current[key];
        if (seenForMs >= 5 * 60 * 1000) {
          recommendations.push({
            id: `high-cpu-${pid}`,
            title: `Process ${name} is over 40% CPU`,
            explanation: `Process ${name} (PID ${pid}) has stayed above 40% CPU for over 5 minutes.`,
            suggestedAction: `Kill ${name} or investigate workload.`,
            command: `taskkill /PID ${pid} /F`,
            risk: 'red',
          });
        }
      }

      Object.keys(highCpuProcessSeenRef.current).forEach((key) => {
        if (!currentHighCpuIds.has(key)) {
          delete highCpuProcessSeenRef.current[key];
        }
      });

      const disks = Array.isArray(systemInfo?.fsSize) ? systemInfo.fsSize : [];
      for (const disk of disks) {
        const usage = Number(disk?.use || 0);
        const fs = String(disk?.fs || 'Disk');
        if (usage >= 90) {
          recommendations.push({
            id: `disk-${fs}`,
            title: `${fs} is ${usage.toFixed(0)}% full`,
            explanation:
              'Low free disk space can impact updates, caching, and overall system responsiveness.',
            suggestedAction: 'Launch Disk Cleanup and remove temporary files.',
            command: 'cleanmgr',
            risk: 'yellow',
          });
        }
      }

      const battery = systemInfo?.battery;
      if (battery?.hasbattery) {
        const healthRatio =
          battery.designcapacity && battery.maxcapacity
            ? Number(battery.maxcapacity) / Number(battery.designcapacity)
            : null;

        if (healthRatio !== null && healthRatio < 0.7) {
          recommendations.push({
            id: 'battery-health-low',
            title: 'Battery health appears degraded',
            explanation: `Battery capacity health is about ${(healthRatio * 100).toFixed(0)}% of design capacity.`,
            suggestedAction: 'Open power settings and review battery diagnostics.',
            command: 'start ms-settings:powersleep',
            risk: 'yellow',
          });
        } else if (!battery.acconnected && Number(battery.percent || 0) < 20) {
          recommendations.push({
            id: 'battery-low',
            title: 'Battery is low',
            explanation: `Battery is at ${Number(battery.percent || 0).toFixed(0)}% and not charging.`,
            suggestedAction: 'Connect charger or switch to battery saver profile.',
            command: 'start ms-settings:batterysaver',
            risk: 'green',
          });
        }
      }

      setAdvisorRecommendations(recommendations);

      for (const recommendation of recommendations) {
        if (!notifiedAdvisorIdsRef.current.has(recommendation.id)) {
          notifiedAdvisorIdsRef.current.add(recommendation.id);
          await electronAPI.sendNotification({
            title: `System Advisor: ${recommendation.title}`,
            body: recommendation.suggestedAction,
          });
        }
      }
    } catch (error) {
      console.error('System health scan failed:', error);
    } finally {
      setIsAdvisorScanning(false);
    }
  }, []);

  const handleRunAdvisorFix = useCallback(async (recommendation: AdvisorRecommendation) => {
    if (!recommendation.command) return;
    const result = await electronAPI.executeSystemCommand({ command: recommendation.command });

    if (result?.success) {
      await electronAPI.sendNotification({
        title: 'System Advisor',
        body: `Action executed: ${recommendation.title}`,
      });
    } else {
      await electronAPI.sendNotification({
        title: 'System Advisor',
        body: `Action failed: ${result?.error || 'Unknown error'}`,
      });
    }
  }, []);

  useEffect(() => {
    if (!electronAPI?.onActionApprovalRequested) return;
    const unsubscribe = electronAPI.onActionApprovalRequested((payload: ActionApprovalRequest) => {
      setPendingApprovalRequest(payload);
    });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    runSystemHealthScan();
    const intervalId = window.setInterval(runSystemHealthScan, 30 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [runSystemHealthScan]);

  useEffect(() => {
    const refreshSeconds = Math.max(30, Number(dashboardSettings?.refreshInterval || 3600));
    const intervalId = window.setInterval(() => {
      refreshDashboard();
    }, refreshSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [dashboardSettings?.refreshInterval, refreshDashboard]);

  // Persist history with debounce and skip high-frequency streaming chunks.
  useEffect(() => {
    if (!historySettings.storeHistory || messages.length === 0) return;

    const hasStreamingMessage = messages.some((message) => message.isStreaming);
    if (hasStreamingMessage) return;

    if (historyPersistTimerRef.current) {
      window.clearTimeout(historyPersistTimerRef.current);
    }

    historyPersistTimerRef.current = window.setTimeout(() => {
      setHistory(messages);
      electronAPI.saveHistory(messages);
      historyPersistTimerRef.current = null;
    }, 800);

    return () => {
      if (historyPersistTimerRef.current) {
        window.clearTimeout(historyPersistTimerRef.current);
        historyPersistTimerRef.current = null;
      }
    };
  }, [messages, historySettings.storeHistory]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      setHistory([]);
      await electronAPI.clearHistory();
      setIsHistoryModalOpen(false);
    }
  };

  const handleUpdateHistorySettings = async (settings: any) => {
    setHistorySettings(settings);
    await electronAPI.saveHistorySettings(settings);
  };

  const handleSendChat = useCallback(async () => {
    if ((!chatInput.trim() && attachedFiles.length === 0) || status !== ConnectionStatus.CONNECTED)
      return;

    logAppFlow('chat:send:start', {
      hasText: chatInput.trim().length > 0,
      attachedFiles: attachedFiles.length,
    });

    const handled = await resolveApprovalByUtterance(chatInput.trim());
    if (handled) {
      logAppFlow('chat:send:approvalHandledFromInput');
      setChatInput('');
      return;
    }

    if (attachedFiles.length > 0) {
      logAppFlow('chat:send:multimodal');
      sendMultimodalMessage(chatInput.trim(), attachedFiles);
      setAttachedFiles([]);
    } else {
      logAppFlow('chat:send:textOnly');
      sendTextMessage(chatInput.trim());
    }

    setChatInput('');
    logAppFlow('chat:send:completed');
  }, [
    chatInput,
    attachedFiles,
    status,
    sendTextMessage,
    sendMultimodalMessage,
    resolveApprovalByUtterance,
  ]);

  const handleNativeFileSelect = async () => {
    if (attachedFiles.length >= 5) {
      alert('You can only attach up to 5 files at a time.');
      return;
    }

    try {
      const results = await electronAPI.pickAndReadFiles();
      if (results && results.length > 0) {
        const spaceLeft = 5 - attachedFiles.length;
        const newFiles = results.slice(0, spaceLeft);
        setAttachedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error('Failed to pick files:', err);
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Scroll to bottom of transcription
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Camera State & Refs
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const memoryInputRef = useRef<HTMLInputElement>(null);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      setCameraStream(null);
      setIsCameraOn(false);
      setIsCameraLoading(false);
    } else {
      try {
        setIsCameraLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
        setCameraStream(stream);
        setIsCameraOn(true);
        setIsCameraLoading(false);
      } catch (err) {
        console.error('Camera access denied:', err);
        setIsCameraLoading(false);
        alert('Please allow camera access to use visual AI features.');
      }
    }
  };

  // 1 FPS Frame Capture Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCameraOn && status === ConnectionStatus.CONNECTED && cameraStream) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            context.drawImage(video, 0, 0, 320, 240);
            const base64Image = canvas.toDataURL('image/jpeg', 0.5);
            const rawBase64 = base64Image.split(',')[1];
            sendVideoFrame(rawBase64);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraOn, status, cameraStream, sendVideoFrame]);

  useEffect(() => {
    if (isCameraOn && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOn, cameraStream]);

  // Reset visual hub view when content changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [generatedImage, generatedDiagram]);

  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(460);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const handleWindowResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // --- Sidebar Compression Logic ---
  const CENTER_MIN_WIDTH = useMemo(() => {
    if (windowWidth < 1100) return 520;
    if (windowWidth < 1400) return 640;
    if (windowWidth < 1700) return 760;
    return 900;
  }, [windowWidth]);
  const SIDEBAR_MIN_WIDTH = 200;

  const currentRightWidth = useMemo(() => {
    if (isResizingRight) return rightWidth;
    const totalRequired = leftWidth + CENTER_MIN_WIDTH + rightWidth;
    const shortfall = totalRequired - windowWidth;
    if (shortfall <= 0) return rightWidth;
    const compressedWidth = rightWidth - shortfall;
    if (compressedWidth < SIDEBAR_MIN_WIDTH) return 0;
    return compressedWidth;
  }, [windowWidth, leftWidth, rightWidth, isResizingRight, CENTER_MIN_WIDTH]);

  const currentLeftWidth = useMemo(() => {
    if (isResizingLeft) return leftWidth;
    const totalRequired = leftWidth + CENTER_MIN_WIDTH + currentRightWidth;
    const shortfall = totalRequired - windowWidth;
    if (shortfall <= 0) return leftWidth;
    const compressedWidth = leftWidth - shortfall;
    if (compressedWidth < SIDEBAR_MIN_WIDTH) return 0;
    return compressedWidth;
  }, [windowWidth, leftWidth, currentRightWidth, isResizingLeft, CENTER_MIN_WIDTH]);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth > 220 && newWidth < 520) setLeftWidth(newWidth);
      } else if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 260 && newWidth < 680) setRightWidth(newWidth);
      }
    },
    [isResizingLeft, isResizingRight]
  );

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      const stopResizing = () => {
        setIsResizingLeft(false);
        setIsResizingRight(false);
      };
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = '';
      };
    }
  }, [isResizingLeft, isResizingRight, resize]);

  const handleStartStop = () => {
    if (status === ConnectionStatus.CONNECTED) disconnect();
    else connect();
  };

  // --- Dynamic SVG Line Calculation ---
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const addFilesRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const [paths, setPaths] = useState({
    addFiles: '',
    memory: '',
    history: '',
    user: '',
    centerToCircle: '',
    centerNode: { cx: 0, cy: 0 },
  });

  const updatePaths = useCallback(() => {
    if (!svgContainerRef.current || !centerNodeRef.current || !circleRef.current) return;

    const containerRect = svgContainerRef.current.getBoundingClientRect();
    const getRelPos = (element: HTMLElement, anchor: 'left' | 'right' | 'center') => {
      const rect = element.getBoundingClientRect();
      let x = 0;
      if (anchor === 'left') x = rect.left + rect.width / 2 - containerRect.left;
      else if (anchor === 'right') x = rect.right - containerRect.left;
      else x = rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top + rect.height / 2 - containerRect.top;
      return { x, y };
    };

    const centerPos = getRelPos(centerNodeRef.current, 'center');
    const circlePos = getRelPos(circleRef.current, 'left');

    const generatePath = (startRef: React.RefObject<HTMLDivElement | null>) => {
      if (!startRef.current) return '';
      const start = getRelPos(startRef.current, 'right');
      const end = centerPos;
      const cp1 = { x: start.x + (end.x - start.x) * 0.5, y: start.y };
      const cp2 = { x: end.x - (end.x - start.x) * 0.5, y: end.y };
      return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    };

    const nextPaths = {
      addFiles: generatePath(addFilesRef),
      memory: generatePath(memoryRef),
      history: generatePath(historyRef),
      user: generatePath(userRef),
      centerToCircle: `M ${centerPos.x} ${centerPos.y} L ${circlePos.x} ${circlePos.y}`,
      centerNode: { cx: centerPos.x, cy: centerPos.y },
    };

    setPaths((prev) => {
      const unchanged =
        prev.addFiles === nextPaths.addFiles &&
        prev.memory === nextPaths.memory &&
        prev.history === nextPaths.history &&
        prev.user === nextPaths.user &&
        prev.centerToCircle === nextPaths.centerToCircle &&
        prev.centerNode.cx === nextPaths.centerNode.cx &&
        prev.centerNode.cy === nextPaths.centerNode.cy;

      return unchanged ? prev : nextPaths;
    });
  }, []);

  useEffect(() => {
    if (activeTab !== 'intelligence') return;

    updatePaths();
    const interval = window.setInterval(updatePaths, 1500);
    return () => {
      window.clearInterval(interval);
    };
  }, [activeTab, updatePaths]);

  useEffect(() => {
    if (activeTab !== 'intelligence') return;

    const rafId = window.requestAnimationFrame(updatePaths);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    activeTab,
    windowWidth,
    currentLeftWidth,
    currentRightWidth,
    rightPanelMode,
    isVisualHubExpanded,
    importedFolders.length,
    attachedFiles.length,
    updatePaths,
  ]);

  if (!hasCheckedKey) return <LoadingScreen key='key-check-loading' />;

  if (!electronAPI) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#020406',
          color: '#e5f8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Desktop bridge unavailable</div>
          <div style={{ opacity: 0.7, fontSize: '13px' }}>
            Preload API not detected. Start app with npm run electron:dev and avoid opening the app
            directly in browser.
          </div>
        </div>
      </div>
    );
  }

  if (isSecretKeyModalOpen) {
    return (
      <div className='h-screen w-screen bg-j-void flex items-center justify-center'>
        <SecretKeyModal
          isOpen={isSecretKeyModalOpen}
          onClose={(key) => {
            if (key) {
              setIsSecretKeyModalOpen(false);
              // After key is saved, initialization continues...
            }
          }}
        />
      </div>
    );
  }

  if (isInitialLoading)
    return <LoadingScreen key='initial-loading' onFinished={() => setIsInitialLoading(false)} />;
  if (isLoading) return <LoadingScreen />;

  return (
    <div className='readability-boost h-screen w-screen bg-j-void text-j-text-primary font-sans overflow-hidden selection:bg-j-cyan/20 flex flex-col'>
      <div className='absolute inset-0 bg-hex-grid opacity-[0.05] pointer-events-none z-0'></div>

      <div className='w-full h-full flex flex-col relative z-10 bg-gradient-to-b from-transparent to-j-void/90'>
        {/* Header */}
        <header className='h-16 border-b border-white/[0.05] flex items-center justify-between px-6 shrink-0 z-10 bg-j-panel/60 backdrop-blur-xl shadow-2xl'>
          {/* Logo Section */}
          <div className='flex items-center gap-4 mr-8'>
            <img src='logo.png' alt='Logo' className='w-8 h-8 object-contain rounded-lg' />
            <span className='text-lg font-bold tracking-widest text-white hidden md:block opacity-80'>
              Theta
            </span>
          </div>

          <div className='hidden sm:flex items-center'>
            <div className='flex border border-white/[0.1] rounded-lg overflow-hidden bg-j-surface/50'>
              {['Dashboard', 'Intelligence', 'Notes', 'Tasks'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    playClick();
                    setActiveTab(item.toLowerCase());
                  }}
                  className={`px-4 py-1.5 text-sm font-medium transition-all border-r border-white/[0.1] ${
                    activeTab === item.toLowerCase()
                      ? 'bg-j-cyan/10 text-j-cyan shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]'
                      : 'text-j-text-secondary hover:text-j-text-primary hover:bg-white/5'
                  } last:border-r-0`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Update Notification Badge */}
          <div className='flex items-center gap-3'>
            <UpdateNotification />
            <button
              onClick={() => {
                playClick();
                setIsSettingsModalOpen(true);
              }}
              className='p-2 text-j-text-secondary hover:text-j-cyan hover:rotate-90 transition-all duration-500'
            >
              <Settings size={24} />
            </button>
          </div>
        </header>

        {/* Modals */}
        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memories={memories}
          newMemoryInput={newMemoryInput}
          setNewMemoryInput={setNewMemoryInput}
          handleAddMemory={handleAddMemory}
          handleDeleteMemory={handleDeleteMemory}
          memoryInputRef={memoryInputRef}
        />
        <UserProfileModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          userProfile={userProfile}
          handleUpdateProfile={handleUpdateProfile}
        />
        <DashboardSettingsModal
          isOpen={isDashboardModalOpen}
          onClose={() => setIsDashboardModalOpen(false)}
          dashboardSettings={dashboardSettings}
          handleUpdateDashboardSettings={handleUpdateDashboardSettings}
        />
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          history={history}
          historySettings={historySettings}
          handleUpdateHistorySettings={handleUpdateHistorySettings}
          handleClearHistory={handleClearHistory}
        />
        <ContactsModal
          isOpen={isContactsModalOpen}
          onClose={() => setIsContactsModalOpen(false)}
          contacts={contacts}
          handleAddContact={handleAddContact}
          handleDeleteContact={handleDeleteContact}
        />
        <ActionApprovalModal
          request={pendingApprovalRequest}
          onApprove={(requestId) => handleApprovalDecision(requestId, true)}
          onReject={(requestId) => handleApprovalDecision(requestId, false)}
        />

        <SecretKeyModal
          isOpen={isSecretKeyModalOpen}
          onClose={(key) => {
            if (key) {
              setIsSecretKeyModalOpen(false);
              // Force reconnect if key was missing
              if (status === ConnectionStatus.DISCONNECTED) connect();
            }
          }}
        />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

        {/* Main Content */}
        <main className='flex-1 flex min-h-0 overflow-hidden z-10 relative bg-black/10'>
          <SidebarLeft
            currentWidth={currentLeftWidth}
            isResizing={isResizingLeft || isResizingRight}
            isCameraOn={isCameraOn}
            isCameraLoading={isCameraLoading}
            videoRef={videoRef}
            canvasRef={canvasRef}
            toggleCamera={toggleCamera}
            onStartResizing={startResizingLeft}
            dashboardData={dashboardData}
            isDashboardLoading={isDashboardLoading}
            setIsUserModalOpen={setIsUserModalOpen}
            setIsDashboardModalOpen={setIsDashboardModalOpen}
            refreshDashboard={refreshDashboard}
            advisorRecommendations={advisorRecommendations}
            isAdvisorScanning={isAdvisorScanning}
            onAdvisorScanNow={runSystemHealthScan}
            onAdvisorRunFix={handleRunAdvisorFix}
          />

          <section className='flex-1 flex flex-col min-w-0 relative bg-gradient-to-b from-j-void/50 to-j-void'>
            <div
              className='flex-1 flex p-3 sm:p-4 lg:p-6 gap-3 sm:gap-5 lg:gap-8 relative items-center justify-center overflow-hidden'
              ref={svgContainerRef}
            >
              {activeTab === 'intelligence' ? (
                <>
                  <SystemConnections paths={paths} windowWidth={windowWidth} />

                  <div className='hidden sm:flex items-center z-10 py-4 h-full gap-10'>
                    <FolderExplorer
                      importedFolders={importedFolders}
                      handleImportFolder={handleImportFolder}
                      handleRemoveFolder={handleRemoveFolder}
                      handleOpenFolder={handleOpenFolder}
                      handleOpenVaultFolder={handleOpenVaultFolder}
                      editingFolderIdx={editingFolderIdx}
                      tempFolderName={tempFolderName}
                      setTempFolderName={setTempFolderName}
                      handleFinishRename={handleFinishRename}
                      handleStartRename={handleStartRename}
                    />

                    <SystemControls
                      handleNativeFileSelect={handleNativeFileSelect}
                      attachedFiles={attachedFiles}
                      removeFile={removeFile}
                      setIsMemoryModalOpen={setIsMemoryModalOpen}
                      setIsHistoryModalOpen={setIsHistoryModalOpen}
                      setIsUserModalOpen={setIsUserModalOpen}
                      setIsContactsModalOpen={setIsContactsModalOpen}
                      memoryInputRef={memoryInputRef}
                      addFilesRef={addFilesRef}
                      memoryRef={memoryRef}
                      historyRef={historyRef}
                      userRef={userRef}
                    />
                  </div>

                  {windowWidth >= 800 && (
                    <div className='flex-1 flex items-center justify-center pointer-events-none'>
                      <div ref={centerNodeRef} className='w-1 h-1'></div>
                    </div>
                  )}

                  <AIGlobePortal
                    status={status}
                    isAISpeaking={isAISpeaking}
                    analyser={analyser}
                    micAnalyser={micAnalyser}
                    handleStartStop={handleStartStop}
                    portalRef={circleRef}
                    windowWidth={windowWidth}
                  />
                </>
              ) : activeTab === 'dashboard' ? (
                <div className='w-full h-full z-10 overflow-y-auto custom-scrollbar pr-1'>
                  <DashboardGrid
                    userProfile={userProfile}
                    dashboardSettings={dashboardSettings}
                    dashboardData={dashboardData}
                    isDashboardLoading={isDashboardLoading}
                    onRefreshHeadlines={refreshDashboard}
                    onDeepDiveIdea={handleDeepDiveIdea}
                  />
                </div>
              ) : activeTab === 'notes' ? (
                <div className='w-full h-full max-w-6xl z-10 overflow-y-auto custom-scrollbar pr-1'>
                  <NotesSection
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                  />
                </div>
              ) : (
                <div className='w-full h-full max-w-4xl z-10 overflow-y-auto custom-scrollbar pr-1'>
                  <TasksSection tasks={tasks} onSaveTasks={handleSaveTasks} />
                </div>
              )}
            </div>

            {activeTab === 'intelligence' && (
              <VisualHub
                isExpanded={isVisualHubExpanded}
                onToggleExpand={() => setIsVisualHubExpanded(!isVisualHubExpanded)}
                generatedImage={generatedImage}
                generatedDiagram={generatedDiagram}
                isVisualizing={isVisualizing}
                isDiagramRendering={isDiagramRendering}
                onReset={() => {
                  setGeneratedImage(null);
                  setGeneratedDiagram(null);
                }}
                zoom={zoom}
                setZoom={setZoom}
                pan={pan}
                setPan={setPan}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                dragStart={dragStart}
                setDragStart={setDragStart}
              />
            )}
          </section>

          <SidebarRight
            currentWidth={currentRightWidth}
            isResizing={isResizingLeft || isResizingRight}
            rightPanelMode={rightPanelMode}
            setRightPanelMode={setRightPanelMode}
            messages={messages}
            logs={logs}
            status={status}
            attachedFiles={attachedFiles}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
            handleNativeFileSelect={handleNativeFileSelect}
            removeFile={removeFile}
            messagesEndRef={messagesEndRef}
            onStartResizing={startResizingRight}
            isThinking={isThinking}
            currentThought={currentThought}
            thinkingEnabled={thinkingEnabled}
            setThinkingEnabled={setThinkingEnabled}
            currentOutput={currentOutput}
          />
        </main>
        {activeVideoId && (
          <YouTubePlayer videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
        )}
      </div>
    </div>
  );
}

export default App;
