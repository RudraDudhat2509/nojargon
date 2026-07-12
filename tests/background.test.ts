import { describe, it, expect } from 'vitest';
import { handleEnrich } from '../src/background/service-worker';
import type { LlmAdapter } from '../src/llm/adapter';

const ok: LlmAdapter = {
  name: 'x',
  isAvailable: async () => true,
  enrich: async () => ({ whatTheyDo: 'They sell X.', claimLabels: {} }),
};

describe('handleEnrich', () => {
  it('returns enriched when an adapter is available', async () => {
    const r = await handleEnrich('text', [], [ok]);
    expect(r).toEqual({ type: 'enriched', whatTheyDo: 'They sell X.', claimLabels: {} });
  });

  it('returns no-llm when none available', async () => {
    const r = await handleEnrich('text', [], []);
    expect(r).toEqual({ type: 'no-llm' });
  });
});
