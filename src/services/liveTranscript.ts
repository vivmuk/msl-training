import { transcribeBlob } from './veniceSTT';

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  pending?: boolean;
}

export type TranscriptHandler = (entry: TranscriptEntry) => void;

const SEGMENT_MS = 5000;

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

export class LiveTranscriptRecorder {
  private stream: MediaStream | null = null;
  private readonly apiKey: string;
  private readonly onEntry: TranscriptHandler;
  private stopped = false;
  private currentRecorder: MediaRecorder | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(apiKey: string, onEntry: TranscriptHandler) {
    this.apiKey = apiKey;
    this.onEntry = onEntry;
  }

  start(stream: MediaStream) {
    this.stream = stream;
    this.stopped = false;
    this.runSegment();
  }

  stop() {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.currentRecorder?.state === 'recording') {
      this.currentRecorder.stop();
    }
  }

  private runSegment() {
    if (this.stopped || !this.stream) return;

    const mimeType = getSupportedMimeType();
    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);
    const options = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(audioStream, options);
    const chunks: Blob[] = [];
    this.currentRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      if (chunks.length === 0) {
        if (!this.stopped) this.runSegment();
        return;
      }

      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      // Skip near-silent/empty segments (< 2 KB is almost certainly silence)
      if (blob.size < 2048) {
        if (!this.stopped) this.runSegment();
        return;
      }

      const id = String(Date.now());
      this.onEntry({ id, text: '...', timestamp: Date.now(), pending: true });

      try {
        const text = await transcribeBlob(blob, this.apiKey);
        this.onEntry({ id, text: text || '', timestamp: Date.now(), pending: false });
      } catch (err) {
        console.error('[LiveTranscript] Venice STT error:', err);
        this.onEntry({ id, text: '', timestamp: Date.now(), pending: false });
      }

      if (!this.stopped) this.runSegment();
    };

    recorder.start();

    this.timer = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, SEGMENT_MS);
  }
}
