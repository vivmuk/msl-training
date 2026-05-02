import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StreamingAvatar, {
  AvatarQuality,
  STTProvider,
  StreamingEvents,
  VoiceEmotion,
  type StreamingTalkingMessageEvent,
  type UserTalkingMessageEvent,
} from '@heygen/streaming-avatar';
import UserCamera from './UserCamera';
import { AnalysisEntry } from '../services/claudeAnalysis';

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
  const [showScript, setShowScript] = useState(true);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);

  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const addEntry = useCallback((entry: DualEntry) => {
    entriesRef.current = [...entriesRef.current, entry];
    setEntries([...entriesRef.current]);
  }, []);

  // ── Session lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        // 1. Exchange API key for a short-lived session token
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

        // 2. Instantiate SDK and wire events before starting the session
        const avatar = new StreamingAvatar({ token: sessionToken });
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
          // The MediaStream is on event.detail (legacy) or avatar.mediaStream
          const stream: MediaStream | null = event?.detail ?? avatar.mediaStream;
          if (stream && avatarVideoRef.current) {
            avatarVideoRef.current.srcObject = stream;
            avatarVideoRef.current.play().catch(() => {});
          }
          setStatus('ready');
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => setAvatarSpeaking(true));
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => setAvatarSpeaking(false));

        // Avatar speech text — the key event for HCP transcript
        avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (evt: StreamingTalkingMessageEvent) => {
          const text = evt?.message?.trim();
          if (text) {
            addEntry({ id: `hcp-${Date.now()}`, speaker: 'hcp', text, timestamp: Date.now() });
          }
        });

        // User speech text — Deepgram STT built into HeyGen (replaces Venice STT in SDK mode)
        avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (evt: UserTalkingMessageEvent) => {
          const text = evt?.message?.trim();
          if (text) {
            addEntry({ id: `msl-${Date.now()}`, speaker: 'msl', text, timestamp: Date.now() });
          }
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          if (active) setStatus('error');
        });

        // 3. Start avatar session with knowledge base
        await avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: scenario.avatarName,
          knowledgeId: scenario.knowledgeId,
          voice: { emotion: VoiceEmotion.FRIENDLY },
          sttSettings: { provider: STTProvider.DEEPGRAM, confidence: 0.55 },
          language: 'en',
          activityIdleTimeout: 600,
        });

        if (!active) { avatar.stopAvatar().catch(() => {}); return; }

        // 4. Enable full-duplex voice chat
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────

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

  const handleEnd = async () => {
    if (isEnding) return;
    setIsEnding(true);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try { await avatarRef.current?.stopAvatar(); } catch {}
    avatarRef.current = null;

    // Convert internal DualEntry[] to AnalysisEntry[] for the analysis service
    const analysisEntries: AnalysisEntry[] = entriesRef.current.map(e => ({
      speaker: e.speaker,
      text: e.text,
      timestamp: e.timestamp,
    }));

    onEnd(analysisEntries, duration);
  };

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 flex flex-col">

      {/* ── Header ── */}
      <div className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Field Medical Training</h1>
            <p className="text-xs text-gray-500">{scenario.doctorName} · {scenario.specialty}</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status badge */}
            <span className={`hidden sm:inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${
              status === 'ready'
                ? 'bg-green-100 text-green-700'
                : status === 'connecting'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'ready' ? 'bg-green-500 animate-pulse' :
                status === 'connecting' ? 'bg-amber-500 animate-spin' : 'bg-red-500'
              }`} />
              <span>{status === 'ready' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}</span>
            </span>

            {status === 'ready' && (
              <>
                <button
                  onClick={handleMute}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isMuted ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                </button>
                <button
                  onClick={handleInterrupt}
                  className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                >
                  ⏸ Interrupt
                </button>
              </>
            )}

            {isEnding ? (
              <div className="flex items-center space-x-1.5 text-blue-600 text-xs">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600" />
                <span>Analyzing…</span>
              </div>
            ) : (
              <button
                onClick={handleEnd}
                disabled={status === 'connecting'}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>End &amp; Analyze</span>
              </button>
            )}

            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 space-y-4">

        {/* ── Video row ── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Avatar — large */}
          <div
            className="col-span-3 bg-gray-900 rounded-xl overflow-hidden shadow-xl relative"
            style={{ height: 460 }}
          >
            {/* Loading overlay */}
            <AnimatePresence>
              {status === 'connecting' && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
                  </div>
                  <p className="text-gray-300 font-medium">Connecting to {scenario.doctorName}…</p>
                  <p className="text-gray-500 text-sm mt-1">Setting up secure AI session (~10 s)</p>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-red-900 bg-opacity-50 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <p className="text-red-400 font-semibold mb-1">Connection failed</p>
                  <p className="text-gray-400 text-sm mb-4">{errorMsg}</p>
                  <button onClick={onBack} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                    Back to scenarios
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar video (always mounted so ref is stable) */}
            <video
              ref={avatarVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Speaking indicator */}
            {status === 'ready' && avatarSpeaking && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end space-x-0.5 bg-black bg-opacity-40 px-3 py-1.5 rounded-full">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary-400 rounded-full"
                    animate={{ height: [3, 14, 6, 18, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            )}

            {/* Name badge */}
            {status === 'ready' && (
              <div className="absolute top-3 left-3 bg-black bg-opacity-50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {scenario.doctorName} · {scenario.specialty}
              </div>
            )}
          </div>

          {/* User camera — smaller */}
          <div
            className="col-span-2 bg-gray-900 rounded-xl overflow-hidden shadow-xl"
            style={{ height: 460 }}
          >
            <div className="h-full relative">
              <UserCamera
                isActive={true}
                isSpeaking={false}
                onCameraReady={() => {}}
                onCameraError={() => {}}
              />
              <div className="absolute top-3 left-3 bg-black bg-opacity-50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">
                You (MSL)
              </div>
            </div>
          </div>
        </div>

        {/* ── Dual-track live transcript ── */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-gray-700">Live Transcript</h3>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>You (MSL)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{scenario.doctorName}</span>
                </span>
              </div>
            </div>
            {status === 'ready' && (
              <span className="flex items-center space-x-1 text-xs text-red-600 font-medium">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span>Recording</span>
              </span>
            )}
          </div>

          <div className="h-44 overflow-y-auto px-4 py-3 space-y-1.5 bg-gray-50 font-mono text-xs">
            {entries.length === 0 ? (
              <p className="text-gray-400 italic text-center mt-10">
                {status === 'connecting'
                  ? 'Transcript will appear once the session is live…'
                  : 'Session live. Speak naturally — both sides of the conversation are captured.'}
              </p>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <span className="text-gray-400 flex-shrink-0 tabular-nums w-16">{fmt(entry.timestamp)}</span>
                  <span className="text-gray-800 leading-relaxed">
                    <span className={`font-semibold mr-1 ${
                      entry.speaker === 'hcp' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {entry.speaker === 'hcp' ? `${scenario.doctorName}:` : 'You:'}
                    </span>
                    {entry.text}
                  </span>
                </div>
              ))
            )}
            <div ref={transcriptBottomRef} />
          </div>
        </div>

        {/* ── Collapsible training script ── */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowScript(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700">📋 Reference Script</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showScript ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showScript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 max-h-56 overflow-y-auto text-sm border-t border-gray-100">
                  <p className="font-semibold text-gray-800 mt-3 text-sm">{scriptTitle}</p>
                  {scriptSections.map((section, i) => (
                    <div key={i} className={`${section.color} p-3 rounded-r-lg`}>
                      <p className={`font-semibold ${section.textColor} text-xs mb-1`}>{section.title}</p>
                      <p className={`${section.textColor.replace('900', '800')} italic text-xs leading-relaxed`}>
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AvatarRoom;
