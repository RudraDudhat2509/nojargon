import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/background/service-worker';
import type { LlmAdapter } from '../src/llm/adapter';

const ok: LlmAdapter = {
  name: 'x',
  isAvailable: async () => true,
  enrich: async () => ({ tldr: 'They sell X.', explainsWhatItDoes: true, audience: null }),
};

const boom: LlmAdapter = {
  name: 'boom',
  isAvailable: async () => true,
  enrich: async () => {
    throw new Error('offline');
  },
};

describe('handleEnrich', () => {
  it('returns enriched when an adapter succeeds', async () => {
    const r = await handleEnrich('text', [ok]);
    expect(r).toEqual({ type: 'enriched', enrichment: { tldr: 'They sell X.', explainsWhatItDoes: true, audience: null } });
  });

  it('returns no-llm when none available', async () => {
    expect(await handleEnrich('text', [])).toEqual({ type: 'no-llm' });
  });

  it('degrades to no-llm when the adapter throws', async () => {
    expect(await handleEnrich('text', [boom])).toEqual({ type: 'no-llm' });
  });
});
