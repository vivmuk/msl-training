import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '../services/liveTranscript';

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ entries, isRecording }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const visible = entries.filter(e => e.pending || (e.text && e.text.length > 0));

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700">Live Transcript</h3>
          <span className="text-xs text-gray-400">
            {!isRecording && '— add REACT_APP_VENICE_API_KEY to enable'}
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-600">Recording</span>
          </div>
        )}
      </div>

      <div className="h-32 overflow-y-auto px-4 py-3 space-y-1.5 bg-gray-50 font-mono text-xs">
        {visible.length === 0 ? (
          <p className="text-gray-400 italic text-center mt-6">
            {isRecording
              ? 'Start speaking — your words will appear here every ~5 s'
              : 'Transcript will appear once recording starts'}
          </p>
        ) : (
          visible.map(entry => (
            <div key={entry.id} className="flex items-start space-x-2">
              <span className="text-gray-400 flex-shrink-0 tabular-nums">{fmt(entry.timestamp)}</span>
              <span className={entry.pending ? 'text-gray-400 italic animate-pulse' : 'text-gray-800'}>
                <span className="font-semibold text-blue-600 not-italic">You: </span>
                {entry.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LiveTranscript;
