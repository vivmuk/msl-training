const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function compact(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''),
  );
}

function scenarioEnvName(scenarioKey, suffix) {
  const key = String(scenarioKey || '').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return key ? `LIVEAVATAR_${key}_${suffix}` : '';
}

function resolveConfig(config = {}) {
  const scenarioKey = config.scenarioKey || '';
  return {
    avatarId:
      config.avatarId ||
      process.env[scenarioEnvName(scenarioKey, 'AVATAR_ID')] ||
      process.env.LIVEAVATAR_AVATAR_ID ||
      '',
    contextId:
      config.contextId ||
      process.env[scenarioEnvName(scenarioKey, 'CONTEXT_ID')] ||
      process.env.LIVEAVATAR_CONTEXT_ID ||
      '',
    voiceId:
      config.voiceId ||
      process.env[scenarioEnvName(scenarioKey, 'VOICE_ID')] ||
      process.env.LIVEAVATAR_VOICE_ID ||
      '',
    llmConfigurationId:
      config.llmConfigurationId ||
      process.env[scenarioEnvName(scenarioKey, 'LLM_CONFIGURATION_ID')] ||
      process.env.LIVEAVATAR_LLM_CONFIGURATION_ID ||
      '',
    language: config.language || process.env.LIVEAVATAR_LANGUAGE || 'en',
    quality: config.quality || process.env.LIVEAVATAR_VIDEO_QUALITY || 'high',
    encoding: config.encoding || process.env.LIVEAVATAR_VIDEO_ENCODING || 'VP8',
    isSandbox: config.isSandbox ?? process.env.LIVEAVATAR_SANDBOX === 'true',
    maxSessionDuration:
      config.maxSessionDuration ||
      Number(process.env[scenarioEnvName(scenarioKey, 'MAX_SESSION_DURATION')] || process.env.LIVEAVATAR_MAX_SESSION_DURATION) ||
      undefined,
    interactivityType: config.interactivityType || process.env.LIVEAVATAR_INTERACTIVITY_TYPE || 'CONVERSATIONAL',
    dynamicVariables: config.dynamicVariables,
  };
}

function buildTokenPayload(config) {
  if (!config.avatarId) {
    throw new Error('Missing LiveAvatar avatar ID. Set LIVEAVATAR_AVATAR_ID or a scenario-specific LIVEAVATAR_<SCENARIO>_AVATAR_ID in Netlify.');
  }

  return compact({
    mode: 'FULL',
    avatar_id: config.avatarId,
    is_sandbox: config.isSandbox,
    interactivity_type: config.interactivityType,
    llm_configuration_id: config.llmConfigurationId,
    max_session_duration: config.maxSessionDuration,
    dynamic_variables: config.dynamicVariables,
    avatar_persona: compact({
      voice_id: config.voiceId,
      context_id: config.contextId,
      language: config.language,
    }),
    video_settings: {
      encoding: config.encoding,
      quality: config.quality,
    },
  });
}

async function parseLiveAvatarResponse(res, label) {
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    throw new Error(`${label} ${res.status}: ${json.message || text}`);
  }

  if (!json.data) {
    throw new Error(`${label}: empty response`);
  }

  return json.data;
}

async function startSession(apiKey, config) {
  const tokenData = await parseLiveAvatarResponse(
    await fetch(`${LIVEAVATAR_API_URL}/sessions/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(buildTokenPayload(config)),
    }),
    'LiveAvatar token',
  );

  const startData = await parseLiveAvatarResponse(
    await fetch(`${LIVEAVATAR_API_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.session_token}`,
      },
    }),
    'LiveAvatar start',
  );

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

async function stopSession(apiKey, sessionId, reason = 'USER_CLOSED') {
  if (!sessionId) return;
  await fetch(`${LIVEAVATAR_API_URL}/sessions/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ session_id: sessionId, reason }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });

  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) return response(500, { error: 'LIVEAVATAR_API_KEY is not configured in Netlify.' });

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.action === 'stop') {
      await stopSession(apiKey, body.sessionId, body.reason);
      return response(200, { ok: true });
    }

    const session = await startSession(apiKey, resolveConfig(body.config));
    return response(200, session);
  } catch (error) {
    return response(500, { error: error.message || 'LiveAvatar session failed' });
  }
};
