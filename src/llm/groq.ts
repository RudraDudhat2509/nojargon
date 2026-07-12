import type { LlmAdapter } from './adapter';
import { SYSTEM, parseEnrichment } from './adapter';

async function getKey(): Promise<string | undefined> {
  try {
    return (await chrome.storage.local.get('groqKey')).groqKey as string | undefined;
  } catch {
    return undefined;
  }
}

export const GroqAdapter: LlmAdapter = {
  name: 'groq',
  async isAvailable() {
    return Boolean(await getKey());
  },
  async enrich(mainText) {
    const key = await getKey();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key!}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        response_format: { type: 'json_object' },
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: mainText.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return parseEnrichment(data?.choices?.[0]?.message?.content);
  },
};
