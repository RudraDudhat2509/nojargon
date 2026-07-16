import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { renderBrief } from '../src/panel/panel';
import type { Brief } from '../src/shared/messages';
import type { ScoreResult } from '../src/engine/types';

const score: ScoreResult = {
  buzzwordLoad: 'medium',
  fluffPer1k: 10,
  words: 300,
  claims: [{ text: 'seamless', span: [0, 8], plain: 'works without extra setup', empty: false }],
  redFlags: [{ id: 'no_named_customers', message: 'No named customers or case studies.' }],
};

const fullBrief: Brief = {
  company: 'Stripe',
  whatTheyDo: { type: 'enriched', enrichment: { tldr: 'Payment software for online businesses.', explainsWhatItDoes: true, audience: 'developers' } },
  receipts: { registeredYear: 2010, domainAgeYears: 16, onlineSinceYear: 2011 },
  founders: { answer: 'Founded by Patrick and John Collison.', sources: [{ title: 'About', url: 'https://about.com' }], verified: true },
  reputation: { answer: 'Devs praise the API; gripes about account freezes.', sources: [{ title: 'Reddit', url: 'https://reddit.com/x' }], verified: true },
};

const root = () => {
  const { document } = parseHTML('<div id="root"></div>');
  return document.getElementById('root')! as unknown as HTMLElement;
};

describe('renderBrief', () => {
  it('renders every section of a full brief', () => {
    const r = root();
    renderBrief(r, fullBrief, score);
    expect(r.textContent).toContain('Payment software for online businesses.');
    expect(r.textContent).toContain('Collison'); // founders
    expect(r.textContent).toContain('account freezes'); // reputation
    expect(r.textContent).toContain('16'); // domain age
    expect(r.textContent).toContain('2011'); // online since
    expect(r.textContent).toContain('buzzword load: medium');
  });

  it('links every external claim to a source', () => {
    const r = root();
    renderBrief(r, fullBrief, score);
    const hrefs = [...r.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://about.com');
    expect(hrefs).toContain('https://reddit.com/x');
  });

  it('tucks sources into a collapsed card so they never crowd the read', () => {
    const r = root();
    renderBrief(r, fullBrief, score);
    const details = [...r.querySelectorAll('details.sources')];
    expect(details.length).toBe(2); // founders + reputation
    // Collapsed by default: no `open` attribute.
    expect(details.every((d) => !d.hasAttribute('open'))).toBe(true);
    expect(details[0]!.querySelector('summary')?.textContent).toBe('1 source');
  });

  it('warns when a researched claim is unverified instead of asserting it', () => {
    const r = root();
    renderBrief(
      r,
      { ...fullBrief, founders: { answer: 'Matt Rosen is the CEO.', sources: [{ title: 'CEO of Allata', url: 'https://x.com' }], verified: false } },
      score,
    );
    expect(r.querySelector('.unverified')).toBeTruthy();
    expect(r.textContent).toContain('Unverified');
    // The claim is still shown (with its sources) — flagged, not hidden.
    expect(r.textContent).toContain('Matt Rosen is the CEO.');
  });

  it('shows no unverified warning when the claim is corroborated', () => {
    const r = root();
    renderBrief(r, fullBrief, score);
    expect(r.querySelector('.unverified')).toBeNull();
  });

  it('uses no emoji in section headers', () => {
    const r = root();
    renderBrief(r, fullBrief, score);
    const headers = [...r.querySelectorAll('h2')].map((h) => h.textContent ?? '');
    expect(headers).toContain('Founders');
    expect(headers.some((h) => /\p{Extended_Pictographic}/u.test(h))).toBe(false);
  });

  it('omits sections that are null rather than showing them empty', () => {
    const r = root();
    renderBrief(r, { ...fullBrief, founders: null, reputation: null, receipts: null }, score);
    expect(r.textContent).not.toContain('Founders');
    expect(r.textContent).not.toContain('Reputation');
    expect(r.textContent).not.toContain('Legitimacy');
    // local sections still render
    expect(r.textContent).toContain('Payment software for online businesses.');
    expect(r.textContent).toContain('buzzword load: medium');
  });

  it('still renders the local layers when the LLM is unavailable', () => {
    const r = root();
    renderBrief(r, { ...fullBrief, whatTheyDo: { type: 'no-llm' } }, score);
    expect(r.textContent).toContain('buzzword load: medium');
    expect(r.textContent).toContain('Collison'); // research unaffected by the LLM
  });
});
