import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StreamingAvatar, {
  AvatarQuality,
  STTProvider,
  StreamingEvents,
  VoiceEmotion,
  type StreamingTalkingMessageEvent,
  type UserTalkingMessageEvent,
} from '@heygen/streaming-avatar';
import UserCamera from './UserCamera';
import TrainingConsole from './TrainingConsole';
import { AnalysisEntry } from '../services/claudeAnalysis';
import { buildLocalLiveFeedback, DEFAULT_LIVE_NUDGES, generateLiveFeedback, LiveFeedbackNudge } from '../services/liveFeedback';
import { TrainingScenarioDraft } from '../services/scenarioGenerator';

export interface ScenarioConfig {
  doctorName: string;
  specialty: string;
  description: string;
  avatarName: string;
  knowledgeId: string;
}

interface ScriptSection {
  title: string;
  color: string;
  textColor: string;
  content: string;
}

interface AvatarRoomProps {
  scenario: ScenarioConfig;
  scriptTitle: string;
  scriptSections: ScriptSection[];
  liveNudges?: LiveFeedbackNudge[];
  generatedScenario?: TrainingScenarioDraft | null;
  heygenApiKey: string;
  onEnd: (transcript: AnalysisEntry[], durationSecs: number) => void;
  onBack: () => void;
}

type RoomStatus = 'connecting' | 'ready' | 'error';

interface DualEntry {
  id: string;
  speaker: 'msl' | 'hcp';
  text: string;
  timestamp: number;
}

