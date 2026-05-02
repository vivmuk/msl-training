import React, { useEffect, useMemo, useRef, useState } from 'react';
import UserCamera from './components/UserCamera';
import LandingPage from './components/LandingPage';
import PerformanceReview from './components/PerformanceReview';
import AvatarRoom from './components/AvatarRoom';
import TrainingConsole from './components/TrainingConsole';
import { TranscriptEntry } from './components/LiveTranscript';
import { LiveTranscriptRecorder } from './services/liveTranscript';
import { analyzeSession, AnalysisEntry, buildLocalSessionAnalysis, SessionAnalysis } from './services/claudeAnalysis';
import { TrainingScenarioDraft } from './services/scenarioGenerator';
import { buildLocalLiveFeedback, DEFAULT_LIVE_NUDGES, generateLiveFeedback, LiveFeedbackNudge } from './services/liveFeedback';
import { LiveAvatarConfig } from './services/liveAvatar';
import './App.css';

const scenarios = {
  alex: {
    doctorName: 'Dr. Alex',
    specialty: 'Cardiologist',
    description: 'Busy, extremely sharp KOL Cardiologist - tafamidis dose comparison',
    avatarName: 'Dexter_Doctor_Standing2_public',
    knowledgeId: '2ffddd528baa411d9cdcd972b38d5350',
    heyGenUrl:
      'https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJEZXh0ZXJfRG9jdG9yX1N0YW5kaW5nMl9w%0D%0AdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My84%0D%0AOGQ0MjFmOTM5MDQ0YmIwOGQ4OTJlODMzOTMxOTQ4Yl80NTU5MC9wcmV2aWV3X3RhbGtfMS53ZWJw%0D%0AIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOmZhbHNlLCJrbm93bGVkZ2VCYXNlSWQiOiIyZmZkZGQ1%0D%0AMjhiYWE0MTFkOWNkY2Q5NzJiMzhkNTM1MCIsInVzZXJuYW1lIjoiNGE2MjIwYWQyNjUwNDFkNWI4%0D%0ANTk2NjZjMDNiY2FmZjcifQ%3D%3D&inIFrame=1',
  },
  ena: {
    doctorName: 'Dr. Ena',
    specialty: 'Academic Oncologist',
    description: 'Warm HCP - first meeting, relationship building',
    avatarName: 'Judy_Doctor_Sitting2_public',
    knowledgeId: '143ea8a060994ce7a5587465b3018b3b',
    heyGenUrl:
      'https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJKdWR5X0RvY3Rvcl9TaXR0aW5nMl9wdWJs%0D%0AaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My8wMjJj%0D%0AZGIxZjA3OTE0ZTc1ODg3YzY5M2YwYzVmOTdkZF80NTY1MC9wcmV2aWV3X3RhbGtfMS53ZWJwIiwi%0D%0AbmVlZFJlbW92ZUJhY2tncm91bmQiOmZhbHNlLCJrbm93bGVkZ2VCYXNlSWQiOiIxNDNlYThhMDYw%0D%0AOTk0Y2U3YTU1ODc0NjViMzAxOGIzYiIsInVzZXJuYW1lIjoiNGE2MjIwYWQyNjUwNDFkNWI4NTk2%0D%0ANjZjMDNiY2FmZjcifQ%3D%3D&inIFrame=1',
  },
  dat: {
    doctorName: 'Dr. Dat',
    specialty: 'Clinical Research',
    description: 'Clinical Trial PI with enrollment challenges',
    avatarName: 'Bryan_IT_Sitting_public',
    knowledgeId: '94779ada29094de08f6cc68d0365834c',
    heyGenUrl:
      'https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJCcnlhbl9JVF9TaXR0aW5nX3B1YmxpYyIs%0D%0AInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzLzMzYzlhYzRh%0D%0AZWFkNDRkZmM4YmMwMDgyYTM1MDYyYTcwXzQ1NTgwL3ByZXZpZXdfdGFsa18zLndlYnAiLCJuZWVk%0D%0AUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6Ijk0Nzc5YWRhMjkwOTRk%0D%0AZTA4ZjZjYzY4ZDAzNjU4MzRjIiwidXNlcm5hbWUiOiI0YTYyMjBhZDI2NTA0MWQ1Yjg1OTY2NmMw%0D%0AM2JjYWZmNyJ9&inIFrame=1',
  },
};

