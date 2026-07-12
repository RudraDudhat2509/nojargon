import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderEnrichment } from '../src/panel/panel';

describe('renderEnrichment', () => {
  it('shows a key CTA when no LLM is available', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderEnrichment(root, { type: 'no-llm' });
    expect(root.textContent).toContain('Claude key');
  });

  it('shows the prose when enriched', () => {
    const { document } = parseHTML('<div id="root"></div>');
    const root = document.getElementById('root')! as unknown as HTMLElement;
    renderEnrichment(root, { type: 'enriched', whatTheyDo: 'They sync orders.', claimLabels: {} });
    expect(root.textContent).toContain('They sync orders.');
  });
});
