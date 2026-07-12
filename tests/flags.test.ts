import { describe, it, expect } from 'vitest';
import { deriveRedFlags } from '../src/engine/flags';

describe('red flags', () => {
  it('fires high_buzzword_density on fluff-heavy metrics', () => {
    const flags = deriveRedFlags('cutting-edge synergy', { fluffPer1k: 60, concretePer1k: 0, words: 50 });
    expect(flags.map((f) => f.id)).toContain('high_buzzword_density');
  });

  it('fires no_numbers_or_specs when concrete signal is zero', () => {
    const flags = deriveRedFlags('we are great', { fluffPer1k: 10, concretePer1k: 0, words: 50 });
    expect(flags.map((f) => f.id)).toContain('no_numbers_or_specs');
  });

  it('fires no_named_customers when no orgs or "customers" appear', () => {
    const flags = deriveRedFlags('we build software', { fluffPer1k: 5, concretePer1k: 5, words: 50 });
    expect(flags.map((f) => f.id)).toContain('no_named_customers');
  });

  it('does not fire density flag on substantive metrics', () => {
    const flags = deriveRedFlags('costs $29, 12 integrations', { fluffPer1k: 2, concretePer1k: 40, words: 50 });
    expect(flags.map((f) => f.id)).not.toContain('high_buzzword_density');
  });

  it('does not fire no_named_customers when a named org is present', () => {
    const flags = deriveRedFlags('used by Acme Corp today', { fluffPer1k: 2, concretePer1k: 40, words: 50 });
    expect(flags.map((f) => f.id)).not.toContain('no_named_customers');
  });
});
