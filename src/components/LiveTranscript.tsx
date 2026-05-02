import React, { useEffect, useRef } from 'react';

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  pending?: boolean;
  speaker?: 'msl' | 'hcp';
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isRecording: boolean;
  doctorName?: string;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  entries,
  isRecording,
  doctorName = 'Doctor',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const visible = entries.filter(entry => entry.pending || (entry.text && entry.text.length > 0));

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700">Live Transcript</h3>
          {!isRecording && <span className="text-xs text-gray-400">- add API keys to enable</span>}
        </div>

        {isRecording && (
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-600">Recording</span>
          </div>
        )}
      </div>

      <div className="h-32 space-y-1.5 overflow-y-auto bg-gray-50 px-4 py-3 font-mono text-xs">
        {visible.length === 0 ? (
          <p className="mt-6 text-center italic text-gray-400">
            {isRecording
              ? 'Start speaking - live discussion turns appear every few seconds'
              : 'Live discussion transcript will appear once the session starts'}
          </p>
        ) : (
          visible.map(entry => {
            const speaker = entry.speaker ?? 'msl';
            return (
              <div key={entry.id} className="flex items-start space-x-2">
                <span className="shrink-0 tabular-nums text-gray-400">{fmt(entry.timestamp)}</span>
                <span className={entry.pending ? 'animate-pulse italic text-gray-400' : 'text-gray-800'}>
                  <span
                    className={`mr-1 font-semibold not-italic ${
                      speaker === 'hcp' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    {speaker === 'hcp' ? `${doctorName}:` : 'MSL:'}
                  </span>
                  {entry.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LiveTranscript;
