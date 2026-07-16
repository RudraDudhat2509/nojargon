import { describe, it, expect } from 'vitest';
import { parseTavily, foundersQuery, reputationQuery, fundingQuery, isVerified, MAX_QUERY } from '../src/research/tavily';

describe('isVerified (same-name conflation guard)', () => {
  const subject = { domain: 'altagic.com', company: 'Altagic' };

  it('verifies when a source references the company domain', () => {
    expect(isVerified([{ title: 'Rajat Sharma - altagic.com', url: 'https://x.com/a' }], subject)).toBe(true);
  });

  it('verifies when a source title names the company', () => {
    expect(isVerified([{ title: 'Altagic on Crunchbase', url: 'https://cb.com/altagic' }], subject)).toBe(true);
  });

  it('does NOT verify a same-named exec at a different company (the Allata bug)', () => {
    expect(
      isVerified([{ title: 'Matt Rosen, Founder & CEO of Allata | The Jeff Crilley Show', url: 'https://yt.com/x' }], subject),
    ).toBe(false);
  });

  it('is verified by default when no subject is given', () => {
    expect(isVerified([{ title: 'x', url: 'https://x.com' }])).toBe(true);
  });
});

describe('parseTavily', () => {
  it('parses the answer and source links', () => {
    const f = parseTavily({
      answer: 'Founded by Patrick and John Collison.',
      results: [
        { title: 'About Stripe', url: 'https://a.com', content: '...' },
        { title: 'Crunchbase', url: 'https://b.com', content: '...' },
      ],
    });
    expect(f.answer).toBe('Founded by Patrick and John Collison.');
    expect(f.sources).toHaveLength(2);
    expect(f.sources[0]).toEqual({ title: 'About Stripe', url: 'https://a.com' });
  });

  it('caps sources at 3', () => {
    const results = Array.from({ length: 6 }, (_, i) => ({ title: `t${i}`, url: `https://${i}.com` }));
    expect(parseTavily({ answer: 'x', results }).sources).toHaveLength(3);
  });

  it('throws when there is no usable answer', () => {
    expect(() => parseTavily({ results: [] })).toThrow();
    expect(() => parseTavily({ answer: '   ', results: [] })).toThrow();
  });

  it('tolerates missing results array', () => {
    expect(parseTavily({ answer: 'x' }).sources).toEqual([]);
  });
});

describe('query length guard', () => {
  // Tavily 400s past MAX_QUERY. A too-long query silently killed an entire eval
  // run, so every builder is bounds-checked — including for long company names.
  const long = { company: 'A'.repeat(60), domain: `${'b'.repeat(60)}.com` };

  it('keeps every query under the Tavily limit', () => {
    expect(foundersQuery('Stripe', 'stripe.com').length).toBeLessThan(MAX_QUERY);
    expect(reputationQuery('Stripe', 'stripe.com').length).toBeLessThan(MAX_QUERY);
    expect(fundingQuery('Stripe', 'stripe.com').length).toBeLessThan(MAX_QUERY);
  });

  it('stays under the limit even for absurd company names', () => {
    expect(foundersQuery(long.company, long.domain).length).toBeLessThan(MAX_QUERY);
    expect(reputationQuery(long.company, long.domain).length).toBeLessThan(MAX_QUERY);
    expect(fundingQuery(long.company, long.domain).length).toBeLessThan(MAX_QUERY);
  });
});

describe('query builders', () => {
  it('anchors the founders query to the domain, not just the name', () => {
    const q = foundersQuery('Altagic', 'altagic.com');
    expect(q).toMatch(/founded|founder/i);
    expect(q).toContain('Altagic');
    expect(q).toContain('altagic.com'); // the fix for same-name conflation
  });

  it('anchors the reputation query to the domain too', () => {
    const q = reputationQuery('Stripe', 'stripe.com');
    expect(q).toMatch(/review|complaint|reputation/i);
    expect(q).toContain('stripe.com');
  });
});
