const VENICE_STT_URL = 'https://api.venice.ai/api/v1/audio/transcriptions';

export async function transcribeBlob(blob: Blob, apiKey: string): Promise<string> {
  const file = new File([blob], 'recording.webm', { type: blob.type || 'audio/webm' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'nvidia/parakeet-tdt-0.6b-v3');
  formData.append('response_format', 'json');

  const res = await fetch(VENICE_STT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Venice STT ${res.status}: ${detail}`);
  }

  const json = await res.json();
  return (json.text ?? '').trim();
}
