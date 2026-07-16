import { describe, it, expect } from 'vitest';
import { handleEnrich, assembleBrief, type BriefDeps } from '../src/background/service-worker';
import type { LlmAdapter } from '../src/llm/adapter';

const finding = (answer: string) => ({ answer, sources: [{ title: 't', url: 'https://s.com' }], verified: true });

const goodDeps: BriefDeps = {
  enrich: async () => ({ type: 'enriched', enrichment: { tldr: 'Payments.', explainsWhatItDoes: true, audience: null } }),
  receipts: async () => ({ registeredYear: 2010, domainAgeYears: 16, onlineSinceYear: 2011 }),
  founders: async () => finding('Patrick and John Collison.'),
  funding: async () => finding('Raised $12M Series A.'),
  reputation: async () => finding('Devs like the API.'),
};

describe('assembleBrief', () => {
  it('assembles every section and derives the company name', async () => {
    const b = await assembleBrief('https://www.stripe.com/in', 'text', goodDeps);
    expect(b.company).toBe('Stripe');
    expect(b.founders?.answer).toContain('Collison');
    expect(b.funding?.answer).toContain('Series A');
    expect(b.reputation?.answer).toContain('API');
    expect(b.receipts?.domainAgeYears).toBe(16);
    expect(b.whatTheyDo).toEqual({ type: 'enriched', enrichment: { tldr: 'Payments.', explainsWhatItDoes: true, audience: null } });
  });

  it('nulls only the failing section, keeping the rest', async () => {
    const b = await assembleBrief('https://stripe.com', 'text', {
      ...goodDeps,
      founders: async () => {
        throw new Error('no tavily key');
      },
    });
    expect(b.founders).toBeNull();
    expect(b.reputation?.answer).toContain('API'); // unaffected
    expect(b.receipts?.domainAgeYears).toBe(16); // unaffected
  });

  it('falls back to no-llm when enrichment fails', async () => {
    const b = await assembleBrief('https://stripe.com', 'text', {
      ...goodDeps,
      enrich: async () => {
        throw new Error('boom');
      },
    });
    expect(b.whatTheyDo).toEqual({ type: 'no-llm' });
  });
});

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
