import { Settings } from "lucide-react";
import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";

import ActionApprovalModal from "./components/modals/ActionApprovalModal";
import ContactsModal from "./components/modals/ContactsModal";
import DashboardSettingsModal from "./components/modals/DashboardSettingsModal";
import HistoryModal from "./components/modals/HistoryModal";
import MemoryModal from "./components/modals/MemoryModal";
import SecretKeyModal from "./components/modals/SecretKeyModal";
import SettingsModal from "./components/modals/SettingsModal";
import UserProfileModal from "./components/modals/UserProfileModal";
import AIGlobePortal from "./components/modules/AIGlobePortal";
import DashboardGrid from "./components/modules/DashboardGrid";
import FolderExplorer from "./components/modules/FolderExplorer";
import LoadingScreen from "./components/modules/LoadingScreen";
import NotesSection from "./components/modules/NotesSection";
import SidebarLeft from "./components/modules/SidebarLeft";
import SidebarRight from "./components/modules/SidebarRight";
import SystemConnections from "./components/modules/SystemConnections";
import SystemControls from "./components/modules/SystemControls";
import TasksSection from "./components/modules/TasksSection";
import UpdateNotification from "./components/modules/UpdateNotification";
import VisualHub from "./components/modules/VisualHub";
import YouTubePlayer from "./components/modules/YouTubePlayer";
import { useAppState } from "./contexts/AppStateContext";
import { useData } from "./contexts/DataContext";
import { useAudio } from "./hooks/useAudio";
import { useGeminiLive } from "./hooks/useGeminiLive";
import { useZoom } from "./hooks/useZoom";
import { logger } from "./lib/logger";
import { ConnectionStatus } from "./types";

const electronAPI = window.electronAPI;

const logAppFlow = (stage: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (details) {
    logger.debug(`[AppFlow ${timestamp}] ${stage}`, details);
    return;
  }
  logger.debug(`[AppFlow ${timestamp}] ${stage}`);
};

interface AdvisorRecommendation {
  id: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  command?: string;
  risk: "green" | "yellow" | "red";
}

