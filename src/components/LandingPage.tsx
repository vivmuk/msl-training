import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  ATTR_CM_FALLBACK_SCENARIO,
  generateAttrCmScenario,
  TrainingScenarioDraft,
} from '../services/scenarioGenerator';
import {
  createHeyGenTrainingVideoSession,
  getHeyGenTrainingVideoSession,
  HeyGenAgentSession,
  sendHeyGenTrainingVideoMessage,
} from '../services/heygenVideoAgent';

interface LandingPageProps {
  onStartDemo: (scenario: string) => void;
  onScenarioCreated?: (scenario: TrainingScenarioDraft) => void;
  generatedScenario?: TrainingScenarioDraft | null;
  onLocalSettingsSaved?: () => void;
}

const scenarios = [
  {
    id: 'alex',
    doctorName: 'Dr. Alex',
    specialty: 'Cardiologist',
    difficulty: 'Advanced',
    difficultyStyle: 'bg-red-50 text-red-700 ring-red-200',
    trainingGoal: 'Practice data challenge',
    challenge: 'Sharp questions on tafamidis dose comparison and evidence strength.',
    time: '18 min',
    action: 'Start Data Challenge',
    image:
      'https://files2.heygen.ai/avatar/v3/88d421f939044bb08d892e833931948b_45590/preview_talk_1.webp',
    metrics: { score: 82, status: 'Live-ready' },
  },
  {
    id: 'ena',
    doctorName: 'Dr. Ena',
    specialty: 'Academic Oncologist',
    difficulty: 'Beginner',
    difficultyStyle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    trainingGoal: 'Build first relationship',
    challenge: 'Open a first meeting, discover needs, and earn permission to follow up.',
    time: '12 min',
    action: 'Start Relationship Practice',
    image:
      'https://files2.heygen.ai/avatar/v3/022cdb1f07914e75887c693f0c5f97df_45650/preview_talk_1.webp',
    metrics: { score: 88, status: 'Recommended' },
  },
  {
    id: 'dat',
    doctorName: 'Dr. Dat',
    specialty: 'Clinical Research',
    difficulty: 'Intermediate',
    difficultyStyle: 'bg-amber-50 text-amber-700 ring-amber-200',
    trainingGoal: 'Investigate enrollment barrier',
    challenge: 'Probe site friction without leading the PI or overpromising fixes.',
    time: '16 min',
    action: 'Start Enrollment Practice',
    image:
      'https://files2.heygen.ai/avatar/v3/33c9ac4aead44dfc8bc0082a35062a70_45580/preview_talk_3.webp',
    metrics: { score: 76, status: 'Skill builder' },
  },
];

const recentSessions = [
  { label: 'Scientific exchange', score: 84, trend: '+6 pts' },
  { label: 'Discovery quality', score: 78, trend: '+3 pts' },
  { label: 'Compliance posture', score: 92, trend: 'Stable' },
];

const workflow = ['Opening', 'Discovery', 'Evidence', 'Objection', 'Close'];

const benefits = [
  {
    icon: ShieldCheckIcon,
    title: 'Risk-Free Practice',
    description: 'Practice complex clinical conversations without the pressure of real HCP interactions.',
  },
  {
    icon: AcademicCapIcon,
    title: 'Real-Time Feedback',
    description: 'Get immediate coaching signals, realistic pushback, and scenario-specific conversation cues.',
  },
  {
    icon: ChartBarIcon,
    title: 'Performance Tracking',
    description: 'Monitor progress over time and identify where scientific exchange or discovery skills need work.',
  },
  {
    icon: DocumentChartBarIcon,
    title: 'Scenario-Based Learning',
    description: 'Train against specific HCP profiles, therapeutic contexts, and field medical objectives.',
  },
  {
    icon: ClockIcon,
    title: 'Scalable Training',
    description: 'Give field teams consistent practice without scheduling, travel, or role-play constraints.',
  },
  {
    icon: Cog6ToothIcon,
    title: 'Cost-Effective Enablement',
    description: 'Use repeatable AI sessions to reinforce training between workshops and live coaching.',
  },
];

