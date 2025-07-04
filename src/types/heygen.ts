// HeyGen SDK Global Declaration
declare global {
  interface Window {
    HeyGenStreamingAvatar: any;
  }
}

// HeyGen API Configuration
export interface HeyGenConfig {
  apiKey: string;
  serverUrl?: string;
  avatarId?: string;
  quality?: 'low' | 'medium' | 'high';
  version?: 'v1' | 'v2';
  videoEncoding?: 'H264' | 'VP8' | 'VP9';
}

// Session Management
export interface StreamingSession {
  sessionId: string;
  sessionToken: string;
  wsUrl: string;
  liveKitToken: string;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
}

// API Response Types
export interface CreateTokenResponse {
  code: number;
  data: {
    session_token: string;
  };
  message: string;
}

export interface NewSessionResponse {
  code: number;
  data: {
    session_id: string;
    session_token: string;
    avatar_url: string;
    quality: string;
    version: string;
  };
  message: string;
}

export interface StartSessionResponse {
  code: number;
  data: {
    access_token: string;
    ws_url: string;
    session_id: string;
    ice_servers: Array<{
      urls: string[];
      username?: string;
      credential?: string;
    }>;
  };
  message: string;
}

export interface TaskResponse {
  code: number;
  data: {
    task_id: string;
    status: string;
  };
  message: string;
}

// Task Types
export interface StreamingTask {
  sessionId: string;
  text: string;
  taskType: 'talk' | 'repeat' | 'silence';
  taskId?: string;
}

// Avatar Configuration
export interface AvatarConfig {
  avatarId: string;
  name: string;
  description: string;
  specialty: string;
  avatar_url?: string;
}

// Training Session Types
export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  objectives: string[];
  avatarResponses: string[];
}

export interface SessionMetrics {
  startTime: Date;
  endTime?: Date;
  duration: number;
  messagesExchanged: number;
  userEngagement: number;
  completionRate: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'session_update' | 'task_update' | 'avatar_speaking' | 'error';
  data: any;
  timestamp: string;
}

// Connection States
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Training States
export type TrainingState = 'setup' | 'active' | 'paused' | 'completed' | 'error';

// Ensure the type is properly exported and available
export const TRAINING_STATES = {
  SETUP: 'setup' as const,
  ACTIVE: 'active' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
  ERROR: 'error' as const
} as const; 