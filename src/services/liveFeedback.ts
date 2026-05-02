import { AnalysisEntry } from './claudeAnalysis';
import { veniceChat } from './veniceChat';

export interface LiveFeedbackNudge {
  id: string;
  title: string;
  body: string;
  priority: 'info' | 'warning' | 'success';
}

export const DEFAULT_LIVE_NUDGES: LiveFeedbackNudge[] = [
  {
    id: 'probe',
    title: 'Ask a probing question',
    body: 'Try asking a follow-up to better understand the HCP workflow before sharing data.',
    priority: 'warning',
  },
  {
    id: 'evidence',
    title: 'Share supporting evidence',
    body: 'Consider referencing ATTR-CM diagnostic accuracy or pathway data if it matches the HCP need.',
    priority: 'info',
  },
];

export function buildLocalLiveFeedback(
  entries: AnalysisEntry[],
  scenario: { doctorName: string; specialty: string; focusArea: string },
): LiveFeedbackNudge[] {
  const cleanEntries = entries.filter(e => e.text.trim());
  const mslEntries = cleanEntries.filter(e => e.speaker === 'msl');
  if (!mslEntries.length) return DEFAULT_LIVE_NUDGES;

  const questionPattern = /\?|^(what|how|when|where|which|who|why|can|could|would|do|does|are|is|tell me|walk me)\b/i;
  const evidencePattern = /\b(data|study|trial|evidence|ATTR-ACT|PYP|scan|diagnostic|NT-proBNP|KCCQ|mortality|hospitalization|biomarker|guideline|red flag)\b/i;
  const closePattern = /\b(follow up|send|share|next step|circle back|connect|resource)\b/i;
  const questionCount = mslEntries.filter(e => questionPattern.test(e.text.trim())).length;
  const evidenceCount = mslEntries.filter(e => evidencePattern.test(e.text)).length;
  const hasClose = mslEntries.some(e => closePattern.test(e.text));
  const lastMsl = mslEntries[mslEntries.length - 1]?.text || '';

  const nudges: LiveFeedbackNudge[] = [];

  if (questionCount < 2) {
    nudges.push({
      id: 'local-probe',
      title: 'Ask a probing question',
      body: `Clarify ${scenario.doctorName}'s ATTR-CM workflow barrier before sharing data.`,
      priority: 'warning',
    });
  } else {
    nudges.push({
      id: 'local-listening',
      title: 'Good discovery rhythm',
      body: 'Summarize the barrier you heard before moving to evidence.',
      priority: 'success',
    });
  }

  if (evidenceCount === 0) {
    nudges.push({
      id: 'local-evidence',
      title: 'Link approved evidence',
      body: 'Use one ATTR-CM diagnostic data point tied to the stated need.',
      priority: 'info',
    });
  } else {
    nudges.push({
      id: 'local-balance',
      title: 'Keep data balanced',
      body: 'State what the evidence supports and avoid treatment recommendations.',
      priority: 'success',
    });
  }

  if (!hasClose && cleanEntries.length >= 3) {
    nudges.push({
      id: 'local-close',
      title: 'Plan the close',
      body: 'Offer a compliant follow-up resource or next discussion topic.',
      priority: 'info',
    });
  }

  if (lastMsl.length > 160 && !questionPattern.test(lastMsl)) {
    nudges.unshift({
      id: 'local-brief',
      title: 'Pause for HCP input',
      body: 'Shorten the response and invite their perspective.',
      priority: 'warning',
    });
  }

  return nudges.slice(0, 3);
}

export async function generateLiveFeedback(
  entries: AnalysisEntry[],
  scenario: { doctorName: string; specialty: string; focusArea: string },
  apiKey: string,
): Promise<LiveFeedbackNudge[]> {
  const transcript = entries
    .filter(e => e.text.trim())
    .slice(-8)
    .map(e => `${e.speaker === 'msl' ? 'MSL' : scenario.doctorName}: ${e.text.trim()}`)
    .join('\n');

  if (!transcript) return DEFAULT_LIVE_NUDGES;

  const raw = await veniceChat(
    [
      {
        role: 'system',
        content:
          'You are a real-time MSL coach. Give short, actionable, compliant nudges for an ATTR-CM training simulation. Return only JSON.',
      },
      {
        role: 'user',
        content: `Scenario: ${scenario.doctorName}, ${scenario.specialty}. Focus: ${scenario.focusArea}

Recent transcript:
${transcript}

Return exactly:
{
  "nudges": [
    {"title": "3-6 words", "body": "specific next action, max 18 words", "priority": "info | warning | success"},
    {"title": "3-6 words", "body": "specific next action, max 18 words", "priority": "info | warning | success"}
  ]
}`,
      },
    ],
    apiKey,
    undefined,
    { maxTokens: 600, temperature: 0.25 },
  );

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return DEFAULT_LIVE_NUDGES;
  const parsed = JSON.parse(match[0]) as { nudges?: Array<Partial<LiveFeedbackNudge>> };

  return (parsed.nudges?.length ? parsed.nudges : DEFAULT_LIVE_NUDGES).slice(0, 3).map((nudge, index) => ({
    id: `venice-${Date.now()}-${index}`,
    title: nudge.title || DEFAULT_LIVE_NUDGES[index]?.title || 'Refine next response',
    body: nudge.body || DEFAULT_LIVE_NUDGES[index]?.body || 'Ask one more discovery question before moving on.',
    priority: nudge.priority === 'success' || nudge.priority === 'warning' ? nudge.priority : 'info',
  }));
}
