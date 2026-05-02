import { veniceChat } from './veniceChat';

export interface ScenarioSection {
  title: string;
  color: string;
  textColor: string;
  content: string;
}

export interface TrainingScenarioDraft {
  id: string;
  title: string;
  doctorName: string;
  specialty: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  trainingGoal: string;
  expectedChallenge: string;
  estimatedTime: string;
  currentObjective: string;
  focusArea: string;
  stakeholder: string;
  patientContext: string;
  keyDataPoint: string;
  talkingPoint: string;
  likelyObjection: string;
  complianceReminder: string;
  scriptTitle: string;
  scriptSections: ScenarioSection[];
  coachNudges: { title: string; body: string }[];
  reviewRubric: string[];
}

export interface ScenarioBuilderInput {
  audience: string;
  difficulty: string;
  goal: string;
  clinicalFocus: string;
  hcpPersona: string;
}

const sectionStyles = [
  ['bg-blue-50 border-l-4 border-blue-400', 'text-blue-900'],
  ['bg-emerald-50 border-l-4 border-emerald-400', 'text-emerald-900'],
  ['bg-amber-50 border-l-4 border-amber-400', 'text-amber-900'],
  ['bg-slate-50 border-l-4 border-slate-400', 'text-slate-900'],
] as const;

export const ATTR_CM_FALLBACK_SCENARIO: TrainingScenarioDraft = {
  id: 'generated-attrcm-workflow',
  title: 'ATTR-CM Diagnostic Workflow Challenge',
  doctorName: 'Dr. Rivera',
  specialty: 'Cardiologist',
  description: 'Community cardiologist with delayed ATTR-CM referrals and equivocal imaging workflows.',
  difficulty: 'Intermediate',
  trainingGoal: 'Explore diagnostic workflow gaps',
  expectedChallenge: 'The HCP is skeptical that another diagnostic discussion will change real-world access barriers.',
  estimatedTime: '18 min',
  currentObjective: 'Map how suspected ATTR-CM patients move from red flags to PYP scan, lab workup, and referral.',
  focusArea: 'Diagnostic process, treatment barriers, and sequencing',
  stakeholder: 'Cardiology',
  patientContext: '72-year-old male with HFpEF, increased LV wall thickness, carpal tunnel history, and rising NT-proBNP.',
  keyDataPoint: 'ATTR-CM is often underrecognized; earlier suspicion and structured diagnostic pathways can reduce delays.',
  talkingPoint: 'Ask where the workflow breaks down before offering evidence or resources.',
  likelyObjection: 'PYP scan access and inconclusive reads make the pathway difficult to operationalize.',
  complianceReminder: 'Stay non-promotional, avoid prescribing guidance, and do not discuss pricing or reimbursement.',
  scriptTitle: 'Coach Mode - ATTR-CM Diagnostic Workflow',
  scriptSections: [
    {
      title: 'Opening objective',
      color: sectionStyles[0][0],
      textColor: sectionStyles[0][1],
      content: 'Set a focused agenda and ask how suspected ATTR-CM patients are currently identified and routed.',
    },
    {
      title: 'Key data points',
      color: sectionStyles[1][0],
      textColor: sectionStyles[1][1],
      content: 'Anchor on red flags, diagnostic sequencing, and the value of earlier recognition without making product claims.',
    },
    {
      title: 'Likely HCP objection',
      color: sectionStyles[2][0],
      textColor: sectionStyles[2][1],
      content: 'The HCP may say access to scans and interpretation variability make the ideal pathway unrealistic.',
    },
    {
      title: 'Recommended response',
      color: sectionStyles[3][0],
      textColor: sectionStyles[3][1],
      content: 'Validate the barrier, ask which step creates the longest delay, and offer to share approved diagnostic pathway resources.',
    },
  ],
  coachNudges: [
    { title: 'Map the workflow', body: 'Ask where patients most often stall between suspicion, imaging, labs, and referral.' },
    { title: 'Stay evidence-led', body: 'Use approved diagnostic pathway data and avoid treatment-specific claims.' },
  ],
  reviewRubric: ['Discovery depth', 'Evidence use', 'Compliance posture', 'Barrier synthesis', 'Follow-up clarity'],
};

function normalizeSections(sections: Array<Partial<ScenarioSection>> | undefined): ScenarioSection[] {
  const base = sections?.length ? sections.slice(0, 4) : ATTR_CM_FALLBACK_SCENARIO.scriptSections;
  return base.map((section, index) => ({
    title: section.title || ATTR_CM_FALLBACK_SCENARIO.scriptSections[index]?.title || `Prompt ${index + 1}`,
    content: section.content || ATTR_CM_FALLBACK_SCENARIO.scriptSections[index]?.content || '',
    color: sectionStyles[index % sectionStyles.length][0],
    textColor: sectionStyles[index % sectionStyles.length][1],
  }));
}

export function normalizeScenarioDraft(raw: Partial<TrainingScenarioDraft>): TrainingScenarioDraft {
  return {
    ...ATTR_CM_FALLBACK_SCENARIO,
    ...raw,
    id: raw.id || `generated-${Date.now()}`,
    difficulty: (raw.difficulty as TrainingScenarioDraft['difficulty']) || ATTR_CM_FALLBACK_SCENARIO.difficulty,
    scriptSections: normalizeSections(raw.scriptSections),
    coachNudges: raw.coachNudges?.length ? raw.coachNudges.slice(0, 3) : ATTR_CM_FALLBACK_SCENARIO.coachNudges,
    reviewRubric: raw.reviewRubric?.length ? raw.reviewRubric.slice(0, 6) : ATTR_CM_FALLBACK_SCENARIO.reviewRubric,
  };
}

export async function generateAttrCmScenario(
  input: ScenarioBuilderInput,
  apiKey: string,
): Promise<TrainingScenarioDraft> {
  const system = `You are an expert field medical training designer. Build realistic MSL skill-development simulations for ATTR-CM. Keep content medically balanced and non-promotional. Return only valid JSON.`;
  const user = `Create an ATTR-CM MSL training scenario for a medical training team.

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
}`;

  const raw = await veniceChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    apiKey,
    undefined,
    { maxTokens: 1800, temperature: 0.35 },
  );

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract scenario JSON from Venice response');
  return normalizeScenarioDraft(JSON.parse(match[0]));
}

