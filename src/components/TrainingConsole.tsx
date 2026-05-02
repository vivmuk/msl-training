import React, { useMemo, useState } from 'react';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BookOpenIcon,
  BoltIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  MicrophoneIcon,
  PauseIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  SpeakerWaveIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { LiveFeedbackNudge } from '../services/liveFeedback';
import { TrainingScenarioDraft } from '../services/scenarioGenerator';

type Speaker = 'msl' | 'hcp';

export interface ConsoleEntry {
  id?: string;
  speaker: Speaker;
  text: string;
  timestamp: number;
}

interface ScriptSection {
  title: string;
  color: string;
  textColor: string;
  content: string;
}

interface ConsoleScenario {
  doctorName: string;
  specialty: string;
  description: string;
}

interface TrainingConsoleProps {
  scenario: ConsoleScenario;
  scriptTitle: string;
  scriptSections: ScriptSection[];
  entries: ConsoleEntry[];
  liveNudges?: LiveFeedbackNudge[];
  generatedScenario?: TrainingScenarioDraft | null;
  status: 'connecting' | 'ready' | 'error';
  isMuted?: boolean;
  isEnding?: boolean;
  avatarPanel: React.ReactNode;
  userCameraPanel: React.ReactNode;
  onBack: () => void;
  onEnd: () => void;
  onMute?: () => void;
  onInterrupt?: () => void;
  onSendText?: (text: string) => void;
}

const scenarioRoster = [
  {
    name: 'Dr. Alex',
    specialty: 'Cardiologist',
    state: 'Live',
    image: 'https://files2.heygen.ai/avatar/v3/88d421f939044bb08d892e833931948b_45590/preview_talk_1.webp',
  },
  {
    name: 'Dr. Ena',
    specialty: 'Neurologist',
    state: 'Upcoming',
    image: 'https://files2.heygen.ai/avatar/v3/022cdb1f07914e75887c693f0c5f97df_45650/preview_talk_1.webp',
  },
  {
    name: 'Dr. Dat',
    specialty: 'Hematologist',
    state: 'Locked',
    image: 'https://files2.heygen.ai/avatar/v3/33c9ac4aead44dfc8bc0082a35062a70_45580/preview_talk_3.webp',
  },
];

const navItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Scenarios', icon: Squares2X2Icon, active: true },
  { label: 'Library', icon: BookOpenIcon },
  { label: 'Analytics', icon: ChartBarIcon },
  { label: 'Coaching', icon: UsersIcon },
  { label: 'Resources', icon: ClipboardDocumentListIcon },
];

const guardrails = [
  { text: 'Avoid making promotional claims', status: 'Compliant', tone: 'green' },
  { text: 'Do not discuss pricing or reimbursement', status: 'Compliant', tone: 'green' },
  { text: 'Do not provide prescribing advice', status: 'Compliant', tone: 'green' },
  { text: 'Balance benefit and risk discussion', status: 'At Risk', tone: 'red' },
  { text: 'Use of approved product information', status: 'Compliant', tone: 'green' },
];

const progressSteps = ['Opening', 'Discovery', 'Evidence', 'Objection', 'Close'];

const fmt = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const inferCoach = (scenario: ConsoleScenario, sections: ScriptSection[]) => {
  const text = sections.map(section => section.content).join(' ');
  return {
    objective:
      scenario.doctorName === 'Dr. Dat'
        ? 'Investigate enrollment friction and capture actionable site barriers.'
        : scenario.doctorName === 'Dr. Ena'
        ? 'Build the first relationship and discover scientific priorities.'
        : 'Explore diagnostic workflow and unmet needs in ATTR-CM assessment.',
    keyData:
      scenario.doctorName === 'Dr. Alex'
        ? 'Early and accurate diagnosis can improve patient outcomes in ATTR-CM.'
        : scenario.doctorName === 'Dr. Dat'
        ? 'Separate operational, consent, and eligibility barriers before proposing support.'
        : 'Ask permission before sharing study updates or trial information.',
    objection:
      text.includes('consent') ? 'Patient burden and comparator-arm concerns.' : 'Workflow access, equivocal scans, and data interpretation.',
    response: 'Ask one probing question, confirm understanding, then share approved evidence only if relevant.',
    compliance: 'Stay non-promotional. Do not discuss pricing, reimbursement, or prescribing decisions.',
  };
};

