const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';
const NETLIFY_FUNCTION_URL = '/.netlify/functions/liveavatar-session';

export interface LiveAvatarConfig {
  scenarioKey?: string;
  avatarId?: string;
  contextId?: string;
  voiceId?: string;
  llmConfigurationId?: string;
  language?: string;
  quality?: 'low' | 'medium' | 'high' | 'very_high';
  encoding?: 'VP8' | 'H264';
  isSandbox?: boolean;
  maxSessionDuration?: number;
  interactivityType?: 'CONVERSATIONAL' | 'PUSH_TO_TALK';
  dynamicVariables?: Record<string, string>;
}

export interface LiveAvatarSession {
  sessionId: string;
  sessionToken: string;
  livekitUrl: string;
  livekitClientToken: string;
  livekitAgentToken?: string | null;
  maxSessionDuration?: number;
  wsUrl?: string | null;
}

interface LiveAvatarApiResponse<T> {
  code?: number;
  data?: T;
  message?: string;
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  );
}

function buildSessionTokenPayload(config: LiveAvatarConfig) {
  if (!config.avatarId) {
    throw new Error(
      'Missing LiveAvatar avatar ID. Add LIVEAVATAR_AVATAR_ID in Netlify, or REACT_APP_LIVEAVATAR_AVATAR_ID locally.',
    );
  }

  return compact({
    mode: 'FULL',
    avatar_id: config.avatarId,
    is_sandbox: config.isSandbox ?? false,
    interactivity_type: config.interactivityType || 'CONVERSATIONAL',
    llm_configuration_id: config.llmConfigurationId,
    max_session_duration: config.maxSessionDuration,
    dynamic_variables: config.dynamicVariables,
    avatar_persona: compact({
      voice_id: config.voiceId,
      context_id: config.contextId,
      language: config.language || 'en',
    }),
    video_settings: {
      encoding: config.encoding || 'VP8',
      quality: config.quality || 'high',
    },
  });
}

function normalizeSession(tokenData: any, startData: any): LiveAvatarSession {
  return {
    sessionId: startData.session_id || tokenData.session_id,
    sessionToken: tokenData.session_token,
    livekitUrl: startData.livekit_url,
    livekitClientToken: startData.livekit_client_token,
    livekitAgentToken: startData.livekit_agent_token,
    maxSessionDuration: startData.max_session_duration,
    wsUrl: startData.ws_url,
  };
}

async function parseLiveAvatarResponse<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${label} ${res.status}: ${detail}`);
  }

  const json = (await res.json()) as LiveAvatarApiResponse<T>;
  if (!json.data) throw new Error(`${label}: empty response`);
  return json.data;
}

async function createDirectSession(config: LiveAvatarConfig, apiKey: string): Promise<LiveAvatarSession> {
  const tokenData = await parseLiveAvatarResponse<{ session_id: string; session_token: string }>(
    await fetch(`${LIVEAVATAR_API_URL}/sessions/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(buildSessionTokenPayload(config)),
    }),
    'LiveAvatar token',
  );

  const startData = await parseLiveAvatarResponse<{
    session_id: string;
    livekit_url: string;
    livekit_client_token: string;
    livekit_agent_token?: string | null;
    max_session_duration?: number;
    ws_url?: string | null;
  }>(
    await fetch(`${LIVEAVATAR_API_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.session_token}`,
      },
    }),
    'LiveAvatar start',
  );

  return normalizeSession(tokenData, startData);
}

export async function createLiveAvatarSession(
  config: LiveAvatarConfig,
  apiKey = '',
): Promise<LiveAvatarSession> {
  try {
    const res = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', config }),
    });

    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      return (await res.json()) as LiveAvatarSession;
    }
    if (!apiKey && res.status !== 404) {
      const detail = await res.text().catch(() => '');
      throw new Error(`LiveAvatar function ${res.status}: ${detail}`);
    }
  } catch (error) {
    if (!apiKey) throw error;
  }

  if (!apiKey) {
    throw new Error('LiveAvatar is not configured. Add LIVEAVATAR_API_KEY in Netlify or save a local LiveAvatar key.');
  }

  return createDirectSession(config, apiKey);
}

export async function stopLiveAvatarSession(
  sessionId: string,
  apiKey = '',
  reason = 'USER_CLOSED',
): Promise<void> {
  if (!sessionId) return;

  try {
    const res = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', sessionId, reason }),
    });
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) return;
  } catch {
    // Fall through to direct API path for local development.
  }

  if (!apiKey) return;

  await fetch(`${LIVEAVATAR_API_URL}/sessions/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ session_id: sessionId, reason }),
  }).catch(() => {});
}