const AvatarRoom: React.FC<AvatarRoomProps> = ({
  scenario,
  scriptTitle,
  scriptSections,
  liveNudges,
  generatedScenario,
  heygenApiKey,
  onEnd,
  onBack,
}) => {
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const entriesRef = useRef<DualEntry[]>([]);

  const [entries, setEntries] = useState<DualEntry[]>([]);
  const [status, setStatus] = useState<RoomStatus>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [internalNudges, setInternalNudges] = useState<LiveFeedbackNudge[]>(liveNudges || DEFAULT_LIVE_NUDGES);

  const addEntry = useCallback((entry: DualEntry) => {
    entriesRef.current = [...entriesRef.current, entry];
    setEntries([...entriesRef.current]);
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const tokenRes = await fetch('https://api.heygen.com/v1/streaming.create_token', {
          method: 'POST',
          headers: { 'X-Api-Key': heygenApiKey },
        });
        if (!tokenRes.ok) {
          const body = await tokenRes.text().catch(() => '');
          throw new Error(`Token error ${tokenRes.status}: ${body}`);
        }
        const tokenData = await tokenRes.json();
        const sessionToken: string = tokenData?.data?.token;
        if (!sessionToken) throw new Error('No session token returned by HeyGen');

        if (!active) return;

        const avatar = new StreamingAvatar({ token: sessionToken });
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
          const stream: MediaStream | null = event?.detail ?? avatar.mediaStream;
          if (stream && avatarVideoRef.current) {
            avatarVideoRef.current.srcObject = stream;
            avatarVideoRef.current.play().catch(() => {});
          }
          setStatus('ready');
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => setAvatarSpeaking(true));
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => setAvatarSpeaking(false));

        avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (evt: StreamingTalkingMessageEvent) => {
          const text = evt?.message?.trim();
          if (text) addEntry({ id: `hcp-${Date.now()}`, speaker: 'hcp', text, timestamp: Date.now() });
        });

        avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (evt: UserTalkingMessageEvent) => {
          const text = evt?.message?.trim();
          if (text) addEntry({ id: `msl-${Date.now()}`, speaker: 'msl', text, timestamp: Date.now() });
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          if (active) setStatus('error');
        });

        await avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: scenario.avatarName,
          knowledgeId: scenario.knowledgeId,
          voice: { emotion: VoiceEmotion.FRIENDLY },
          sttSettings: { provider: STTProvider.DEEPGRAM, confidence: 0.55 },
          language: 'en',
          activityIdleTimeout: 600,
        });

        if (!active) {
          avatar.stopAvatar().catch(() => {});
          return;
        }

        await avatar.startVoiceChat({ isInputAudioMuted: false });
      } catch (err: any) {
        console.error('[AvatarRoom] init error:', err);
        if (active) {
          setStatus('error');
          setErrorMsg(err?.message ?? 'Connection failed');
        }
      }
    };

    startTimeRef.current = Date.now();
    init();

    return () => {
      active = false;
      avatarRef.current?.stopAvatar().catch(() => {});
      avatarRef.current = null;
    };
  }, [addEntry, heygenApiKey, scenario.avatarName, scenario.knowledgeId]);

  useEffect(() => {
    if (liveNudges?.length) setInternalNudges(liveNudges);
  }, [liveNudges]);

  useEffect(() => {
    const analysisEntries = entries
      .filter(e => e.text)
      .map(e => ({ speaker: e.speaker, text: e.text, timestamp: e.timestamp }));

    if (!analysisEntries.length) {
      setInternalNudges(liveNudges || DEFAULT_LIVE_NUDGES);
      return;
    }

    const fallbackNudges = buildLocalLiveFeedback(analysisEntries, {
      doctorName: scenario.doctorName,
      specialty: scenario.specialty,
      focusArea: scenario.description,
    });
    setInternalNudges(fallbackNudges);

    const apiKey =
      process.env.REACT_APP_VENICE_API_KEY ||
      window.localStorage.getItem('VENICE_API_KEY') ||
      window.localStorage.getItem('REACT_APP_VENICE_API_KEY') ||
      '';
    if (!apiKey || analysisEntries.length < 2) return;

    const timeout = window.setTimeout(async () => {
      try {
        const nudges = await generateLiveFeedback(
          analysisEntries,
          { doctorName: scenario.doctorName, specialty: scenario.specialty, focusArea: scenario.description },
          apiKey,
        );
        setInternalNudges(nudges);
      } catch (err) {
        console.error('SDK live feedback failed:', err);
        setInternalNudges(fallbackNudges);
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [entries, liveNudges, scenario.description, scenario.doctorName, scenario.specialty]);

  const handleMute = () => {
    if (!avatarRef.current) return;
    if (isMuted) {
      avatarRef.current.unmuteInputAudio();
    } else {
      avatarRef.current.muteInputAudio();
    }
    setIsMuted(m => !m);
  };

  const handleInterrupt = () => avatarRef.current?.interrupt().catch(() => {});

  const handleTypedResponse = (text: string) => {
    addEntry({ id: `typed-${Date.now()}`, speaker: 'msl', text, timestamp: Date.now() });
  };

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      await avatarRef.current?.stopAvatar();
    } catch {}
    avatarRef.current = null;

    onEnd(
      entriesRef.current.map(e => ({
        speaker: e.speaker,
        text: e.text,
        timestamp: e.timestamp,
      })),
      duration,
    );
  };

  return (
    <TrainingConsole
      scenario={scenario}
      scriptTitle={scriptTitle}
      scriptSections={scriptSections}
      liveNudges={internalNudges}
      generatedScenario={generatedScenario}
      entries={entries}
      status={status}
      isMuted={isMuted}
      isEnding={isEnding}
      onBack={onBack}
      onEnd={handleEnd}
      onMute={handleMute}
      onInterrupt={handleInterrupt}
      onSendText={handleTypedResponse}
      avatarPanel={
        <div className="relative h-full w-full">
          <AnimatePresence>
            {status === 'connecting' && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-400" />
                </div>
                <p className="font-medium text-slate-200">Connecting to {scenario.doctorName}</p>
                <p className="mt-1 text-sm text-slate-400">Setting up secure AI session</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 p-6 text-center"
              >
                <p className="mb-1 font-semibold text-red-300">Connection failed</p>
                <p className="mb-4 text-sm text-slate-400">{errorMsg}</p>
                <button onClick={onBack} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">
                  Back to scenarios
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <video ref={avatarVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

          {status === 'ready' && avatarSpeaking && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-end gap-0.5 rounded-full bg-slate-950/50 px-3 py-1.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-blue-300"
                  animate={{ height: [4, 14, 6, 18, 4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
        </div>
      }
      userCameraPanel={
        <UserCamera
          isActive={true}
          isSpeaking={false}
          onCameraReady={() => {}}
          onCameraError={() => {}}
        />
      }
    />
  );
};

export default AvatarRoom;
