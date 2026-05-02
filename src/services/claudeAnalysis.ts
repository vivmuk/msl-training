import { veniceChat } from './veniceChat';

export interface AnalysisEntry {
  speaker: 'msl' | 'hcp';
  text: string;
  timestamp: number;
}

export interface SkillScore {
  name: string;
  score: number;
  feedback: string;
}

export interface SessionAnalysis {
  overallScore: number;
  summary: string;
  skills: SkillScore[];
  strengths: { title: string; description: string }[];
  improvements: { title: string; description: string }[];
  nextSteps: string[];
}

export const MSL_SKILLS = [
  'Scientific Communication',
  'Active Listening',
  'Probing & Discovery',
  'Insight Generation',
  'Objection Handling',
  'Evidence Use',
  'Compliance Posture',
  'Empathy & EQ',
  'Strategic Questioning',
  'Closure & Follow-Up',
] as const;

export async function analyzeSession(
  entries: AnalysisEntry[],
  scenario: { doctorName: string; specialty: string; focusArea: string },
  apiKey: string,
): Promise<SessionAnalysis> {
  // Format transcript with both speakers so the model has full context
  const lines = entries
    .filter(e => e.text.trim())
    .map(e => {
      const label = e.speaker === 'msl' ? '[MSL]' : `[${scenario.doctorName}]`;
      return `${label}: ${e.text.trim()}`;
    })
    .join('\n');

  const transcript = lines || '(No transcript captured — ensure API keys are configured and microphone access was granted)';

  const system = `You are an expert MSL (Medical Science Liaison) coach providing specific, evidence-based feedback grounded in the actual conversation transcript. Be constructive and precise.`;

  const user = `Evaluate this MSL training session.

**Scenario:** Practice with ${scenario.doctorName} (${scenario.specialty})
**Focus area:** ${scenario.focusArea}

**Full conversation transcript:**
${transcript}

Score the MSL on these 10 competency dimensions (0–100 each):
${MSL_SKILLS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Scoring guide: 90–100 Expert · 75–89 Proficient · 60–74 Developing · <60 Needs work

If the transcript is empty or very short, note that and provide guidance on what to practise.

Respond with ONLY a valid JSON object — no markdown fences, no surrounding text:
{
  "overallScore": <weighted 0-100>,
  "summary": "<2-3 sentence executive summary referencing the actual conversation>",
  "skills": [
    {"name": "<exact skill name>", "score": <0-100>, "feedback": "<1-2 specific sentences, quote transcript where possible>"}
  ],
  "strengths": [
    {"title": "<3-5 word title>", "description": "<specific observation from transcript>"},
    {"title": "<3-5 word title>", "description": "<specific observation from transcript>"}
  ],
  "improvements": [
    {"title": "<3-5 word title>", "description": "<actionable coaching tip with example phrasing>"},
    {"title": "<3-5 word title>", "description": "<actionable coaching tip with example phrasing>"}
  ],
  "nextSteps": [
    "<concrete action item 1>",
    "<concrete action item 2>",
    "<concrete action item 3>"
  ]
}`;

  const raw = await veniceChat(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    apiKey,
  );

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract JSON from Venice response');

  return JSON.parse(match[0]) as SessionAnalysis;
}
