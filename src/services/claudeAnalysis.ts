import { TranscriptEntry } from './liveTranscript';

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
  entries: TranscriptEntry[],
  scenario: { doctorName: string; specialty: string; focusArea: string },
  apiKey: string,
): Promise<SessionAnalysis> {
  const lines = entries
    .filter(e => !e.pending && e.text && e.text !== '...')
    .map(e => `[MSL]: ${e.text}`)
    .join('\n');

  const transcript = lines.trim()
    || '(No transcript was captured — ensure a Venice API key is set and microphone access was granted)';

  const userPrompt = `Evaluate this MSL (Medical Science Liaison) training session.

**Scenario:** Practice with ${scenario.doctorName} (${scenario.specialty})
**Focus area:** ${scenario.focusArea}

**Transcript — MSL speech only (voice-captured):**
${transcript}

Score the MSL on all 10 competency dimensions (0–100 each):
${MSL_SKILLS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Scoring guide: 90–100 Expert · 75–89 Proficient · 60–74 Developing · <60 Needs work

If the transcript is empty or very short, acknowledge that and give constructive guidance on what to practise.

Respond with ONLY a valid JSON object — no markdown fences, no text outside the braces:
{
  "overallScore": <weighted 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "skills": [
    {"name": "<exact skill name from the list>", "score": <0-100>, "feedback": "<1-2 specific sentences, reference transcript where possible>"}
  ],
  "strengths": [
    {"title": "<3-5 word title>", "description": "<specific observation>"},
    {"title": "<3-5 word title>", "description": "<specific observation>"}
  ],
  "improvements": [
    {"title": "<3-5 word title>", "description": "<actionable coaching tip>"},
    {"title": "<3-5 word title>", "description": "<actionable coaching tip>"}
  ],
  "nextSteps": [
    "<concrete action item 1>",
    "<concrete action item 2>",
    "<concrete action item 3>"
  ]
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'You are an expert MSL coach. Give specific, constructive, evidence-based feedback grounded in the transcript provided.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const raw: string = data.content?.[0]?.text ?? '';

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract JSON from Claude response');

  return JSON.parse(match[0]) as SessionAnalysis;
}
