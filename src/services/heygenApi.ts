import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents, 
  TaskType,
  VoiceEmotion,
  STTProvider 
} from '@heygen/streaming-avatar';
import {
  HeyGenConfig,
  StreamingSession,
  ConnectionState
} from '../types/heygen';

export class HeyGenApiService {
  private config: HeyGenConfig;
  private streamingAvatar: StreamingAvatar | null = null;
  private session: StreamingSession | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private eventListeners: Map<string, Function[]> = new Map();
  private isVoiceChatActive: boolean = false;
  private mediaElement: HTMLVideoElement | null = null;

  constructor(config: HeyGenConfig) {
    this.config = {
      quality: 'high',
      version: 'v2',
      videoEncoding: 'H264',
      serverUrl: 'https://api.heygen.com',
      ...config
    };
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  async createSessionToken(): Promise<string> {
    try {
      const response = await fetch(`${this.config.serverUrl}/v1/streaming.create_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create session token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error('Error creating session token:', error);
      throw error;
    }
  }

  async initializeSession(): Promise<StreamingSession> {
    try {
      this.connectionState = 'connecting';
      this.emit('connectionStateChange', 'connecting');

      // Create session token
      const sessionToken = await this.createSessionToken();

      // Initialize StreamingAvatar with session token
      this.streamingAvatar = new StreamingAvatar({ token: sessionToken });

      // Set up event listeners for avatar events
      this.setupAvatarEventListeners();

      // Create and start avatar session
      const sessionInfo = await this.streamingAvatar.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: this.config.avatarId || 'Wayne_20240711',
        voice: {
          voiceId: 'en-US-AriaNeural',
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        },
        sttSettings: {
          provider: STTProvider.DEEPGRAM,
          confidence: 0.6
        },
        language: 'en',
        activityIdleTimeout: 300 // 5 minutes
      });

      this.session = {
        sessionId: sessionInfo.session_id,
        sessionToken: sessionToken,
        wsUrl: sessionInfo.url,
        liveKitToken: sessionInfo.access_token,
        status: 'connected'
      };

      this.connectionState = 'connected';
      this.emit('connectionStateChange', 'connected');
      this.emit('sessionInitialized', this.session);

      return this.session;
    } catch (error) {
      this.connectionState = 'error';
      this.emit('connectionStateChange', 'error');
      this.emit('error', error);
      throw error;
    }
  }

  private setupAvatarEventListeners() {
    if (!this.streamingAvatar) return;

    // Avatar speaking events
    this.streamingAvatar.on(StreamingEvents.AVATAR_START_TALKING, (event: any) => {
      this.emit('avatarStartTalking', event);
    });

    this.streamingAvatar.on(StreamingEvents.AVATAR_STOP_TALKING, (event: any) => {
      this.emit('avatarStopTalking', event);
    });

    // User speaking events
    this.streamingAvatar.on(StreamingEvents.USER_START, (event: any) => {
      this.emit('userStartTalking', event);
    });

    this.streamingAvatar.on(StreamingEvents.USER_STOP, (event: any) => {
      this.emit('userStopTalking', event);
    });

    // Stream events
    this.streamingAvatar.on(StreamingEvents.STREAM_READY, (event: any) => {
      if (this.mediaElement && event.detail) {
        this.mediaElement.srcObject = event.detail;
      }
      this.emit('streamReady', event);
    });

    this.streamingAvatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      this.connectionState = 'disconnected';
      this.emit('connectionStateChange', 'disconnected');
      this.emit('streamDisconnected', null);
    });

    // Message events
    this.streamingAvatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (message: any) => {
      this.emit('avatarMessage', message);
    });

    this.streamingAvatar.on(StreamingEvents.USER_TALKING_MESSAGE, (message: any) => {
      this.emit('userMessage', message);
    });
  }

  async sendMessage(text: string, taskType: 'talk' | 'repeat' = 'talk'): Promise<void> {
    if (!this.streamingAvatar) {
      throw new Error('No active streaming avatar session');
    }

    try {
      await this.streamingAvatar.speak({
        text,
        task_type: taskType === 'talk' ? TaskType.TALK : TaskType.REPEAT
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async startVoiceChat(): Promise<void> {
    if (!this.streamingAvatar || this.isVoiceChatActive) {
      return;
    }

    try {
      await this.streamingAvatar.startVoiceChat({
        isInputAudioMuted: false
      });
      this.isVoiceChatActive = true;
      this.emit('voiceChatStarted', true);
    } catch (error) {
      console.error('Error starting voice chat:', error);
      throw error;
    }
  }

  async stopVoiceChat(): Promise<void> {
    if (!this.streamingAvatar || !this.isVoiceChatActive) {
      return;
    }

    try {
      await this.streamingAvatar.closeVoiceChat();
      this.isVoiceChatActive = false;
      this.emit('voiceChatStopped', false);
    } catch (error) {
      console.error('Error stopping voice chat:', error);
      throw error;
    }
  }

  async muteInputAudio(): Promise<void> {
    if (this.streamingAvatar) {
      await this.streamingAvatar.muteInputAudio();
      this.emit('inputAudioMuted', true);
    }
  }

  async unmuteInputAudio(): Promise<void> {
    if (this.streamingAvatar) {
      await this.streamingAvatar.unmuteInputAudio();
      this.emit('inputAudioUnmuted', false);
    }
  }

  async interruptAvatar(): Promise<void> {
    if (this.streamingAvatar) {
      await this.streamingAvatar.interrupt();
      this.emit('avatarInterrupted', true);
    }
  }

  setMediaElement(element: HTMLVideoElement) {
    this.mediaElement = element;
  }

  getSession(): StreamingSession | null {
    return this.session;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.session !== null;
  }

  isVoiceChatEnabled(): boolean {
    return this.isVoiceChatActive;
  }

  async keepAlive(): Promise<void> {
    if (this.streamingAvatar) {
      await this.streamingAvatar.keepAlive();
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.isVoiceChatActive) {
        await this.stopVoiceChat();
      }
      
      if (this.streamingAvatar) {
        await this.streamingAvatar.stopAvatar();
        this.streamingAvatar = null;
      }
      
      if (this.mediaElement) {
        this.mediaElement.srcObject = null;
        this.mediaElement = null;
      }
      
      this.session = null;
      this.connectionState = 'disconnected';
      this.eventListeners.clear();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const createDemoConfig = (apiKey: string = ''): HeyGenConfig => ({
  apiKey,
  serverUrl: 'https://api.heygen.com',
  quality: 'high',
  version: 'v2',
  videoEncoding: 'H264'
});

// HCP Avatar presets for different medical specialties
export const HCP_AVATARS = {
  cardiologist: {
    avatarId: 'Wayne_20240711',
    name: 'Dr. Alex',
    description: 'Experienced cardiologist specializing in cardiovascular medicine',
    specialty: 'Cardiology',
    voiceId: 'en-US-AriaNeural'
  },
  oncologist: {
    avatarId: 'Anna_public_3_20240108',
    name: 'Dr. Michael Rodriguez', 
    description: 'Board-certified oncologist with expertise in cancer treatment',
    specialty: 'Oncology',
    voiceId: 'en-US-DavisNeural'
  },
  neurologist: {
    avatarId: 'Susan_public_2_20240328',
    name: 'Dr. Emily Johnson',
    description: 'Neurologist specializing in brain and nervous system disorders',
    specialty: 'Neurology',
    voiceId: 'en-US-JennyNeural'
  },
  general: {
    avatarId: 'Josh_lite_20230714',
    name: 'Dr. David Wilson',
    description: 'General practitioner with broad medical knowledge',
    specialty: 'General Medicine',
    voiceId: 'en-US-GuyNeural'
  }
}; 