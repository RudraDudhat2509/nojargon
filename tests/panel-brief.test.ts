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
  founders: { answer: 'Founded by Patrick and John Collison.', sources: [{ title: 'About', url: 'https://about.com' }] },
  reputation: { answer: 'Devs praise the API; gripes about account freezes.', sources: [{ title: 'Reddit', url: 'https://reddit.com/x' }] },
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