function App() {
  useZoom();
  const { playClick } = useAudio();

  const {
    activeTab,
    setActiveTab,
    isAISpeaking,
    setIsAISpeaking,
    generatedImage,
    setGeneratedImage,
    generatedDiagram,
    setGeneratedDiagram,
    isMemoryModalOpen,
    setIsMemoryModalOpen,
    isUserModalOpen,
    setIsUserModalOpen,
    isDashboardModalOpen,
    setIsDashboardModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isContactsModalOpen,
    setIsContactsModalOpen,
    isSecretKeyModalOpen,
    setIsSecretKeyModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isLoading,
    isInitialLoading,
    setIsInitialLoading,
    isVisualizing,
    setIsVisualizing,
    isDiagramRendering,
    rightPanelMode,
    setRightPanelMode,
    isVisualHubExpanded,
    setIsVisualHubExpanded,
    attachedFiles,
    setAttachedFiles,
    pendingApprovalRequest,
    setPendingApprovalRequest,
    activeVideoId,
    setActiveVideoId,
    chatInput,
    setChatInput,
    memoryInputRef,
  } = useAppState();

  const {
    memories,
    handleAddMemory,
    handleDeleteMemory,
    handleMemoriesUpdated,
    userProfile,
    handleUpdateProfile,
    dashboardSettings,
    handleUpdateDashboardSettings,
    history,
    setHistory,
    historySettings,
    handleUpdateHistorySettings,
    handleClearHistory,
    importedFolders,
    handleImportFolder,
    handleRemoveFolder,
    handleOpenFolder,
    handleOpenVaultFolder,
    vaultPath,
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
  } = useData();

  // Visual Hub Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [advisorRecommendations, setAdvisorRecommendations] = useState<AdvisorRecommendation[]>([]);
  const [isAdvisorScanning, setIsAdvisorScanning] = useState(false);
  const [editingFolderIdx, setEditingFolderIdx] = useState<number | null>(null);
  const [tempFolderName, setTempFolderName] = useState("");
  const [newMemoryInput, setNewMemoryInput] = useState("");

  const pendingDeepDivePromptRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyPersistTimerRef = useRef<number | null>(null);

  const handleStartRename = (idx: number, name: string) => {
    setEditingFolderIdx(idx);
    setTempFolderName(name);
  };

  const handleFinishRename = async () => {
    if (editingFolderIdx !== null && tempFolderName.trim()) {
      const newFolders = [...importedFolders];
      newFolders[editingFolderIdx].name = tempFolderName;
      await electronAPI.saveImportedFolders(newFolders).then(() => {
        // Assume context refresh via state or local
      });
    }
    setEditingFolderIdx(null);
  };

  const handleImageGenerated = useCallback(
    (url: string) => {
      setGeneratedImage(url);
      setIsVisualHubExpanded(true);
    },
    [setGeneratedImage, setIsVisualHubExpanded]
  );

  const handleDiagramGenerated = useCallback(
    (html: string) => {
      setGeneratedDiagram(html);
      setIsVisualHubExpanded(true);
    },
    [setGeneratedDiagram, setIsVisualHubExpanded]
  );

  const handleDashboardUpdate = useCallback((data: Record<string, unknown>) => {
    setDashboardData(data);
    setIsDashboardLoading(false);
  }, []);

  const handleYouTubePlay = useCallback(
    (videoId: string) => {
      setActiveVideoId(videoId);
    },
    [setActiveVideoId]
  );

  const vaultInfo = {
    path: vaultPath || "Documents/Theta_Vault",
    folders: importedFolders,
  };

  const initialHistory = history.slice(
    -Math.max(1, Number(historySettings?.maxContextMessages || 20))
  );

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
    setThinkingEnabledState: setThinkingEnabled,
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
    async (idea: {
      title: string;
      summary: string;
      relevance: string;
      feasibility: number;
      trendLink?: string;
    }) => {
      const deepDivePrompt = `Deep dive this business idea with an execution plan:\n\nTitle: ${idea.title}\nSummary: ${idea.summary}\nWhy relevant today: ${idea.relevance}\nFeasibility: ${idea.feasibility}/5\nTrend source: ${idea.trendLink || "N/A"}\n\nProvide: 1) market angle 2) 7-day execution steps 3) key risks 4) expected ROI assumptions.`;

      setActiveTab("intelligence");
      if (status === ConnectionStatus.CONNECTED) {
        sendTextMessage(deepDivePrompt);
      } else {
        pendingDeepDivePromptRef.current = deepDivePrompt;
        await connect();
      }
    },
    [connect, sendTextMessage, status, setActiveTab]
  );

  const pendingWakeWordCommand = useRef<string | null>(null);

  const handleApprovalDecision = useCallback(
    async (requestId: string, approved: boolean) => {
      logAppFlow("approval:respond:start", { requestId, approved });
      await electronAPI.respondActionApproval({ requestId, approved });
      setPendingApprovalRequest((current) => (current?.requestId === requestId ? null : current));
      logAppFlow("approval:respond:completed", { requestId, approved });
    },
    [setPendingApprovalRequest]
  );

  const resolveApprovalByUtterance = useCallback(
    async (utterance: string) => {
      if (!pendingApprovalRequest) return false;
      const normalized = utterance.trim().toLowerCase();
      if (!normalized) return false;

      const allowPattern =
        /^(allow|approve|approved|yes|ok|okay|go ahead|do it|haan|han|ji|sure)\b/i;
      const rejectPattern = /^(reject|deny|no|cancel|stop|mat|don't|do not)\b/i;

      if (allowPattern.test(normalized)) {
        await handleApprovalDecision(pendingApprovalRequest.requestId, true);
        addLog("success", "Approval accepted via voice/text response.");
        return true;
      }
      if (rejectPattern.test(normalized)) {
        await handleApprovalDecision(pendingApprovalRequest.requestId, false);
        addLog("warning", "Approval rejected via voice/text response.");
        return true;
      }
      return false;
    },
    [addLog, handleApprovalDecision, pendingApprovalRequest]
  );

  useEffect(() => {
    if (!electronAPI) return;
    const unsubscribeWake = electronAPI.onWakeWordDetected(
      async (data: { type: string; msg?: string; text?: string; command?: string }) => {
        if (data.type === "INFO") {
          addLog("info", `WakeWord Engine: ${data.msg}`);
          return;
        }
        if (data.type === "ERROR") {
          addLog("error", `WakeWord Engine Error: ${data.msg}`);
          return;
        }

        if (data.type === "WAKE_WORD") {
          addLog("success", `Wake Word Detected: "${data.text}"`);
          if (data.command) {
            const handled = await resolveApprovalByUtterance(data.command);
            if (handled) return;
            pendingWakeWordCommand.current = data.command;
          }

          if (status === ConnectionStatus.DISCONNECTED) {
            connect().catch((err: Error) => logger.error(err));
          } else if (status === ConnectionStatus.CONNECTED && data.command) {
            const handled = await resolveApprovalByUtterance(data.command);
            if (handled) return;
            sendTextMessage(data.command);
            pendingWakeWordCommand.current = null;
          }
        }
      }
    );

    return () => unsubscribeWake();
  }, [status, connect, sendTextMessage, addLog, resolveApprovalByUtterance]);

  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED && pendingWakeWordCommand.current) {
      sendTextMessage(pendingWakeWordCommand.current);
      pendingWakeWordCommand.current = null;
    }
    if (status === ConnectionStatus.CONNECTED && pendingDeepDivePromptRef.current) {
      sendTextMessage(pendingDeepDivePromptRef.current);
      pendingDeepDivePromptRef.current = null;
    }
  }, [status, sendTextMessage]);

  const refreshDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    try {
      if (status === ConnectionStatus.CONNECTED) {
        const prompt = `[SYSTEM_INIT_FETCH] Search for today's top 5 headlines and weather in ${userProfile.location || "my area"} based on my interests: ${dashboardSettings.interests.join(", ")}. Use the update_dashboard tool to provide the information. Do not respond verbally unless I ask.`;
        sendTextMessage(prompt, true);
        return;
      }
      const response = await electronAPI.fetchDashboardData({
        location: userProfile.location,
        interests: dashboardSettings.interests,
      });
      if (response?.headlines) setDashboardData(response);
    } catch (error) {
      logger.error("Dashboard refresh failed:", error);
    } finally {
      setIsDashboardLoading(false);
    }
  }, [status, userProfile.location, dashboardSettings.interests, sendTextMessage]);

  const runSystemHealthScan = useCallback(async () => {
    setIsAdvisorScanning(true);
    try {
      const processesRaw = await electronAPI.getProcesses();
      const recommendations: AdvisorRecommendation[] = [];
      const _processes = Array.isArray(processesRaw) ? processesRaw : [];
      // Use _processes to satisfy linter if intended for future logic, or just ignore it:
      logger.info("Scanned processes count:", _processes.length);
      setAdvisorRecommendations(recommendations);
    } catch (error) {
      logger.error(error);
    } finally {
      setIsAdvisorScanning(false);
    }
  }, []);

  const handleRunAdvisorFix = useCallback(async (recommendation: AdvisorRecommendation) => {
    if (!recommendation.command) return;
    await electronAPI.executeSystemCommand({ command: recommendation.command });
  }, []);

  useEffect(() => {
    if (!electronAPI?.onActionApprovalRequested) return;
    const unsubscribeApproval = electronAPI.onActionApprovalRequested((payload) => {
      setPendingApprovalRequest({
        requestId: payload.requestId || payload.id,
        action: payload.action,
        detail: payload.details,
        risk: payload.risk || "yellow",
      });
    });
    return () => unsubscribeApproval();
  }, [setPendingApprovalRequest]);

  useEffect(() => {
    runSystemHealthScan()
      .then(() => {
        logger.info("sys info done");
      })
      .catch(() => {
        logger.info("sys info failed");
      });
    const intervalId = window.setInterval(runSystemHealthScan, 30 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [runSystemHealthScan]);

  useEffect(() => {
    const refreshSeconds = Math.max(30, Number(dashboardSettings?.refreshInterval || 3600));
    const intervalId = window.setInterval(refreshDashboard, refreshSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [dashboardSettings?.refreshInterval, refreshDashboard]);

  useEffect(() => {
    if (!historySettings.storeHistory || messages.length === 0) return;
    if (messages.some((m) => m.isStreaming)) return;

    if (historyPersistTimerRef.current) window.clearTimeout(historyPersistTimerRef.current);
    historyPersistTimerRef.current = window.setTimeout(() => {
      setHistory(messages);
      electronAPI.saveHistory(messages).catch((err: Error) => console.error(err));
      historyPersistTimerRef.current = null;
    }, 800);

    return () => {
      if (historyPersistTimerRef.current) window.clearTimeout(historyPersistTimerRef.current);
    };
  }, [messages, historySettings.storeHistory, setHistory]);

  const handleSendChat = useCallback(async () => {
    if (
      (!chatInput.trim() && attachedFiles.length === 0) ||
      status !== ConnectionStatus.CONNECTED
    ) {
      return;
    }
    const handled = await resolveApprovalByUtterance(chatInput.trim());
    if (handled) {
      setChatInput("");
      return;
    }

    if (attachedFiles.length > 0) {
      sendMultimodalMessage(chatInput.trim(), attachedFiles);
      setAttachedFiles([]);
    } else {
      sendTextMessage(chatInput.trim());
    }
    setChatInput("");
  }, [
    chatInput,
    attachedFiles,
    status,
    sendTextMessage,
    sendMultimodalMessage,
    resolveApprovalByUtterance,
    setChatInput,
    setAttachedFiles,
  ]);

  const handleNativeFileSelect = async () => {
    if (attachedFiles.length >= 5) {
      window.alert("Max 5 files");
      return;
    }
    try {
      const results = await electronAPI.pickAndReadFiles();
      if (results && results.length > 0) {
        const spaceLeft = 5 - attachedFiles.length;
        setAttachedFiles((prev) => [...prev, ...results.slice(0, spaceLeft)]);
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      setIsCameraOn(false);
      setIsCameraLoading(false);
    } else {
      try {
        setIsCameraLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
        setCameraStream(stream);
        setIsCameraOn(true);
        setIsCameraLoading(false);
      } catch {
        setIsCameraLoading(false);
        window.alert("Camera access denied.");
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraOn && status === ConnectionStatus.CONNECTED && cameraStream) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const base64Image = canvas.toDataURL("image/jpeg", 0.5);
            sendVideoFrame(base64Image.split(",")[1]);
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraOn, status, cameraStream, sendVideoFrame]);

  useEffect(() => {
    if (isCameraOn && videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [isCameraOn, cameraStream]);
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
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const CENTER_MIN_WIDTH = useMemo(() => {
    if (windowWidth < 1100) return 520;
    if (windowWidth < 1400) return 640;
    if (windowWidth < 1700) return 760;
    return 900;
  }, [windowWidth]);

  const currentRightWidth = useMemo(() => {
    if (isResizingRight) return rightWidth;
    const shortfall = leftWidth + CENTER_MIN_WIDTH + rightWidth - windowWidth;
    if (shortfall <= 0) return rightWidth;
    const compressed = rightWidth - shortfall;
    return compressed < 200 ? 0 : compressed;
  }, [windowWidth, leftWidth, rightWidth, isResizingRight, CENTER_MIN_WIDTH]);

  const currentLeftWidth = useMemo(() => {
    if (isResizingLeft) return leftWidth;
    const shortfall = leftWidth + CENTER_MIN_WIDTH + currentRightWidth - windowWidth;
    if (shortfall <= 0) return leftWidth;
    const compressed = leftWidth - shortfall;
    return compressed < 200 ? 0 : compressed;
  }, [windowWidth, leftWidth, currentRightWidth, isResizingLeft, CENTER_MIN_WIDTH]);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingLeft) {
        if (e.clientX > 220 && e.clientX < 520) setLeftWidth(e.clientX);
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
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      return () => {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = "";
      };
    }
  }, [isResizingLeft, isResizingRight, resize]);

  const handleStartStop = () => {
    status === ConnectionStatus.CONNECTED
      ? disconnect().catch((err: Error) => logger.error(err))
      : connect().catch((err: Error) => logger.error(err));
  };

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const addFilesRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const centerNodeRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  const [paths, setPaths] = useState({
    addFiles: "",
    memory: "",
    history: "",
    user: "",
    centerToCircle: "",
    centerNode: { cx: 0, cy: 0 },
  });

  const updatePaths = useCallback(() => {
    if (!svgContainerRef.current || !centerNodeRef.current || !circleRef.current) return;
    const containerRect = svgContainerRef.current.getBoundingClientRect();
    const getRelPos = (element: HTMLElement, anchor: "left" | "right" | "center") => {
      const rect = element.getBoundingClientRect();
      const x =
        anchor === "left"
          ? rect.left + rect.width / 2 - containerRect.left
          : anchor === "right"
            ? rect.right - containerRect.left
            : rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top + rect.height / 2 - containerRect.top;
      return { x, y };
    };

    const centerPos = getRelPos(centerNodeRef.current, "center");
    const circlePos = getRelPos(circleRef.current, "left");

    const generatePath = (startRef: React.RefObject<HTMLDivElement | null>) => {
      if (!startRef.current) return "";
      const start = getRelPos(startRef.current, "right");
      return `M ${start.x} ${start.y} C ${start.x + (centerPos.x - start.x) * 0.5} ${start.y}, ${centerPos.x - (centerPos.x - start.x) * 0.5} ${centerPos.y}, ${centerPos.x} ${centerPos.y}`;
    };

    setPaths({
      addFiles: generatePath(addFilesRef),
      memory: generatePath(memoryRef),
      history: generatePath(historyRef),
      user: generatePath(userRef),
      centerToCircle: `M ${centerPos.x} ${centerPos.y} L ${circlePos.x} ${circlePos.y}`,
      centerNode: { cx: centerPos.x, cy: centerPos.y },
    });
  }, []);

  useEffect(() => {
    if (activeTab === "intelligence") {
      updatePaths();
      const interval = window.setInterval(updatePaths, 1500);
      return () => window.clearInterval(interval);
    }
  }, [activeTab, updatePaths]);

  if (!hasCheckedKey) return <LoadingScreen key="key-check-loading" />;
  if (isSecretKeyModalOpen) {
    return (
      <div className="h-screen w-screen bg-j-void flex items-center justify-center">
        <SecretKeyModal
          isOpen={isSecretKeyModalOpen}
          onClose={(key) => {
            if (key) setIsSecretKeyModalOpen(false);
          }}
        />
      </div>
    );
  }
  if (isInitialLoading) {
    return <LoadingScreen key="initial-loading" onFinished={() => setIsInitialLoading(false)} />;
  }
  if (isLoading) return <LoadingScreen />;

  return (
    <div className="readability-boost h-screen w-screen bg-j-void text-j-text-primary font-sans overflow-hidden selection:bg-j-cyan/20 flex flex-col">
      <div className="absolute inset-0 bg-hex-grid opacity-[0.05] pointer-events-none z-0" />
      <div className="w-full h-full flex flex-col relative z-10 bg-gradient-to-b from-transparent to-j-void/90">
        <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-6 shrink-0 z-10 bg-j-panel/60 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4 mr-8">
            <img src="logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="text-lg font-bold tracking-widest text-white hidden md:block opacity-80">
              Theta
            </span>
          </div>
          <div className="hidden sm:flex items-center">
            <div className="flex border border-white/[0.1] rounded-lg overflow-hidden bg-j-surface/50">
              {["Dashboard", "Intelligence", "Notes", "Tasks"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    playClick();
                    setActiveTab(item.toLowerCase());
                  }}
                  className={`px-4 py-1.5 text-sm font-medium transition-all border-r border-white/[0.1] ${
                    activeTab === item.toLowerCase()
                      ? "bg-j-cyan/10 text-j-cyan shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]"
                      : "text-j-text-secondary hover:text-j-text-primary hover:bg-white/5"
                  } last:border-r-0`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UpdateNotification />
            <button
              onClick={() => {
                playClick();
                setIsSettingsModalOpen(true);
              }}
              className="p-2 text-j-text-secondary hover:text-j-cyan hover:rotate-90 transition-all duration-500"
            >
              <Settings size={24} />
            </button>
          </div>
        </header>

        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memories={memories}
          newMemoryInput={newMemoryInput}
          setNewMemoryInput={setNewMemoryInput}
          handleAddMemory={() => handleAddMemory(newMemoryInput)}
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
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

        <main className="flex-1 flex min-h-0 overflow-hidden z-10 relative bg-black/10">
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
          <section className="flex-1 flex flex-col min-w-0 relative bg-gradient-to-b from-j-void/50 to-j-void">
            <div
              className="flex-1 flex p-3 sm:p-4 lg:p-6 gap-3 sm:gap-5 lg:gap-8 relative items-center justify-center overflow-hidden"
              ref={svgContainerRef}
            >
              {activeTab === "intelligence" ? (
                <>
                  <SystemConnections paths={paths} windowWidth={windowWidth} />
                  <div className="hidden sm:flex items-center z-10 py-4 h-full gap-10">
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
                    <div className="flex-1 flex items-center justify-center pointer-events-none">
                      <div ref={centerNodeRef} className="w-1 h-1" />
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
              ) : activeTab === "dashboard" ? (
                <div className="w-full h-full z-10 overflow-y-auto custom-scrollbar pr-1">
                  <DashboardGrid
                    userProfile={userProfile}
                    dashboardSettings={dashboardSettings}
                    dashboardData={dashboardData}
                    isDashboardLoading={isDashboardLoading}
                    onRefreshHeadlines={refreshDashboard}
                    onDeepDiveIdea={handleDeepDiveIdea}
                  />
                </div>
              ) : activeTab === "notes" ? (
                <div className="w-full h-full max-w-6xl z-10 overflow-y-auto custom-scrollbar pr-1">
                  <NotesSection
                    notes={notes}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                  />
                </div>
              ) : (
                <div className="w-full h-full max-w-4xl z-10 overflow-y-auto custom-scrollbar pr-1">
                  <TasksSection tasks={tasks} onSaveTasks={handleSaveTasks} />
                </div>
              )}
            </div>
            {activeTab === "intelligence" && (
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
