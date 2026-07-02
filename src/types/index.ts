export interface UserProfile {
  name?: string;
  location?: string;
  profession?: string;
  bio?: string;
  [key: string]: unknown;
}

export interface DashboardSettings {
  interests: string[];
  [key: string]: unknown;
}

export interface FolderConfig {
  name: string;
  path: string;
  id: string;
}

export interface VaultInfo {
  path: string;
  folders: FolderConfig[];
}

export interface Memory {
  id: string;
  content: string;
  category?: string;
  timestamp: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  updatedAt?: number;
  createdAt?: number;
}

export interface Task {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'completed';
  completed: boolean;
  category: string;
  description?: string;
  dueAt?: string | null;
  reminder?: boolean;
  tags?: string[];
  createdAt?: number;
  timestamp: number;
}

export interface HistoryMessage {
  role: 'user' | 'model' | 'assistant';
  text: string;
  timestamp: number;
}

export interface DashboardData {
  headlines?: string[];
  weather?: {
    today?: string;
    tomorrow?: string;
    dayAfter?: string;
  };
  [key: string]: unknown;
}
