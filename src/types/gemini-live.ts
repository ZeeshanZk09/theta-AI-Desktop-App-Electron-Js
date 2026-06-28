export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning' | 'tool';
  message: string;
  details?: any;
}

export interface UseGeminiLiveProps {
  onSpeakingChanged?: (isSpeaking: boolean) => void;
  onImageGenerated?: (imageUrl: string) => void;
  memories?: any[];
  onMemoriesUpdated?: (memories: any[]) => void;
  onContactsUpdated?: (contacts: any[]) => void;
  userProfile?: any;
  onDiagramGenerated?: (code: string) => void;
  onVisualizingChanged?: (isVisualizing: boolean) => void;
  vaultInfo?: any;
  initialHistory?: any[];
  historySettings?: { maxContextMessages?: number; storeHistory?: boolean };
  onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  onNotesUpdated?: (notes: any[]) => void;
  onTasksUpdated?: (tasks: any[]) => void;
  onYouTubePlay?: (videoId: string) => void;
  attachedFiles?: { name: string, data: string, mimeType: string }[];
}
