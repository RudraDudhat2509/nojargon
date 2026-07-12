import type { LlmAdapter } from './adapter';
import { PROMPT } from './adapter';

async function getKey(): Promise<string | undefined> {
  try {
    return (await chrome.storage.local.get('claudeKey')).claudeKey as string | undefined;
  } catch {
    return undefined;
  }
}

export const ClaudeAdapter: LlmAdapter = {
  name: 'claude',
  async isAvailable() {
    return Boolean(await getKey());
  },
  async enrich(mainText) {
    const key = await getKey();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: PROMPT(mainText) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();
    const whatTheyDo = (data?.content?.[0]?.text ?? '').trim();
    if (!whatTheyDo) throw new Error('Claude API returned empty content');
    return { whatTheyDo, claimLabels: {} };
  },
};
