import { TrainingScenarioDraft } from './scenarioGenerator';

const HEYGEN_VIDEO_AGENT_URL = 'https://api.heygen.com/v3/video-agents';

export type HeyGenAgentStatus =
  | 'thinking'
  | 'waiting_for_input'
  | 'reviewing'
  | 'generating'
  | 'completed'
  | 'failed';

export interface HeyGenAgentMessage {
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'resource' | 'error';
  created_at: number | null;
  resource_ids: string[] | null;
}

export interface HeyGenAgentSession {
  session_id: string;
  status: HeyGenAgentStatus;
  progress?: number;
  title?: string | null;
  video_id?: string | null;
  created_at?: number;
  messages?: HeyGenAgentMessage[];
}

export interface HeyGenAgentResource {
  resource_id: string;
  resource_type: string;
  source_type?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  created_at?: number | null;
  metadata?: Record<string, unknown> | null;
}

function headers(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey,
  };
}

function scenarioPrompt(scenario: TrainingScenarioDraft) {
  return `Create an internal medical affairs training video storyboard for an ATTR-CM MSL skill-development scenario.

Audience: medical training team and field medical learners.
Scenario title: ${scenario.title}
HCP persona: ${scenario.doctorName}, ${scenario.specialty}. ${scenario.description}
Training goal: ${scenario.trainingGoal}
Expected challenge: ${scenario.expectedChallenge}
Patient context: ${scenario.patientContext}
Key data point: ${scenario.keyDataPoint}
Compliance reminder: ${scenario.complianceReminder}

Create a concise 3-5 scene storyboard that can be reviewed before generation. The video should teach how to run the scenario, what good MSL behavior looks like, and what compliance guardrails to remember.`;
}

async function parseData<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HeyGen Video Agent ${res.status}: ${detail}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function createHeyGenTrainingVideoSession(
  scenario: TrainingScenarioDraft,
  apiKey: string,
): Promise<HeyGenAgentSession> {
  const res = await fetch(HEYGEN_VIDEO_AGENT_URL, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      prompt: scenarioPrompt(scenario),
      mode: 'chat',
      orientation: 'landscape',
      auto_proceed: false,
    }),
  });
  return parseData<HeyGenAgentSession>(res);
}

export async function getHeyGenTrainingVideoSession(
  sessionId: string,
  apiKey: string,
): Promise<HeyGenAgentSession> {
  const res = await fetch(`${HEYGEN_VIDEO_AGENT_URL}/${sessionId}`, {
    headers: headers(apiKey),
  });
  return parseData<HeyGenAgentSession>(res);
}

export async function sendHeyGenTrainingVideoMessage(
  sessionId: string,
  message: string,
  apiKey: string,
  autoProceed = false,
): Promise<{ session_id: string; run_id?: string; title?: string }> {
  const res = await fetch(`${HEYGEN_VIDEO_AGENT_URL}/${sessionId}`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ message, auto_proceed: autoProceed }),
  });
  return parseData<{ session_id: string; run_id?: string; title?: string }>(res);
}

export async function getHeyGenTrainingVideoResource(
  sessionId: string,
  resourceId: string,
  apiKey: string,
): Promise<HeyGenAgentResource> {
  const res = await fetch(`${HEYGEN_VIDEO_AGENT_URL}/${sessionId}/resources/${resourceId}`, {
    headers: headers(apiKey),
  });
  return parseData<HeyGenAgentResource>(res);
}

