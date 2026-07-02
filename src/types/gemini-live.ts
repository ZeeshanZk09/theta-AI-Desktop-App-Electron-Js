import type { Memory, Contact, UserProfile, VaultInfo, HistoryMessage, DashboardData, Note, Task } from './index';

export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning' | 'tool';
  message: string;
  details?: Record<string, unknown>;
}

export interface UseGeminiLiveProps {
  onSpeakingChanged?: (isSpeaking: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
  memories?: Memory[];
  onMemoriesUpdated?: (memories: Memory[]) => void;
  onContactsUpdated?: (contacts: Contact[]) => void;
  userProfile?: UserProfile;
  onDiagramGenerated?: (code: string) => void;
  onVisualizingChanged?: (isVisualizing: boolean) => void;
  vaultInfo?: VaultInfo;
  initialHistory?: HistoryMessage[];
  historySettings?: { maxContextMessages?: number; storeHistory?: boolean };
  onDashboardUpdated?: (data: DashboardData) => void;
  onNotesUpdated?: (notes: Note[]) => void;
  onTasksUpdated?: (tasks: Task[]) => void;
  onYouTubePlay?: (videoId: string) => void;
  attachedFiles?: { name: string, data: string, mimeType: string }[];
}
