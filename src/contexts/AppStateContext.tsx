import React, { createContext, use, useState, useRef, type ReactNode } from "react";

import { type ActionApprovalRequest } from "../components/modals/ActionApprovalModal";

interface AppStateContextType {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  inputMode: string;
  setInputMode: React.Dispatch<React.SetStateAction<string>>;
  isAISpeaking: boolean;
  setIsAISpeaking: React.Dispatch<React.SetStateAction<boolean>>;

  generatedImage: string | null;
  setGeneratedImage: React.Dispatch<React.SetStateAction<string | null>>;
  generatedDiagram: string | null;
  setGeneratedDiagram: React.Dispatch<React.SetStateAction<string | null>>;

  isMemoryModalOpen: boolean;
  setIsMemoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUserModalOpen: boolean;
  setIsUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDashboardModalOpen: boolean;
  setIsDashboardModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isContactsModalOpen: boolean;
  setIsContactsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSecretKeyModalOpen: boolean;
  setIsSecretKeyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isInitialLoading: boolean;
  setIsInitialLoading: React.Dispatch<React.SetStateAction<boolean>>;

  isVisualizing: boolean;
  setIsVisualizing: React.Dispatch<React.SetStateAction<boolean>>;
  isDiagramRendering: boolean;
  setIsDiagramRendering: React.Dispatch<React.SetStateAction<boolean>>;
  rightPanelMode: "chat" | "terminal";
  setRightPanelMode: React.Dispatch<React.SetStateAction<"chat" | "terminal">>;

  isVisualHubExpanded: boolean;
  setIsVisualHubExpanded: React.Dispatch<React.SetStateAction<boolean>>;

  attachedFiles: { name: string; data: string; mimeType: string; path?: string }[];
  setAttachedFiles: React.Dispatch<
    React.SetStateAction<{ name: string; data: string; mimeType: string; path?: string }[]>
  >;

  pendingApprovalRequest: ActionApprovalRequest | null;
  setPendingApprovalRequest: React.Dispatch<React.SetStateAction<ActionApprovalRequest | null>>;

  activeVideoId: string | null;
  setActiveVideoId: React.Dispatch<React.SetStateAction<string | null>>;

  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;

  memoryInputRef: React.RefObject<HTMLInputElement | null>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inputMode, setInputMode] = useState("voice");
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

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isDiagramRendering, setIsDiagramRendering] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<"chat" | "terminal">("chat");
  const [isVisualHubExpanded, setIsVisualHubExpanded] = useState(false);

  const [attachedFiles, setAttachedFiles] = useState<
    { name: string; data: string; mimeType: string; path?: string }[]
  >([]);
  const [pendingApprovalRequest, setPendingApprovalRequest] =
    useState<ActionApprovalRequest | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const memoryInputRef = useRef<HTMLInputElement>(null);

  const value = {
    activeTab,
    setActiveTab,
    inputMode,
    setInputMode,
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
    setIsLoading,
    isInitialLoading,
    setIsInitialLoading,
    isVisualizing,
    setIsVisualizing,
    isDiagramRendering,
    setIsDiagramRendering,
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
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = use(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
