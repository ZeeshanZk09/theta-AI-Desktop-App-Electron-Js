
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  thought?: string;
  timestamp: number;
  isStreaming?: boolean;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
}
