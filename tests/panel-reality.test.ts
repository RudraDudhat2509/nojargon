import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderEnrichment } from '../src/panel/panel';
import type { ScoreResult } from '../src/engine/types';

const result: ScoreResult = {
  buzzwordLoad: 'high',
  fluffPer1k: 40,
  words: 200,
  claims: [{ text: 'synergy', span: [0, 7], plain: '(no meaning)', empty: true }],
  redFlags: [{ id: 'no_named_customers', message: 'No named customers or case studies.' }],
};

describe('renderEnrichment (fused card)', () => {
  it('fuses the LLM TL;DR with deterministic flags + buzzword load', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderEnrichment(
      root,
      { type: 'enriched', enrichment: { tldr: 'They automate busywork by wiring apps together.', explainsWhatItDoes: true, audience: 'small teams' } },
      result,
    );
    expect(root.textContent).toContain('They automate busywork');
    expect(root.textContent).toContain('clearly says what it does'); // LLM-derived
    expect(root.textContent).toContain('No named customers'); // deterministic flag
    expect(root.textContent).toContain('buzzword load: high'); // deterministic
    expect(root.textContent).toContain('For: small teams');
  });

  it('still shows the reality check + CTA when no LLM is available', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderEnrichment(root, { type: 'no-llm' }, result);
    expect(root.textContent).toContain('Groq key'); // CTA
    expect(root.textContent).toContain('No named customers'); // reality check still renders
    expect(root.textContent).toContain('buzzword load: high');
    expect(root.textContent).not.toContain('clearly says what it does'); // no LLM line
  });
});
