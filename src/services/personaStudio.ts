import { veniceChat } from './veniceChat';

const PERSONA_FUNCTION_URL = '/.netlify/functions/persona-studio';

export interface PersonaBuilderInput {
  name: string;
  specialty: string;
  trainingGoal: string;
  learnerAudience: string;
  difficulty: string;
  personaNotes: string;
  knowledgeLinks: string;
  sourceNotes: string;
  complianceNotes: string;
  openingStyle: string;
}

export interface PersonaContextLink {
  url: string;
  faq: string;
}

export interface PersonaDraft {
  name: string;
  doctorName: string;
  specialty: string;
  scenarioTitle: string;
  trainingGoal: string;
  openingText: string;
  prompt: string;
  knowledgeSummary: string;
  links: PersonaContextLink[];
  scenario: {
    description: string;
    expectedChallenge: string;
    currentObjective: string;
    patientContext: string;
    keyDataPoint: string;
    talkingPoint: string;
    likelyObjection: string;
    complianceReminder: string;
  };
}

export interface LiveAvatarAsset {
  id: string;
  name: string;
  previewUrl?: string;
  description?: string;
}

export interface CreatedContext {
  id: string;
  name: string;
  prompt?: string;
  openingText?: string;
}

function parseLinks(raw: string, fallbackFaq: string): PersonaContextLink[] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [url, ...faqParts] = line.split('|').map(part => part.trim());
      return { url, faq: faqParts.join(' | ') || fallbackFaq };
    })
    .filter(link => /^https?:\/\//i.test(link.url))
    .slice(0, 8);
}

export function normalizePersonaDraft(raw: Partial<PersonaDraft>, input: PersonaBuilderInput): PersonaDraft {
  const fallbackPrompt = `You are ${input.name || 'an HCP'} (${input.specialty || 'Cardiology'}) in an ATTR-CM MSL training simulation.

Behavior:
- Challenge the MSL realistically based on your clinical workflow.
- Stay in role as the HCP. Do not coach the learner directly during the conversation.
- Use only the provided disease education, publication notes, and compliant context.
- Push for clarity on diagnostic workflow, red flags, PYP scan interpretation, referrals, enrollment barriers, and follow-up.
- Avoid pricing, reimbursement, prescribing advice, or promotional product claims.

Source notes:
${input.sourceNotes || 'No source excerpts provided.'}

Compliance:
${input.complianceNotes || 'Keep the interaction non-promotional and evidence-based.'}`;

  return {
    name: raw.name || `${input.name || 'ATTR-CM HCP'} Context`,
    doctorName: raw.doctorName || input.name || 'Dr. Rivera',
    specialty: raw.specialty || input.specialty || 'Cardiologist',
    scenarioTitle: raw.scenarioTitle || `${input.trainingGoal || 'ATTR-CM'} Simulation`,
    trainingGoal: raw.trainingGoal || input.trainingGoal || 'Practice ATTR-CM scientific exchange',
    openingText: raw.openingText || `Thanks for connecting. I have a few minutes, and I am interested in how this relates to my ATTR-CM workflow.`,
    prompt: raw.prompt || fallbackPrompt,
    knowledgeSummary: raw.knowledgeSummary || input.sourceNotes || 'No knowledge summary generated yet.',
    links: raw.links?.length ? raw.links : parseLinks(input.knowledgeLinks, input.trainingGoal),
    scenario: {
      description: raw.scenario?.description || input.personaNotes || 'HCP with realistic ATTR-CM workflow barriers.',
      expectedChallenge: raw.scenario?.expectedChallenge || 'The HCP challenges relevance, workflow feasibility, or evidence strength.',
      currentObjective: raw.scenario?.currentObjective || input.trainingGoal,
      patientContext: raw.scenario?.patientContext || 'Older patient with HFpEF, increased LV wall thickness, and ATTR-CM red flags.',
      keyDataPoint: raw.scenario?.keyDataPoint || 'Earlier suspicion and structured diagnostic workflows can reduce ATTR-CM delays.',
      talkingPoint: raw.scenario?.talkingPoint || 'Ask a workflow question before sharing approved evidence.',
      likelyObjection: raw.scenario?.likelyObjection || 'Scan access, equivocal reads, or referral friction limits adoption.',
      complianceReminder: raw.scenario?.complianceReminder || input.complianceNotes || 'Stay non-promotional and evidence-based.',
    },
  };
}

async function callPersonaFunction<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(PERSONA_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Persona Studio ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export async function optimizePersonaPrompt(input: PersonaBuilderInput, apiKey = ''): Promise<PersonaDraft> {
  try {
    const data = await callPersonaFunction<{ draft: PersonaDraft }>({ action: 'optimizePersona', input });
    return normalizePersonaDraft(data.draft, input);
  } catch (error) {
    if (!apiKey) return normalizePersonaDraft({}, input);
  }

  const system = 'You create compliant MSL training personas and LiveAvatar context prompts. Return only valid JSON.';
  const user = `Create a LiveAvatar Context for an ATTR-CM MSL training persona.

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

Return JSON with:
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
}`;

  const raw = await veniceChat(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    apiKey,
    undefined,
    { maxTokens: 2400, temperature: 0.25 },
  );
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract persona JSON from Venice response');
  return normalizePersonaDraft(JSON.parse(match[0]), input);
}

export async function createLiveAvatarContextFromDraft(draft: PersonaDraft): Promise<CreatedContext> {
  return callPersonaFunction<CreatedContext>({ action: 'createContext', draft });
}

export async function listLiveAvatarAssets(type: 'avatars' | 'contexts' | 'voices'): Promise<LiveAvatarAsset[]> {
  const data = await callPersonaFunction<{ items: LiveAvatarAsset[] }>({ action: `list-${type}` });
  return data.items;
}