const TrainingConsole: React.FC<TrainingConsoleProps> = ({
  scenario,
  scriptTitle,
  scriptSections,
  entries,
  liveNudges,
  generatedScenario,
  status,
  isMuted = false,
  isEnding = false,
  avatarPanel,
  userCameraPanel,
  onBack,
  onEnd,
  onMute,
  onInterrupt,
  onSendText,
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [draftResponse, setDraftResponse] = useState('');
  const coach = generatedScenario
    ? {
        objective: generatedScenario.currentObjective,
        keyData: generatedScenario.keyDataPoint,
        objection: generatedScenario.likelyObjection,
        response: generatedScenario.talkingPoint,
        compliance: generatedScenario.complianceReminder,
      }
    : inferCoach(scenario, scriptSections);
  const visibleEntries = entries.filter(entry => entry.text.trim() && entry.text !== '...');
  const coachNudgeRows =
    liveNudges?.length
      ? liveNudges
      : generatedScenario?.coachNudges.map((nudge, index) => ({
          id: `scenario-${index}`,
          title: nudge.title,
          body: nudge.body,
          priority: index === 0 ? 'warning' : 'info',
        })) || [];
  const activeRoster = scenarioRoster.map(item => ({
    ...item,
    active: item.name === scenario.doctorName,
  }));
  const activeDoctorImage = activeRoster.find(item => item.active)?.image || scenarioRoster[0].image;
  const liveMetrics = useMemo(() => {
    const cleanEntries = entries.filter(entry => entry.text.trim() && entry.text !== '...');
    const mslEntries = cleanEntries.filter(entry => entry.speaker === 'msl');
    const hcpEntries = cleanEntries.filter(entry => entry.speaker === 'hcp');
    const wordCount = (rows: ConsoleEntry[]) =>
      rows.reduce((sum, entry) => sum + entry.text.trim().split(/\s+/).filter(Boolean).length, 0);
    const mslWords = wordCount(mslEntries);
    const hcpWords = wordCount(hcpEntries);
    const totalWords = mslWords + hcpWords;
    const mslRatio = totalWords ? Math.round((mslWords / totalWords) * 100) : 0;
    const hcpRatio = totalWords ? 100 - mslRatio : 0;
    const questionPattern = /\?|^(what|how|when|where|which|who|why|can|could|would|do|does|are|is|tell me|walk me)\b/i;
    const questionsAsked = mslEntries.filter(entry => questionPattern.test(entry.text.trim())).length;
    const evidencePattern = /\b(data|study|trial|evidence|ATTR-ACT|PYP|scan|diagnostic|NT-proBNP|KCCQ|mortality|hospitalization|biomarker|guideline|red flag)\b/i;
    const evidenceUsed = mslEntries.filter(entry => evidencePattern.test(entry.text)).length;

    return [
      {
        label: 'Talk Ratio',
        value: `${mslRatio}%`,
        detail: `${scenario.doctorName} ${hcpRatio}%`,
        width: `${Math.max(4, mslRatio)}%`,
      },
      {
        label: 'Questions Asked',
        value: `${questionsAsked} / 8`,
        detail: '',
        width: `${Math.min(100, Math.max(4, (questionsAsked / 8) * 100))}%`,
      },
      {
        label: 'Evidence Used',
        value: `${evidenceUsed} / 6`,
        detail: '',
        width: `${Math.min(100, Math.max(4, (evidenceUsed / 6) * 100))}%`,
      },
    ];
  }, [entries, scenario.doctorName]);

  const sendDraftResponse = () => {
    const text = draftResponse.trim();
    if (!text) return;
    onSendText?.(text);
    setDraftResponse('');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-[#0b2852]">
      <div className="flex min-h-screen">
        {!focusMode && <aside className="hidden w-[108px] shrink-0 flex-col bg-[#00274e] text-white xl:flex">
          <div className="flex h-16 items-center justify-center border-b border-white/10">
            <button className="rounded-md bg-blue-600 p-3 shadow-lg shadow-blue-950/30">
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={`flex w-full flex-col items-center gap-1 rounded-md px-2 py-3 text-[11px] ${
                  active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
          <div className="space-y-3 px-4 pb-5 text-center text-[11px] text-blue-100">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 font-bold">JS</div>
            <div>Profile</div>
            <div>Help</div>
          </div>
        </aside>}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
            <div className="flex items-center gap-5">
              <h1 className="text-lg font-bold text-slate-950">Field Medical Training</h1>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <h2 className="text-base font-bold text-slate-950">ATTR-CM Data Challenge</h2>
                <p className="text-xs text-slate-500">Scenario 2 of 5</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
                  status === 'ready' ? 'bg-emerald-50 text-emerald-700' : status === 'connecting' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {status === 'ready' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
              <span className="hidden items-end gap-1 text-emerald-700 lg:flex" aria-label="signal strength">
                <span className="h-2 w-1 rounded-full bg-current" />
                <span className="h-4 w-1 rounded-full bg-current" />
                <span className="h-5 w-1 rounded-full bg-current" />
              </span>
              <span className="hidden text-lg font-semibold text-slate-950 md:inline">12:08</span>
              <button className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 lg:flex">
                <Cog6ToothIcon className="h-4 w-4" />
                Settings
              </button>
              <button className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 lg:flex">
                <DocumentTextIcon className="h-4 w-4" />
                Notes
              </button>
              <button
                onClick={() => setFocusMode(mode => !mode)}
                className="hidden rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 lg:inline-flex"
              >
                {focusMode ? 'Show Console' : 'Focus Mode'}
              </button>
              <button
                onClick={() => setVoiceOnly(mode => !mode)}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold ${
                  voiceOnly
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <DevicePhoneMobileIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{voiceOnly ? 'Video Mode' : 'Voice Only'}</span>
                <span className="sm:hidden">{voiceOnly ? 'Video' : 'Voice'}</span>
              </button>
              <button
                onClick={onEnd}
                disabled={isEnding}
                className="inline-flex items-center gap-2 rounded-md bg-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-800 disabled:bg-slate-300"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                {isEnding ? 'Analyzing' : 'End & Analyze'}
              </button>
            </div>
          </header>

          <main className={`grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 ${
            focusMode ? 'xl:grid-cols-[minmax(760px,1180px)] xl:justify-center' : 'xl:grid-cols-[255px_minmax(620px,1fr)_395px]'
          }`}>
            {!focusMode && <section className="hidden space-y-3 xl:block">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Scenarios</span>
                  <span className="text-xl leading-none">+</span>
                </div>
                <div className="space-y-3">
                  {activeRoster.map(item => (
                    <div
                      key={item.name}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${
                        item.active ? 'border-blue-400 bg-blue-50' : 'border-transparent bg-white'
                      }`}
                    >
                      <img src={item.image} alt={`${item.name} preview`} className="h-12 w-12 rounded-full object-cover object-top" />
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold ${item.active ? 'text-blue-700' : 'text-slate-800'}`}>{item.name}</p>
                        <p className="text-xs text-slate-500">{item.specialty}</p>
                        <p className={`mt-1 text-[11px] font-medium ${item.state === 'Live' ? 'text-emerald-700' : item.state === 'Upcoming' ? 'text-amber-700' : 'text-slate-500'}`}>
                          {item.state}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                  Current Objective <span>2 / 4</span>
                </div>
                <p className="text-sm leading-5 text-[#0b2852]">{coach.objective}</p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 w-[46%] rounded-full bg-blue-700" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Difficulty</span>
                  <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">Intermediate</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Scenario Details</h3>
                {[
                  ['Focus', generatedScenario?.focusArea || 'Diagnostic process, treatment barriers, and sequencing'],
                  ['Duration', generatedScenario?.estimatedTime || '20 min'],
                  ['Stakeholder', generatedScenario?.stakeholder || scenario.specialty.replace('ist', 'y')],
                  ['Last Updated', 'May 8, 2024'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[66px_1fr] border-b border-slate-100 py-2 text-xs last:border-0">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-[#0b2852]">{value}</span>
                  </div>
                ))}
                <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700">
                  <DocumentTextIcon className="h-4 w-4" />
                  View Scenario Brief
                </button>
              </div>
            </section>}

            <section className="min-w-0 space-y-3">
              <div className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-sm ${
                voiceOnly ? 'h-[230px] md:h-[285px]' : focusMode ? 'h-[460px] md:h-[560px]' : 'h-[292px] md:h-[330px]'
              }`}>
                <div className={`${voiceOnly ? 'absolute inset-0 opacity-0 pointer-events-none' : 'h-full w-full'}`}>
                  {avatarPanel}
                </div>

                {voiceOnly ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#062b52] to-slate-900 px-6 text-white">
                    <div className="flex w-full max-w-xl items-center gap-5">
                      <img
                        src={activeDoctorImage}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-full border-2 border-white/70 object-cover object-top shadow-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                          <SpeakerWaveIcon className="h-4 w-4" />
                          Voice-only session
                        </div>
                        <h3 className="truncate text-2xl font-bold">{scenario.doctorName}</h3>
                        <p className="text-sm text-blue-100">{scenario.specialty}</p>
                        <p className="mt-2 max-w-md text-sm leading-5 text-slate-200">
                          Video is hidden for phone use. Audio, microphone, transcript, nudges, and analysis stay active.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute left-4 top-3 rounded-md bg-slate-950/85 px-3 py-2 text-sm font-semibold text-white">
                    {scenario.doctorName} <span className="px-1 text-slate-300">|</span> {scenario.specialty}
                  </div>
                )}

                <div
                  className={
                    voiceOnly
                      ? 'absolute bottom-1 right-1 h-px w-px overflow-hidden opacity-0 pointer-events-none'
                      : 'absolute right-4 top-3 h-28 w-36 overflow-hidden rounded-lg border-2 border-white bg-slate-900 shadow-lg'
                  }
                >
                  {userCameraPanel}
                  {!voiceOnly && (
                    <div className="absolute bottom-0 left-0 rounded-tr bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-white">MSL</div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4">
                  <div className="flex gap-6 text-xs font-semibold text-slate-500">
                    {['Transcript', 'Summary', 'Key Moments', 'Patient Profile', 'Data & References'].map((tab, index) => (
                      <button key={tab} className={`border-b-2 py-3 ${index === 0 ? 'border-blue-700 text-blue-700' : 'border-transparent'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-blue-700">
                    Live
                    <span className="h-5 w-9 rounded-full bg-blue-700 p-0.5">
                      <span className="block h-4 w-4 translate-x-4 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
                <div className="h-[310px] overflow-y-auto px-4 py-3">
                  <div className="space-y-3">
                    {visibleEntries.length === 0 ? (
                      <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                        <ChatBubbleLeftRightIcon className="mb-3 h-8 w-8 text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700">Live transcript will appear here</p>
                        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                          This panel only shows actual discussion turns between the MSL and {scenario.doctorName}. Start speaking or type an MSL response to begin.
                        </p>
                      </div>
                    ) : visibleEntries.map((entry, index) => (
                      <div key={entry.id ?? `${entry.speaker}-${index}`} className="grid grid-cols-[70px_36px_1fr] items-start gap-3 text-sm">
                        <div className="pt-1 text-xs text-[#0b2852]">
                          <div>{fmt(entry.timestamp)}</div>
                          <div className="font-semibold">{entry.speaker === 'hcp' ? scenario.doctorName : 'MSL'}</div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-700 text-xs font-bold text-white">
                          {entry.speaker === 'hcp' ? (
                            <img src={activeDoctorImage} alt="" className="h-full w-full object-cover object-top" />
                          ) : (
                            'MS'
                          )}
                        </div>
                        <div className="rounded-lg bg-slate-50 px-4 py-3 leading-5 text-[#0b2852]">{entry.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3">
                  <input
                    value={draftResponse}
                    onChange={event => setDraftResponse(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') sendDraftResponse();
                    }}
                    className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Type your response..."
                  />
                  <button onClick={sendDraftResponse} className="h-10 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white">Send</button>
                </div>
              </div>
            </section>

            {!focusMode && <aside className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Conversation Metrics</h3>
                  <button className="text-xs font-semibold text-blue-700">View Details</button>
                </div>
                <div className="space-y-3">
                  {liveMetrics.map(metric => (
                    <div key={metric.label} className="rounded-md border border-slate-100 p-3">
                      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                        <span>{metric.label}</span>
                        <span>{metric.label === 'Talk Ratio' ? '' : metric.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200">
                        <div className="h-1.5 rounded-full bg-blue-700" style={{ width: metric.width }} />
                      </div>
                      {metric.label === 'Talk Ratio' && (
                        <div className="mt-2 flex justify-between text-xs font-semibold text-blue-700">
                          <span>MSL {metric.value}</span>
                          <span className="text-slate-500">{metric.detail}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Compliance Guardrails</h3>
                  <button className="text-xs font-semibold text-blue-700">All View</button>
                </div>
                <div className="space-y-3">
                  {guardrails.map(item => (
                    <div key={item.text} className="flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-2">
                        <ShieldCheckIcon className={`h-4 w-4 ${item.tone === 'red' ? 'text-red-600' : 'text-emerald-600'}`} />
                        {item.text}
                      </span>
                      <span className={item.tone === 'red' ? 'text-red-600' : 'text-emerald-700'}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">Coach Nudges</h3>
                  <span className="text-xs font-semibold text-blue-700">2 Active</span>
                </div>
                <div className="space-y-3">
                  {(coachNudgeRows.length ? coachNudgeRows : [
                    { id: 'probe', title: 'Ask a probing question', body: 'Try asking a follow-up to better understand their workflow.', priority: 'warning' },
                    { id: 'evidence', title: 'Share supporting evidence', body: 'Consider referencing ATTR-CM diagnostic accuracy data.', priority: 'info' },
                  ]).map(nudge => {
                    const style = nudge.priority === 'warning' ? 'border-amber-300 text-amber-700' : nudge.priority === 'success' ? 'border-emerald-300 text-emerald-700' : 'border-blue-300 text-blue-700';
                    return (
                    <div key={nudge.id} className={`rounded-md border p-3 ${style}`}>
                      <div className="mb-1 font-bold">{nudge.title}</div>
                      <div className="text-xs text-[#0b2852]">{nudge.body}</div>
                    </div>
                  );})}
                </div>
              </div>
            </aside>}
          </main>

          {!focusMode && <section className="hidden shrink-0 border-t border-slate-200 bg-white px-6 py-3 xl:block">
            <div className="grid grid-cols-[1fr_1fr_1fr_1.6fr] gap-6">
              {[
                ['Patient Context', generatedScenario?.patientContext || '65-year-old male with HFpEF symptoms, increased LV thickness, and carpal tunnel syndrome.', 'View Details'],
                ['Key Data Point', coach.keyData, 'View Data'],
                ['Talking Point', coach.response, 'View Library'],
              ].map(([title, body, action], index) => (
                <div key={title} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex gap-3">
                    {index === 0 ? <UserCircleIcon className="h-7 w-7 text-slate-400" /> : index === 1 ? <ChartBarIcon className="h-7 w-7 text-emerald-700" /> : <ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-700" />}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>
                      <p className="mt-1 text-xs leading-4 text-[#0b2852]">{body}</p>
                      <button className="mt-1 text-xs font-semibold text-blue-700">{action}</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-l border-slate-200 pl-6">
                {progressSteps.map((step, index) => (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="text-center">
                      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${index === 1 ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                        {index + 1}
                      </div>
                      <div className={`mt-2 text-xs ${index === 1 ? 'text-blue-700' : 'text-slate-500'}`}>{step}</div>
                    </div>
                    {index < progressSteps.length - 1 && <div className="mx-2 mb-5 h-px flex-1 bg-slate-300" />}
                  </div>
                ))}
              </div>
            </div>
          </section>}

          <footer className="flex shrink-0 items-center justify-between gap-6 border-t border-slate-200 bg-white px-6 py-4">
            <div className="hidden w-72 rounded-lg border border-slate-200 px-4 py-3 text-xs lg:block">
              <div className="font-bold uppercase tracking-wide text-slate-500">Audio & Video</div>
              <div className="mt-1 flex items-center gap-2 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Good connection
              </div>
            </div>
            <div className="flex flex-1 justify-center gap-4">
              <button onClick={onMute} className="flex min-w-40 items-center justify-center gap-2 rounded-lg border border-slate-200 px-8 py-3 text-lg font-medium text-[#0b2852]">
                <MicrophoneIcon className="h-6 w-6" />
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={onInterrupt} className="flex min-w-40 items-center justify-center gap-2 rounded-lg border border-slate-200 px-8 py-3 text-lg font-medium text-[#0b2852]">
                <BoltIcon className="h-6 w-6" />
                Interrupt
              </button>
              <button className="flex min-w-40 items-center justify-center gap-2 rounded-lg border border-slate-200 px-8 py-3 text-lg font-medium text-[#0b2852]">
                <PauseIcon className="h-6 w-6" />
                Pause
              </button>
            </div>
            <button onClick={onEnd} className="hidden min-w-60 items-center justify-center gap-2 rounded-lg bg-red-700 px-8 py-3 text-lg font-bold text-white xl:flex">
              <ChartBarIcon className="h-6 w-6" />
              End & Analyze
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TrainingConsole;
