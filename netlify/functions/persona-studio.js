const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';
const VENICE_CHAT_URL = 'https://api.venice.ai/api/v1/chat/completions';

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

function normalizeList(data) {
  const rows = Array.isArray(data) ? data : data?.items || data?.results || data?.data || [];
  return rows.map(item => ({
    id: item.id,
    name: item.name || item.display_name || item.id,
    previewUrl: item.preview_url || item.thumbnail_url,
    description: item.description || item.language || item.status || '',
  })).filter(item => item.id);
}

async function parseApiResponse(res, label) {
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
  return json.data ?? json;
}

async function veniceCompletion(messages, options = {}) {
  const apiKey = process.env.VENICE_API_KEY || process.env.REACT_APP_VENICE_API_KEY;
  if (!apiKey) throw new Error('VENICE_API_KEY is not configured in Netlify.');

  const data = await parseApiResponse(
    await fetch(VENICE_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || process.env.VENICE_MODEL || 'google-gemma-4-31b-it',
        messages,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.25,
      }),
    }),
    'Venice chat',
  );

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty Venice response');
  return content;
}

async function veniceJson(messages, maxTokens = 2400) {
  const content = await veniceCompletion(messages, { maxTokens, temperature: 0.25 });
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract JSON from Venice response');
  return JSON.parse(match[0]);
}

async function optimizePersona(input) {
  return veniceJson([
    {
      role: 'system',
      content:
        'You create compliant MSL training personas and LiveAvatar context prompts for ATTR-CM. Return only valid JSON.',
    },
    {
      role: 'user',
      content: `Create a LiveAvatar Context for an ATTR-CM MSL training persona.

Persona inputs:
- Context name: ${input.name}
- Specialty: ${input.specialty}
- Learner audience: ${input.learnerAudience}
- Difficulty: ${input.difficulty}
- Training goal: ${input.trainingGoal}
- HCP/persona notes: ${input.personaNotes}
- Publication/source links, one per line: ${input.knowledgeLinks}
- Publication/deck/source excerpts: ${input.sourceNotes}
- Compliance notes: ${input.complianceNotes}
- Opening style: ${input.openingStyle}

Return JSON:
{
  "name": "LiveAvatar context name",
  "doctorName": "Dr. Name",
  "specialty": "specialty",
  "scenarioTitle": "scenario title",
  "trainingGoal": "short learner goal",
  "openingText": "first thing the HCP says",
  "prompt": "complete in-role HCP system prompt with source-grounded behavior and compliance rules",
  "knowledgeSummary": "brief source synthesis",
  "links": [{"url": "https://...", "faq": "what this source supports"}],
  "scenario": {
    "description": "...",
    "expectedChallenge": "...",
    "currentObjective": "...",
    "patientContext": "...",
    "keyDataPoint": "...",
    "talkingPoint": "...",
    "likelyObjection": "...",
    "complianceReminder": "..."
  }
}`,
    },
  ]);
}

async function generateScenario(input) {
  return veniceJson([
    {
      role: 'system',
      content:
        'You are an expert field medical training designer. Build realistic MSL skill-development simulations for ATTR-CM. Keep content medically balanced and non-promotional. Return only valid JSON.',
    },
    {
      role: 'user',
      content: `Create an ATTR-CM MSL training scenario for a medical training team.

Inputs:
- Audience: ${input.audience}
- Difficulty: ${input.difficulty}
- Goal: ${input.goal}
- Clinical focus: ${input.clinicalFocus}
- HCP persona: ${input.hcpPersona}

Return exactly this JSON shape:
{
  "title": "short scenario title",
  "doctorName": "Dr. Lastname",
  "specialty": "Cardiologist, neurologist, hematologist, or clinical research role",
  "description": "one sentence HCP profile",
  "difficulty": "Beginner | Intermediate | Advanced",
  "trainingGoal": "short action label",
  "expectedChallenge": "specific challenge the learner must handle",
  "estimatedTime": "12-20 min",
  "currentObjective": "learner objective for this session",
  "focusArea": "diagnosis, red flags, scan interpretation, referral, access, or trial enrollment",
  "stakeholder": "clinical stakeholder label",
  "patientContext": "one realistic ATTR-CM patient context",
  "keyDataPoint": "approved, non-promotional data or disease education point",
  "talkingPoint": "recommended in-call talking point",
  "likelyObjection": "likely HCP objection",
  "complianceReminder": "short compliance guardrail",
  "scriptTitle": "Coach Mode - ...",
  "scriptSections": [
    {"title": "Opening objective", "content": "..."},
    {"title": "Key data points", "content": "..."},
    {"title": "Likely HCP objection", "content": "..."},
    {"title": "Recommended response", "content": "..."}
  ],
  "coachNudges": [
    {"title": "short nudge", "body": "specific action"},
    {"title": "short nudge", "body": "specific action"}
  ],
  "reviewRubric": ["dimension 1", "dimension 2", "dimension 3", "dimension 4"]
}`,
    },
  ], 1800);
}

async function createContext(draft) {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) throw new Error('LIVEAVATAR_API_KEY is not configured in Netlify.');

  const payload = {
    name: draft.name,
    prompt: draft.prompt,
    opening_text: draft.openingText,
    links: (draft.links || []).filter(link => link.url && link.faq),
  };

  const data = await parseApiResponse(
    await fetch(`${LIVEAVATAR_API_URL}/contexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(payload),
    }),
    'LiveAvatar context',
  );

  return {
    id: data.id,
    name: data.name || draft.name,
    prompt: payload.prompt,
    openingText: payload.opening_text,
  };
}

async function listLiveAvatar(path) {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) throw new Error('LIVEAVATAR_API_KEY is not configured in Netlify.');
  const data = await parseApiResponse(
    await fetch(`${LIVEAVATAR_API_URL}${path}`, {
      headers: { 'X-API-KEY': apiKey },
    }),
    `LiveAvatar ${path}`,
  );
  return normalizeList(data);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');

    if (body.action === 'optimizePersona') {
      return response(200, { draft: await optimizePersona(body.input || {}) });
    }
    if (body.action === 'generateScenario') {
      return response(200, { scenario: await generateScenario(body.input || {}) });
    }
    if (body.action === 'veniceChat') {
      const content = await veniceCompletion(body.messages || [], body.options || {});
      return response(200, { content });
    }
    if (body.action === 'createContext') {
      return response(200, await createContext(body.draft || {}));
    }
    if (body.action === 'list-avatars') {
      return response(200, { items: await listLiveAvatar('/avatars?page_size=50') });
    }
    if (body.action === 'list-contexts') {
      return response(200, { items: await listLiveAvatar('/contexts?page_size=50') });
    }
    if (body.action === 'list-voices') {
      return response(200, { items: await listLiveAvatar('/voices?page_size=50') });
    }

    return response(400, { error: 'Unknown Persona Studio action.' });
  } catch (error) {
    return response(500, { error: error.message || 'Persona Studio failed' });
  }
};