const LandingPage: React.FC<LandingPageProps> = ({ onStartDemo, onScenarioCreated, generatedScenario, onLocalSettingsSaved }) => {
  const [builderInput, setBuilderInput] = useState({
    audience: 'New MSLs preparing for cardiology field visits',
    difficulty: 'Intermediate',
    goal: 'Practice diagnosing workflow barriers in ATTR-CM',
    clinicalFocus: 'HFpEF red flags, PYP scan access, lab workup, and referral sequencing',
    hcpPersona: 'Skeptical cardiologist with limited time and inconsistent scan interpretation support',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [builderError, setBuilderError] = useState('');
  const [videoSession, setVideoSession] = useState<HeyGenAgentSession | null>(null);
  const [videoFeedback, setVideoFeedback] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [apiKeys, setApiKeys] = useState({ venice: '', liveavatar: '', liveavatarAvatarId: '', heygen: '' });
  const [savedKeys, setSavedKeys] = useState(() => ({
    venice: Boolean(window.localStorage.getItem('VENICE_API_KEY')),
    liveavatar: Boolean(window.localStorage.getItem('LIVEAVATAR_API_KEY')),
    liveavatarAvatarId: Boolean(window.localStorage.getItem('LIVEAVATAR_AVATAR_ID')),
    heygen: Boolean(window.localStorage.getItem('HEYGEN_API_KEY')),
  }));

  const customScenario = generatedScenario
    ? {
        id: 'custom',
        doctorName: generatedScenario.doctorName,
        specialty: generatedScenario.specialty,
        difficulty: generatedScenario.difficulty,
        difficultyStyle:
          generatedScenario.difficulty === 'Advanced'
            ? 'bg-red-50 text-red-700 ring-red-200'
            : generatedScenario.difficulty === 'Beginner'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-amber-50 text-amber-700 ring-amber-200',
        trainingGoal: generatedScenario.trainingGoal,
        challenge: generatedScenario.expectedChallenge,
        time: generatedScenario.estimatedTime,
        action: 'Start Generated Scenario',
        image:
          'https://files2.heygen.ai/avatar/v3/88d421f939044bb08d892e833931948b_45590/preview_talk_1.webp',
        metrics: { score: 0, status: 'Generated' },
      }
    : null;
  const scenarioCards = customScenario ? [...scenarios, customScenario] : scenarios;

  const updateBuilder = (field: keyof typeof builderInput, value: string) => {
    setBuilderInput(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateScenario = async () => {
    setIsGenerating(true);
    setBuilderError('');

    const apiKey =
      apiKeys.venice ||
      process.env.REACT_APP_VENICE_API_KEY ||
      window.localStorage.getItem('VENICE_API_KEY') ||
      window.localStorage.getItem('REACT_APP_VENICE_API_KEY') ||
      '';

    try {
      const scenario = apiKey
        ? await generateAttrCmScenario(builderInput, apiKey)
        : {
            ...ATTR_CM_FALLBACK_SCENARIO,
            id: `generated-${Date.now()}`,
            trainingGoal: builderInput.goal,
            expectedChallenge: builderInput.hcpPersona,
            focusArea: builderInput.clinicalFocus,
          };
      onScenarioCreated?.(scenario);
    } catch (error) {
      console.error('Scenario generation failed:', error);
      setBuilderError('Venice scenario generation failed, so a safe ATTR-CM fallback was loaded.');
      onScenarioCreated?.({ ...ATTR_CM_FALLBACK_SCENARIO, id: `generated-${Date.now()}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const getHeyGenKey = () =>
    apiKeys.heygen ||
    process.env.REACT_APP_HEYGEN_API_KEY ||
    window.localStorage.getItem('HEYGEN_API_KEY') ||
    window.localStorage.getItem('REACT_APP_HEYGEN_API_KEY') ||
    '';

  const saveLocalKeys = () => {
    if (apiKeys.venice) window.localStorage.setItem('VENICE_API_KEY', apiKeys.venice);
    if (apiKeys.liveavatar) window.localStorage.setItem('LIVEAVATAR_API_KEY', apiKeys.liveavatar);
    if (apiKeys.liveavatarAvatarId) window.localStorage.setItem('LIVEAVATAR_AVATAR_ID', apiKeys.liveavatarAvatarId);
    if (apiKeys.heygen) window.localStorage.setItem('HEYGEN_API_KEY', apiKeys.heygen);
    setSavedKeys({
      venice: Boolean(apiKeys.venice || window.localStorage.getItem('VENICE_API_KEY')),
      liveavatar: Boolean(apiKeys.liveavatar || window.localStorage.getItem('LIVEAVATAR_API_KEY')),
      liveavatarAvatarId: Boolean(apiKeys.liveavatarAvatarId || window.localStorage.getItem('LIVEAVATAR_AVATAR_ID')),
      heygen: Boolean(apiKeys.heygen || window.localStorage.getItem('HEYGEN_API_KEY')),
    });
    setApiKeys({ venice: '', liveavatar: '', liveavatarAvatarId: '', heygen: '' });
    setBuilderError('Local API settings saved in this browser only.');
    onLocalSettingsSaved?.();
  };

  const handleCreateVideoStoryboard = async () => {
    if (!generatedScenario) return;
    const apiKey = getHeyGenKey();
    if (!apiKey) {
      setVideoStatus('Add a HeyGen API key to REACT_APP_HEYGEN_API_KEY or localStorage to create storyboard sessions.');
      return;
    }

    setVideoStatus('Creating HeyGen storyboard session...');
    try {
      const session = await createHeyGenTrainingVideoSession(generatedScenario, apiKey);
      setVideoSession(session);
      setVideoStatus('Storyboard session created. Poll for review status in a few seconds.');
    } catch (error) {
      console.error('HeyGen session creation failed:', error);
      setVideoStatus('HeyGen storyboard session failed. Check the API key and account access.');
    }
  };

  const handlePollVideoStoryboard = async () => {
    if (!videoSession) return;
    const apiKey = getHeyGenKey();
    if (!apiKey) return;
    setVideoStatus('Checking HeyGen session...');
    try {
      const session = await getHeyGenTrainingVideoSession(videoSession.session_id, apiKey);
      setVideoSession(session);
      setVideoStatus(`Session status: ${session.status}${session.progress != null ? ` (${session.progress}%)` : ''}`);
    } catch (error) {
      console.error('HeyGen polling failed:', error);
      setVideoStatus('Could not refresh HeyGen session status.');
    }
  };

  const handleSendVideoFeedback = async (autoProceed = false) => {
    if (!videoSession) return;
    const apiKey = getHeyGenKey();
    if (!apiKey || !videoFeedback.trim()) return;
    setVideoStatus(autoProceed ? 'Approving storyboard and generating video...' : 'Sending storyboard feedback...');
    try {
      await sendHeyGenTrainingVideoMessage(videoSession.session_id, videoFeedback.trim(), apiKey, autoProceed);
      setVideoFeedback('');
      await handlePollVideoStoryboard();
    } catch (error) {
      console.error('HeyGen feedback failed:', error);
      setVideoStatus('Could not send HeyGen storyboard feedback.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Field Medical Training</p>
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">MSL Training Cockpit</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:flex">
              <DocumentChartBarIcon className="h-4 w-4" />
              Session History
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <Cog6ToothIcon className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Scenario queue</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Choose today&apos;s HCP simulation</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Start with a focused clinical conversation, then review transcript-backed coaching after the session.
                </p>
              </div>
              <button
                onClick={() => onStartDemo('alex')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
              >
                Start Scenario
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {scenarioCards.map((scenario, index) => (
              <motion.article
                key={scenario.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 bg-slate-100">
                  <img
                    src={scenario.image}
                    alt={`${scenario.doctorName} avatar preview`}
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute left-3 top-3 rounded-lg bg-slate-950/85 px-3 py-1.5 text-xs font-semibold text-white">
                    {scenario.doctorName} | {scenario.specialty}
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${scenario.difficultyStyle}`}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{scenario.metrics.status}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{scenario.trainingGoal}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{scenario.challenge}</p>
                  </div>

                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <dt className="text-slate-500">Estimated time</dt>
                      <dd className="inline-flex items-center gap-1 font-semibold text-slate-800">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        {scenario.time}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Last score</dt>
                      <dd className="font-semibold text-slate-800">{scenario.metrics.score}</dd>
                    </div>
                  </dl>

                  <button
                    onClick={() => onStartDemo(scenario.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    {scenario.action}
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="h-6 w-6 text-blue-700" />
              <div>
                <h2 className="text-lg font-bold text-slate-950">Conversation structure</h2>
                <p className="text-sm text-slate-600">Every session follows a clear coaching path so learners can recover quickly.</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {workflow.map((step, index) => (
                <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Scenario Builder</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Generate an ATTR-CM training scenario</h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                  Training teams can create targeted simulations for disease education, diagnostic workflows, enrollment barriers, and field skill development.
                </p>
              </div>
              <button
                onClick={handleGenerateScenario}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
              >
                {isGenerating ? 'Generating...' : 'Generate Scenario'}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Learner audience
                <input
                  value={builderInput.audience}
                  onChange={event => updateBuilder('audience', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Difficulty
                <select
                  value={builderInput.difficulty}
                  onChange={event => updateBuilder('difficulty', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Training goal
                <input
                  value={builderInput.goal}
                  onChange={event => updateBuilder('goal', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                HCP persona
                <input
                  value={builderInput.hcpPersona}
                  onChange={event => updateBuilder('hcpPersona', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Clinical focus
                <textarea
                  value={builderInput.clinicalFocus}
                  onChange={event => updateBuilder('clinicalFocus', event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">
                  Venice API key
                  <input
                    type="password"
                    value={apiKeys.venice}
                    onChange={event => setApiKeys(prev => ({ ...prev, venice: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Used for scenario generation, live nudges, and analysis"
                  />
                  {savedKeys.venice && <span className="mt-1 block text-xs font-medium text-emerald-700">Saved locally</span>}
                </label>
                <label className="text-sm font-medium text-slate-700">
                  LiveAvatar API key
                  <input
                    type="password"
                    value={apiKeys.liveavatar}
                    onChange={event => setApiKeys(prev => ({ ...prev, liveavatar: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Used for real-time HCP avatar sessions"
                  />
                  {savedKeys.liveavatar && <span className="mt-1 block text-xs font-medium text-emerald-700">Saved locally</span>}
                </label>
                <label className="text-sm font-medium text-slate-700">
                  LiveAvatar avatar ID
                  <input
                    value={apiKeys.liveavatarAvatarId}
                    onChange={event => setApiKeys(prev => ({ ...prev, liveavatarAvatarId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Default avatar ID for local testing"
                  />
                  {savedKeys.liveavatarAvatarId && <span className="mt-1 block text-xs font-medium text-emerald-700">Saved locally</span>}
                </label>
                <label className="text-sm font-medium text-slate-700">
                  HeyGen Video Agent key
                  <input
                    type="password"
                    value={apiKeys.heygen}
                    onChange={event => setApiKeys(prev => ({ ...prev, heygen: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Used for Video Agent storyboard sessions"
                  />
                  {savedKeys.heygen && <span className="mt-1 block text-xs font-medium text-emerald-700">Saved locally</span>}
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={saveLocalKeys}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Save Local Keys
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Keys are stored only in this browser and are not committed to the repo.</p>
            </div>

            {builderError && <p className="mt-3 text-sm font-medium text-amber-700">{builderError}</p>}
            {generatedScenario && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Generated scenario ready</p>
                    <h3 className="mt-1 font-bold text-slate-950">{generatedScenario.title}</h3>
                    <p className="mt-1 text-sm text-slate-700">{generatedScenario.currentObjective}</p>
                  </div>
                  <button
                    onClick={() => onStartDemo('custom')}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Launch Generated Scenario
                  </button>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">HeyGen Video Agent</p>
                      <h4 className="font-bold text-slate-950">Create a storyboard for training rollout</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Use interactive sessions to review, revise, and approve a short scenario training video.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCreateVideoStoryboard}
                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Create Storyboard
                      </button>
                      {videoSession && (
                        <button
                          onClick={handlePollVideoStoryboard}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Poll Status
                        </button>
                      )}
                    </div>
                  </div>
                  {videoStatus && <p className="mt-3 text-sm font-medium text-slate-700">{videoStatus}</p>}
                  {videoSession && (
                    <div className="mt-4 space-y-3">
                      <div className="grid gap-2 text-sm md:grid-cols-3">
                        <div className="rounded-md bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-500">Session</span>
                          <span className="break-all font-medium text-slate-800">{videoSession.session_id}</span>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-500">Status</span>
                          <span className="font-medium text-slate-800">{videoSession.status}</span>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <span className="block text-xs font-bold uppercase text-slate-500">Video</span>
                          <span className="font-medium text-slate-800">{videoSession.video_id || 'Not generated yet'}</span>
                        </div>
                      </div>
                      {videoSession.messages?.length ? (
                        <div className="max-h-44 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                          {videoSession.messages.slice(0, 4).map((message, index) => (
                            <div key={`${message.created_at}-${index}`} className="mb-3 last:mb-0">
                              <span className="font-bold capitalize text-slate-700">{message.role}: </span>
                              <span className="text-slate-600">{message.content}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <textarea
                        value={videoFeedback}
                        onChange={event => setVideoFeedback(event.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="Request a storyboard change or approve it..."
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSendVideoFeedback(false)}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                          Send Feedback
                        </button>
                        <button
                          onClick={() => handleSendVideoFeedback(true)}
                          className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                          Approve & Generate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-medium text-blue-700">Why AI training helps</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Benefits for field medical teams</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Icon className="mb-3 h-6 w-6 text-blue-700" />
                  <h3 className="text-sm font-bold text-slate-950">{title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Recent performance</h2>
              <ChartBarIcon className="h-5 w-5 text-blue-700" />
            </div>
            <div className="mt-4 space-y-4">
              {recentSessions.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-950">{item.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-700" style={{ width: `${item.score}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-medium text-emerald-700">{item.trend}</p>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Review Past Sessions
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-950">Readiness checks</h2>
                <p className="text-sm text-slate-600">Training console requirements</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {['Camera and microphone test', 'Compliance guardrails active', 'Transcript capture enabled'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-medium text-slate-700">{item}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default LandingPage;
