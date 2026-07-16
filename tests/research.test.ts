import { describe, it, expect } from 'vitest';
import { parseTavily, foundersQuery, reputationQuery } from '../src/research/tavily';

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

describe('query builders', () => {
  it('asks who founded the company', () => {
    expect(foundersQuery('Stripe')).toMatch(/founded|founder/i);
    expect(foundersQuery('Stripe')).toContain('Stripe');
  });

  it('asks what people say about the company', () => {
    expect(reputationQuery('Stripe')).toMatch(/review|complaint|reputation/i);
    expect(reputationQuery('Stripe')).toContain('Stripe');
  });
});
