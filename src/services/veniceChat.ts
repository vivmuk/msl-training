const VENICE_CHAT_URL = 'https://api.venice.ai/api/v1/chat/completions';

// Default to a large capable model; override with REACT_APP_VENICE_MODEL
const DEFAULT_MODEL = process.env.REACT_APP_VENICE_MODEL || 'google-gemma-4-31b-it';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function veniceChat(
  messages: ChatMessage[],
  apiKey: string,
  model = DEFAULT_MODEL,
  options: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const res = await fetch(VENICE_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Venice chat ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Venice');
  return content;
}
