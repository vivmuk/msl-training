import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Room, RoomEvent, Track } from 'livekit-client';
import UserCamera from './UserCamera';
import TrainingConsole from './TrainingConsole';
import { AnalysisEntry } from '../services/claudeAnalysis';
import {
  createLiveAvatarSession,
  LiveAvatarConfig,
  LiveAvatarSession,
  stopLiveAvatarSession,
} from '../services/liveAvatar';
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
  scenarioKey?: string;
  scriptTitle: string;
  scriptSections: ScriptSection[];
  liveNudges?: LiveFeedbackNudge[];
  generatedScenario?: TrainingScenarioDraft | null;
  liveAvatarApiKey?: string;
  liveAvatarConfig?: LiveAvatarConfig;
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

const controlTopic = 'agent-control';
const responseTopic = 'agent-response';

function eventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function decodePayload(payload: Uint8Array) {
  try {
    return JSON.parse(new TextDecoder().decode(payload));
  } catch {
    return null;
  }
}

function eventText(event: any) {
  return (
    event?.text ||
    event?.data?.text ||
    event?.payload?.text ||
    event?.transcript ||
    event?.data?.transcript ||
    ''
  ).trim();
}

const AvatarRoom: React.FC<AvatarRoomProps> = ({
  scenario,
  scenarioKey,
  scriptTitle,
  scriptSections,
  liveNudges,
  generatedScenario,
  liveAvatarApiKey = '',
  liveAvatarConfig,
  onEnd,
  onBack,
}) => {
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const avatarAudioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const entriesRef = useRef<DualEntry[]>([]);
  const isEndingRef = useRef(false);

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

  const sendControlEvent = useCallback((eventType: string, data: Record<string, unknown> = {}) => {
    const room = roomRef.current;
    const sessionId = sessionRef.current?.sessionId;
    if (!room || !sessionId) return;

    const payload = new TextEncoder().encode(
      JSON.stringify({
        event_id: eventId(),
        event_type: eventType,
        session_id: sessionId,
        source_event_id: null,
        ...data,
      }),
    );

    room.localParticipant.publishData(payload, { reliable: true, topic: controlTopic }).catch(error => {
      console.error('[LiveAvatar] control event failed:', error);
    });
  }, []);

  useEffect(() => {
    let active = true;

    const attachTrack = (track: any) => {
      if (track.kind === Track.Kind.Video && avatarVideoRef.current) {
        track.attach(avatarVideoRef.current);
      }
      if (track.kind === Track.Kind.Audio && avatarAudioRef.current) {
        track.attach(avatarAudioRef.current);
        avatarAudioRef.current.play().catch(() => {});
      }
    };

    const handleResponseEvent = (payload: Uint8Array, _participant?: unknown, _kind?: unknown, topic?: string) => {
      if (topic && topic !== responseTopic) return;
      const event = decodePayload(payload);
      const eventType = event?.event_type || event?.type;
      if (!eventType) return;

      if (eventType === 'avatar.speak_started') setAvatarSpeaking(true);
      if (eventType === 'avatar.speak_ended') setAvatarSpeaking(false);

      const text = eventText(event);
      if (!text) return;

      if (eventType === 'user.transcription') {
        addEntry({ id: `msl-${Date.now()}`, speaker: 'msl', text, timestamp: Date.now() });
      }
      if (eventType === 'avatar.transcription') {
        addEntry({ id: `hcp-${Date.now()}`, speaker: 'hcp', text, timestamp: Date.now() });
      }
    };

    const init = async () => {
      try {
        setStatus('connecting');
        setErrorMsg('');

        const session = await createLiveAvatarSession(
          {
            scenarioKey,
            ...liveAvatarConfig,
            language: liveAvatarConfig?.language || 'en',
            quality: liveAvatarConfig?.quality || 'high',
            encoding: liveAvatarConfig?.encoding || 'VP8',
          },
          liveAvatarApiKey,
        );
        sessionRef.current = session;
        if (!active) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, attachTrack);
        room.on(RoomEvent.DataReceived, handleResponseEvent);
        room.on(RoomEvent.Disconnected, () => {
          if (active && !isEndingRef.current) setStatus('error');
        });

        await room.connect(session.livekitUrl, session.livekitClientToken, { autoSubscribe: true });
        if (!active) {
          await room.disconnect();
          return;
        }

        room.remoteParticipants.forEach(participant => {
          participant.trackPublications.forEach(publication => {
            if (publication.track) attachTrack(publication.track);
          });
        });

        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
        setStatus('ready');
      } catch (err: any) {
        console.error('[LiveAvatar] init error:', err);
        if (active) {
          setStatus('error');
          setErrorMsg(err?.message || 'Connection failed');
        }
      }
    };

    startTimeRef.current = Date.now();
    init();

    return () => {
      active = false;
      roomRef.current?.disconnect().catch(() => {});
      roomRef.current = null;
      const sessionId = sessionRef.current?.sessionId;
      sessionRef.current = null;
      if (sessionId) stopLiveAvatarSession(sessionId, liveAvatarApiKey, 'USER_DISCONNECTED');
    };
  }, [addEntry, liveAvatarApiKey, liveAvatarConfig, scenarioKey]);

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
    if (analysisEntries.length < 2) return;

    const timeout = window.setTimeout(async () => {
      try {
        const nudges = await generateLiveFeedback(
          analysisEntries,
          { doctorName: scenario.doctorName, specialty: scenario.specialty, focusArea: scenario.description },
          apiKey,
        );
        setInternalNudges(nudges);
      } catch (err) {
        console.error('LiveAvatar live feedback failed:', err);
        setInternalNudges(fallbackNudges);
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [entries, liveNudges, scenario.description, scenario.doctorName, scenario.specialty]);

  const handleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const nextMuted = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setIsMuted(nextMuted);
  };

  const handleInterrupt = () => sendControlEvent('avatar.interrupt');

  const handleTypedResponse = (text: string) => {
    addEntry({ id: `typed-${Date.now()}`, speaker: 'msl', text, timestamp: Date.now() });
    sendControlEvent('avatar.speak_response', { text });
  };

  const handleEnd = async () => {
    if (isEnding) return;
    isEndingRef.current = true;
    setIsEnding(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const sessionId = sessionRef.current?.sessionId;

    try {
      await roomRef.current?.disconnect();
      if (sessionId) await stopLiveAvatarSession(sessionId, liveAvatarApiKey, 'USER_CLOSED');
    } catch {}

    roomRef.current = null;
    sessionRef.current = null;

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
                <p className="mt-1 text-sm text-slate-400">Starting LiveAvatar session</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 p-6 text-center"
              >
                <p className="mb-1 font-semibold text-red-300">Connection failed</p>
                <p className="mb-4 max-w-xl text-sm text-slate-400">{errorMsg}</p>
                <button onClick={onBack} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600">
                  Back to scenarios
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <video ref={avatarVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <audio ref={avatarAudioRef} autoPlay />

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