const scripts = {
  alex: {
    title: 'Field Medical In-Person Script - Tafamidis Dose Comparison',
    sections: [
      {
        title: 'Opening objective',
        color: 'bg-blue-50 border-l-4 border-blue-400',
        textColor: 'text-blue-900',
        content: 'Thank Dr. Alex for the time, set a focused agenda, and ask how ATTR-CM diagnosis currently happens in their workflow.',
      },
      {
        title: 'Key data points',
        color: 'bg-emerald-50 border-l-4 border-emerald-400',
        textColor: 'text-emerald-900',
        content: 'ATTR-ACT and extension data support long-term outcome discussion; keep claims balanced and evidence-based.',
      },
      {
        title: 'Likely objection',
        color: 'bg-amber-50 border-l-4 border-amber-400',
        textColor: 'text-amber-900',
        content: 'Dr. Alex may challenge whether the dose comparison is powered, clinically meaningful, or applicable to older patients.',
      },
      {
        title: 'Recommended response',
        color: 'bg-slate-50 border-l-4 border-slate-400',
        textColor: 'text-slate-900',
        content: 'Acknowledge the limitation, clarify what the study can and cannot answer, then invite patient-selection context.',
      },
    ],
  },
  ena: {
    title: 'Field Medical Introduction Script - First Meeting',
    sections: [
      {
        title: 'Opening objective',
        color: 'bg-blue-50 border-l-4 border-blue-400',
        textColor: 'text-blue-900',
        content: 'Introduce your role, establish the exchange as non-promotional, and ask permission to learn about priorities.',
      },
      {
        title: 'Key data points',
        color: 'bg-emerald-50 border-l-4 border-emerald-400',
        textColor: 'text-emerald-900',
        content: 'Keep any study or trial mention brief until Dr. Ena identifies a relevant scientific interest.',
      },
      {
        title: 'Likely objection',
        color: 'bg-amber-50 border-l-4 border-amber-400',
        textColor: 'text-amber-900',
        content: 'Time pressure or uncertainty about whether another industry interaction will be useful.',
      },
      {
        title: 'Recommended response',
        color: 'bg-slate-50 border-l-4 border-slate-400',
        textColor: 'text-slate-900',
        content: 'Lead with curiosity, summarize what you heard, and offer a specific follow-up aligned to their interests.',
      },
    ],
  },
  dat: {
    title: 'Field Medical Investigative Script - Clinical Trial Enrollment',
    sections: [
      {
        title: 'Opening objective',
        color: 'bg-blue-50 border-l-4 border-blue-400',
        textColor: 'text-blue-900',
        content: 'Understand the specific enrollment barriers so they can be reported accurately and addressed by the right team.',
      },
      {
        title: 'Key data points',
        color: 'bg-emerald-50 border-l-4 border-emerald-400',
        textColor: 'text-emerald-900',
        content: 'Separate consent burden, visit schedule, comparator perception, screening failures, and site logistics.',
      },
      {
        title: 'Likely objection',
        color: 'bg-amber-50 border-l-4 border-amber-400',
        textColor: 'text-amber-900',
        content: 'Dr. Dat may be skeptical that feedback will change operations or may expect immediate commitments.',
      },
      {
        title: 'Recommended response',
        color: 'bg-slate-50 border-l-4 border-slate-400',
        textColor: 'text-slate-900',
        content: 'Summarize barriers precisely, avoid overpromising, and commit to routing the insight through appropriate channels.',
      },
    ],
  },
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof scenarios | 'custom'>('alex');
  const [generatedScenario, setGeneratedScenario] = useState<TrainingScenarioDraft | null>(() => {
    try {
      const stored = window.localStorage.getItem('ATTR_CM_GENERATED_SCENARIO');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isHeyGenReady, setIsHeyGenReady] = useState(false);
  const [heyGenError, setHeyGenError] = useState(false);
  const [showHeyGenIframe, setShowHeyGenIframe] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [liveNudges, setLiveNudges] = useState<LiveFeedbackNudge[]>(DEFAULT_LIVE_NUDGES);
  const [reviewEntries, setReviewEntries] = useState<AnalysisEntry[]>([]);
  const [analysisError, setAnalysisError] = useState('');
  const recorderRef = useRef<LiveTranscriptRecorder | null>(null);

  const currentScenario =
    selectedScenario === 'custom' && generatedScenario
      ? {
          ...scenarios.alex,
          doctorName: generatedScenario.doctorName,
          specialty: generatedScenario.specialty,
          description: generatedScenario.description,
        }
      : scenarios[(selectedScenario === 'custom' ? 'alex' : selectedScenario) as keyof typeof scenarios];
  const trainingScript =
    selectedScenario === 'custom' && generatedScenario
      ? { title: generatedScenario.scriptTitle, sections: generatedScenario.scriptSections }
      : scripts[(selectedScenario === 'custom' ? 'alex' : selectedScenario) as keyof typeof scripts];

  useEffect(() => {
    if (currentPage !== 'training') {
      setShowHeyGenIframe(false);
      setIsHeyGenReady(false);
      setHeyGenError(false);
      return;
    }

    const host = 'https://labs.heygen.com';
    const handleMessage = (e: MessageEvent) => {
      if (e.origin === host && e.data?.type === 'streaming-embed') {
        if (e.data.action === 'init') setIsHeyGenReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    const loadingTimeoutId = setTimeout(() => {
      if (!isHeyGenReady) setHeyGenError(true);
    }, 15000);
    const showTimeoutId = setTimeout(() => setShowHeyGenIframe(true), 500);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadingTimeoutId);
      clearTimeout(showTimeoutId);
    };
  }, [currentPage, isHeyGenReady, selectedScenario]);

  const getVeniceKey = () =>
    process.env.REACT_APP_VENICE_API_KEY ||
    window.localStorage.getItem('VENICE_API_KEY') ||
    window.localStorage.getItem('REACT_APP_VENICE_API_KEY') ||
    '';

  const getLiveAvatarKey = () =>
    process.env.REACT_APP_LIVEAVATAR_API_KEY ||
    window.localStorage.getItem('LIVEAVATAR_API_KEY') ||
    window.localStorage.getItem('REACT_APP_LIVEAVATAR_API_KEY') ||
    '';

  const handleUserCameraReady = (stream: MediaStream) => {
    const veniceKey = getVeniceKey();
    if (!veniceKey || recorderRef.current) return;

    const recorder = new LiveTranscriptRecorder(veniceKey, (entry: TranscriptEntry) => {
      setTranscriptEntries(prev => {
        const idx = prev.findIndex(e => e.id === entry.id);
        if (idx >= 0) {
          if (!entry.text) return prev.filter(e => e.id !== entry.id);
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        if (!entry.text) return prev;
        return [...prev, entry];
      });
    });
    recorder.start(stream);
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  useEffect(() => {
    if (generatedScenario) {
      window.localStorage.setItem('ATTR_CM_GENERATED_SCENARIO', JSON.stringify(generatedScenario));
    }
  }, [generatedScenario]);

  useEffect(() => {
    if (currentPage !== 'training') return;
    const analysisEntries = transcriptEntries
      .filter(e => !e.pending && e.text)
      .map(e => ({ speaker: e.speaker ?? 'msl' as const, text: e.text, timestamp: e.timestamp }));

    if (!analysisEntries.length) {
      setLiveNudges(DEFAULT_LIVE_NUDGES);
      return;
    }

    const fallbackNudges = buildLocalLiveFeedback(analysisEntries, {
      doctorName: currentScenario.doctorName,
      specialty: currentScenario.specialty,
      focusArea: currentScenario.description,
    });
    setLiveNudges(fallbackNudges);

    const apiKey = getVeniceKey();
    if (analysisEntries.length < 2) return;

    const timeout = window.setTimeout(async () => {
      try {
        const nudges = await generateLiveFeedback(
          analysisEntries,
          {
            doctorName: currentScenario.doctorName,
            specialty: currentScenario.specialty,
            focusArea: currentScenario.description,
          },
          apiKey,
        );
        setLiveNudges(nudges);
      } catch (err) {
        console.error('Live feedback failed:', err);
        setLiveNudges(fallbackNudges);
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [currentPage, transcriptEntries, currentScenario.description, currentScenario.doctorName, currentScenario.specialty]);

  const handleStartDemo = (scenarioId: string) => {
    setSelectedScenario(scenarioId === 'custom' ? 'custom' : (scenarioId as keyof typeof scenarios));
    setTranscriptEntries([]);
    setSessionAnalysis(null);
    setAnalysisError('');
    setReviewEntries([]);
    setLiveNudges(DEFAULT_LIVE_NUDGES);
    setSessionStartTime(Date.now());
    setCurrentPage('training');
  };

  const handleBackToLanding = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setCurrentPage('landing');
    setTranscriptEntries([]);
    setSessionAnalysis(null);
    setAnalysisError('');
    setReviewEntries([]);
  };

  const analyzeEntries = async (entries: AnalysisEntry[]) => {
    const veniceKey = getVeniceKey();
    const scenarioForAnalysis = {
      doctorName: currentScenario.doctorName,
      specialty: currentScenario.specialty,
      focusArea: currentScenario.description,
    };
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const analysis = await analyzeSession(
        entries,
        scenarioForAnalysis,
        veniceKey,
      );
      setSessionAnalysis(analysis);
    } catch (err) {
      console.error('Session analysis failed:', err);
      setSessionAnalysis(buildLocalSessionAnalysis(entries, scenarioForAnalysis));
      setAnalysisError('Venice analysis failed, so local transcript analysis is shown. Check the API key and network access for online scoring.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAvatarRoomEnd = async (entries: AnalysisEntry[], duration: number) => {
    setSessionStartTime(Date.now() - duration * 1000);
    setReviewEntries(entries);
    setCurrentPage('review');
    await analyzeEntries(entries);
  };

  const handleEndSession = async () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setCurrentPage('review');

    const entries = transcriptEntries
      .filter(e => !e.pending && e.text)
      .map(e => ({ speaker: e.speaker ?? 'msl' as const, text: e.text, timestamp: e.timestamp }));
    setReviewEntries(entries);
    await analyzeEntries(entries);
  };

  const handleGenerateReviewAnalysis = async () => {
    await analyzeEntries(reviewEntries);
  };

  const handleTypedResponse = (text: string) => {
    setTranscriptEntries(prev => [
      ...prev,
      {
        id: `typed-${Date.now()}`,
        text,
        timestamp: Date.now(),
        pending: false,
      },
    ]);
  };

  const liveAvatarScenarioKey = selectedScenario === 'custom' ? 'custom' : selectedScenario;
  const liveAvatarConfig = useMemo<LiveAvatarConfig>(() => {
    const scenarioPrefix = liveAvatarScenarioKey.toUpperCase();
    const readSetting = (suffix: string) =>
      process.env[`REACT_APP_LIVEAVATAR_${scenarioPrefix}_${suffix}`] ||
      process.env[`REACT_APP_LIVEAVATAR_${suffix}`] ||
      window.localStorage.getItem(`LIVEAVATAR_${scenarioPrefix}_${suffix}`) ||
      window.localStorage.getItem(`REACT_APP_LIVEAVATAR_${scenarioPrefix}_${suffix}`) ||
      window.localStorage.getItem(`LIVEAVATAR_${suffix}`) ||
      window.localStorage.getItem(`REACT_APP_LIVEAVATAR_${suffix}`) ||
      '';
    const readBoolean = (suffix: string) => readSetting(suffix).toLowerCase() === 'true';
    const quality = readSetting('VIDEO_QUALITY');
    const encoding = readSetting('VIDEO_ENCODING');

    return {
      scenarioKey: liveAvatarScenarioKey,
      avatarId: readSetting('AVATAR_ID'),
      contextId:
        selectedScenario === 'custom' && generatedScenario?.liveAvatarContextId
          ? generatedScenario.liveAvatarContextId
          : readSetting('CONTEXT_ID'),
      voiceId: readSetting('VOICE_ID'),
      llmConfigurationId: readSetting('LLM_CONFIGURATION_ID'),
      language: readSetting('LANGUAGE') || 'en',
      quality: (['low', 'medium', 'high', 'very_high'].includes(quality) ? quality : 'high') as LiveAvatarConfig['quality'],
      encoding: encoding === 'H264' ? 'H264' : 'VP8',
      isSandbox: readBoolean('SANDBOX'),
    };
  }, [generatedScenario?.liveAvatarContextId, liveAvatarScenarioKey, selectedScenario]);

  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const liveAvatarApiKey = getLiveAvatarKey();
  const shouldUseLiveAvatarRoom =
    currentPage === 'training' &&
    (Boolean(liveAvatarApiKey) || process.env.REACT_APP_LIVEAVATAR_ENABLED === 'true' || !isLocalHost);

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onStartDemo={handleStartDemo}
        generatedScenario={generatedScenario}
        onScenarioCreated={setGeneratedScenario}
      />
    );
  }

  if (currentPage === 'review') {
    return (
      <PerformanceReview
        onReturnHome={handleBackToLanding}
        duration={Math.floor((Date.now() - sessionStartTime) / 1000)}
        scenario={{ doctorName: currentScenario.doctorName, specialty: currentScenario.specialty }}
        analysis={isAnalyzing ? null : sessionAnalysis}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        hasAnalysisKey={Boolean(getVeniceKey()) || !isLocalHost}
        hasTranscript={reviewEntries.length > 0}
        onGenerateAnalysis={handleGenerateReviewAnalysis}
      />
    );
  }

  if (currentPage === 'training' && shouldUseLiveAvatarRoom) {
    return (
      <AvatarRoom
        scenario={currentScenario}
        scenarioKey={liveAvatarScenarioKey}
        scriptTitle={trainingScript.title}
        scriptSections={trainingScript.sections}
        liveNudges={liveNudges}
        generatedScenario={selectedScenario === 'custom' ? generatedScenario : null}
        liveAvatarApiKey={liveAvatarApiKey}
        liveAvatarConfig={liveAvatarConfig}
        onEnd={handleAvatarRoomEnd}
        onBack={handleBackToLanding}
      />
    );
  }

  return (
    <TrainingConsole
      scenario={currentScenario}
      scriptTitle={trainingScript.title}
      scriptSections={trainingScript.sections}
      entries={transcriptEntries.map(e => ({
        id: e.id,
        speaker: e.speaker ?? 'msl',
        text: e.text,
        timestamp: e.timestamp,
      }))}
      liveNudges={liveNudges}
      generatedScenario={selectedScenario === 'custom' ? generatedScenario : null}
      status={heyGenError ? 'error' : isHeyGenReady ? 'ready' : 'connecting'}
      isEnding={isAnalyzing}
      onBack={handleBackToLanding}
      onEnd={handleEndSession}
      onSendText={handleTypedResponse}
      avatarPanel={
        <>
          {showHeyGenIframe && !heyGenError ? (
            <iframe
              src={currentScenario.heyGenUrl}
              title={`${currentScenario.doctorName} - HeyGen Avatar`}
              allow="microphone; camera; autoplay; fullscreen; display-capture; encrypted-media; gyroscope; picture-in-picture; web-share"
              className="h-full w-full border-0 bg-slate-900"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-center text-white">
              <div>
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-400" />
                <p className="font-semibold">{heyGenError ? 'Avatar connection unavailable' : `Loading ${currentScenario.doctorName}`}</p>
                <p className="mt-1 text-sm text-slate-400">Training console is ready while the avatar connects.</p>
              </div>
            </div>
          )}
        </>
      }
      userCameraPanel={
        <UserCamera
          isActive={true}
          isSpeaking={isRecording}
          onCameraReady={handleUserCameraReady}
          onCameraError={error => console.error('User camera error:', error)}
        />
      }
    />
  );
};

export default App;
