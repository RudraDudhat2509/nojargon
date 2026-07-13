import { describe, it, expect } from 'vitest';
import { selectAdapter, parseEnrichment, type LlmAdapter } from '../src/llm/adapter';

const stub = (name: string, ok: boolean): LlmAdapter => ({
  name,
  isAvailable: async () => ok,
  enrich: async () => ({ tldr: name, explainsWhatItDoes: true, audience: null }),
});

describe('selectAdapter', () => {
  it('picks the first available adapter in order', async () => {
    const chosen = await selectAdapter([stub('nano', false), stub('groq', true)]);
    expect(chosen!.name).toBe('groq');
  });

  it('returns null when none available', async () => {
    expect(await selectAdapter([stub('nano', false)])).toBeNull();
  });
});

describe('parseEnrichment', () => {
  it('parses a valid JSON enrichment', () => {
    const e = parseEnrichment('{"tldr":"Sells email software","explainsWhatItDoes":true,"audience":"shops"}');
    expect(e).toEqual({ tldr: 'Sells email software', explainsWhatItDoes: true, audience: 'shops' });
  });

  it('coerces a missing/null audience to null', () => {
    const e = parseEnrichment('{"tldr":"X","explainsWhatItDoes":false,"audience":null}');
    expect(e.audience).toBeNull();
  });

  it('throws on a missing required field', () => {
    expect(() => parseEnrichment('{"tldr":"X"}')).toThrow();
  });

  it('recovers JSON wrapped in markdown fences', () => {
    const e = parseEnrichment('```json\n{"tldr":"X","explainsWhatItDoes":true,"audience":null}\n```');
    expect(e.tldr).toBe('X');
  });

  it('throws on non-JSON', () => {
    expect(() => parseEnrichment('not json')).toThrow();
  });
});
