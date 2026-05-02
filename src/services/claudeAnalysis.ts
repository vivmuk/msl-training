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
  moments?: {
    title: string;
    whatYouSaid: string;
    betterVersion: string;
    missedOpportunity: string;
  }[];
  nextSteps: string[];
  nextScenarioRecommendation?: {
    title: string;
    rationale: string;
    focus: string;
  };
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

export function buildLocalSessionAnalysis(
  entries: AnalysisEntry[],
  scenario: { doctorName: string; specialty: string; focusArea: string },
): SessionAnalysis {
  const mslEntries = entries.filter(e => e.speaker === 'msl' && e.text.trim());
  const questionPattern = /\?|^(what|how|when|where|which|who|why|can|could|would|do|does|are|is|tell me|walk me)\b/i;
  const evidencePattern = /\b(data|study|trial|evidence|ATTR-ACT|PYP|scan|diagnostic|NT-proBNP|KCCQ|mortality|hospitalization|biomarker|guideline|red flag)\b/i;
  const questionCount = mslEntries.filter(e => questionPattern.test(e.text.trim())).length;
  const evidenceCount = mslEntries.filter(e => evidencePattern.test(e.text)).length;
  const hasClose = mslEntries.some(e => /\b(follow up|send|share|next step|circle back|connect)\b/i.test(e.text));
  const transcriptDepth = Math.min(20, entries.filter(e => e.text.trim()).length * 3);
  const questionBoost = Math.min(20, questionCount * 5);
  const evidenceBoost = Math.min(15, evidenceCount * 5);
  const baseScore = Math.min(88, 48 + transcriptDepth + questionBoost + evidenceBoost + (hasClose ? 5 : 0));

  const scoreFor = (skill: string) => {
    if (skill === 'Probing & Discovery' || skill === 'Strategic Questioning') return Math.min(92, baseScore + questionBoost / 2);
    if (skill === 'Evidence Use' || skill === 'Scientific Communication') return Math.min(92, baseScore + evidenceBoost / 2);
    if (skill === 'Closure & Follow-Up') return hasClose ? Math.min(90, baseScore + 6) : Math.max(55, baseScore - 8);
    if (skill === 'Compliance Posture') return Math.max(70, Math.min(92, baseScore + 4));
    return baseScore;
  };

  const firstMsl = mslEntries[0]?.text || 'No learner statement was captured.';
  const bestQuestion = mslEntries.find(e => questionPattern.test(e.text.trim()))?.text || firstMsl;
  const bestEvidence = mslEntries.find(e => evidencePattern.test(e.text))?.text || firstMsl;

  return {
    overallScore: Math.round(baseScore),
    summary:
      mslEntries.length === 0
        ? `No MSL transcript was captured for the ${scenario.focusArea} scenario. Allow microphone access or type responses so the platform can score the interaction.`
        : `Local fallback analysis found ${questionCount} learner question${questionCount === 1 ? '' : 's'} and ${evidenceCount} evidence-based reference${evidenceCount === 1 ? '' : 's'} in this ${scenario.focusArea} scenario. Use Venice scoring for deeper transcript-specific coaching.`,
    skills: MSL_SKILLS.map(name => ({
      name,
      score: Math.round(scoreFor(name)),
      feedback:
        name === 'Probing & Discovery'
          ? `Captured ${questionCount} learner question${questionCount === 1 ? '' : 's'}. Strong sessions usually probe workflow, barriers, and decision criteria before sharing data.`
          : name === 'Evidence Use'
          ? `Captured ${evidenceCount} evidence-oriented reference${evidenceCount === 1 ? '' : 's'}. Tie evidence to the HCP's stated ATTR-CM workflow barrier.`
          : name === 'Closure & Follow-Up'
          ? hasClose
            ? 'The transcript includes follow-up language. Keep next steps specific and compliant.'
            : 'No clear follow-up was detected. Close with a specific, non-promotional next step.'
          : 'Local fallback score based on transcript depth, question use, evidence references, and compliance-safe language.',
    })),
    strengths: [
      {
        title: 'Captured Interaction',
        description: `The session produced ${entries.length} transcript entr${entries.length === 1 ? 'y' : 'ies'} for review.`,
      },
      {
        title: 'Question Signal',
        description: questionCount
          ? `A useful question was detected: "${bestQuestion}"`
          : 'No clear question was detected; discovery should lead the conversation.',
      },
    ],
    improvements: [
      {
        title: 'Probe Before Data',
        description: 'Ask one workflow question before sharing evidence, for example: "Where does the diagnostic pathway usually slow down?"',
      },
      {
        title: 'Close Specifically',
        description: 'End with a concrete next step, such as sending an approved ATTR-CM diagnostic pathway resource.',
      },
    ],
    moments: [
      {
        title: 'Discovery Opportunity',
        whatYouSaid: bestQuestion,
        betterVersion: 'Can you walk me through where suspected ATTR-CM patients most often stall in your diagnostic workflow?',
        missedOpportunity: 'Pinpoint the exact barrier before moving to data or resources.',
      },
      {
        title: 'Evidence Framing',
        whatYouSaid: bestEvidence,
        betterVersion: 'Based on that barrier, I can share approved ATTR-CM diagnostic pathway data that may help frame next steps.',
        missedOpportunity: 'Connect evidence to the HCP need and stay non-promotional.',
      },
      {
        title: 'Follow-Up Close',
        whatYouSaid: mslEntries[mslEntries.length - 1]?.text || firstMsl,
        betterVersion: 'Would it be useful if I followed up with an approved resource on red flags and diagnostic sequencing?',
        missedOpportunity: 'Make the close actionable and compliant.',
      },
    ],
    nextSteps: [
      'Ask at least three workflow or barrier questions before sharing evidence.',
      'Use one approved ATTR-CM diagnostic data point tied to the HCP need.',
      'Close with a specific follow-up resource or next discussion topic.',
    ],
    nextScenarioRecommendation: {
      title: 'ATTR-CM Objection Handling Drill',
      rationale: 'The next useful practice area is handling access, scan interpretation, or eligibility objections with compliant language.',
      focus: 'Discovery depth and evidence framing',
    },
  };
}

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
  "moments": [
    {
      "title": "<moment name>",
      "whatYouSaid": "<short direct excerpt or paraphrase from the MSL>",
      "betterVersion": "<improved compliant phrasing>",
      "missedOpportunity": "<what the learner could have explored>"
    },
    {
      "title": "<moment name>",
      "whatYouSaid": "<short direct excerpt or paraphrase from the MSL>",
      "betterVersion": "<improved compliant phrasing>",
      "missedOpportunity": "<what the learner could have explored>"
    },
    {
      "title": "<moment name>",
      "whatYouSaid": "<short direct excerpt or paraphrase from the MSL>",
      "betterVersion": "<improved compliant phrasing>",
      "missedOpportunity": "<what the learner could have explored>"
    }
  ],
  "nextSteps": [
    "<concrete action item 1>",
    "<concrete action item 2>",
    "<concrete action item 3>"
  ],
  "nextScenarioRecommendation": {
    "title": "<recommended ATTR-CM scenario>",
    "rationale": "<why this should be practiced next>",
    "focus": "<skill or clinical focus>"
  }
}`;

  const raw = await veniceChat(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    apiKey,
  );

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not extract JSON from Venice response');

  return JSON.parse(match[0]) as SessionAnalysis;
}
