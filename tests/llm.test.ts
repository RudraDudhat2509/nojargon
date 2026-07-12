import { describe, it, expect } from 'vitest';
import { selectAdapter, type LlmAdapter } from '../src/llm/adapter';

const stub = (name: string, ok: boolean): LlmAdapter => ({
  name,
  isAvailable: async () => ok,
  enrich: async () => ({ whatTheyDo: name, claimLabels: {} }),
});

describe('selectAdapter', () => {
  it('picks the first available adapter in order', async () => {
    const chosen = await selectAdapter([stub('nano', false), stub('claude', true)]);
    expect(chosen!.name).toBe('claude');
  });

  it('returns null when none available', async () => {
    expect(await selectAdapter([stub('nano', false)])).toBeNull();
  });
});
