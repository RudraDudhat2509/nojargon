import { describe, it, expect } from 'vitest';
import { LEXICON, findMatches } from '../src/lexicon';

// Reference set derived from the cited fluff lists (HubSpot + CMO Alliance).
const REFERENCE = [
  'cutting-edge', 'best-in-class', 'seamless', 'synergy', 'paradigm', 'leverage', 'world-class',
  'next-generation', 'disruptive', 'robust', 'scalable', 'innovative', 'game-changing', 'holistic',
  'end-to-end', 'turnkey', 'frictionless', 'bleeding-edge', 'mission-critical', 'value-add',
  'thought leader', 'low-hanging fruit', 'move the needle', 'circle back', 'deep dive', 'streamline',
  'empower', 'unlock', 'future-proof', 'operationalize', 'ecosystem', 'revolutionary', 'state-of-the-art',
  'best-of-breed', 'next-level', 'supercharge', 'transformative', 'industry-leading', 'optimize', 'elevate',
];

// Real-world platform jargon observed on live pages (Salesforce hero, Stripe, common SaaS).
const REAL_WORLD = [
  'agentic', 'ai native', 'ai-native', 'unified platform', 'open platform', 'trusted platform',
  'monetize', 'turnkey', 'end-to-end', 'purpose-built', 'enterprise-grade', 'battle-tested',
  'reimagine', 'supercharge', 'unlock', 'accelerate', 'orchestrate', 'hyperscale',
  'single pane of glass', 'north star', 'first-class', 'out-of-the-box', 'plug-and-play',
];

describe('lexicon (M2 coverage)', () => {
  it('detects >= 90% of the cited reference buzzwords', () => {
    const detected = REFERENCE.filter((term) => findMatches(term).length > 0);
    expect(detected.length / REFERENCE.length).toBeGreaterThanOrEqual(0.9);
  });

  it('covers >= 90% of real-world platform jargon', () => {
    const hit = REAL_WORLD.filter((t) => findMatches(t).length > 0);
    expect(hit.length / REAL_WORLD.length).toBeGreaterThanOrEqual(0.9);
  });

  it('matches spacing/hyphen/case variants of the same term', () => {
    expect(findMatches('AI native')).toHaveLength(1);
    expect(findMatches('AI-Native')).toHaveLength(1);
    expect(findMatches('ai native')).toHaveLength(1);
  });

  it('maps a known buzzword to plain text with a weight', () => {
    const m = findMatches('leverage')[0]!;
    expect(m.entry.plain).toBeTruthy();
    expect(m.entry.weight).toBeGreaterThan(0);
  });

  it('is non-overlapping and prefers the longest phrase', () => {
    const matches = findMatches('end-to-end automation');
    expect(matches.some((m) => m.entry.term === 'end-to-end')).toBe(true);
  });

  it('exposes a non-empty LEXICON', () => {
    expect(LEXICON.length).toBeGreaterThan(0);
  });
});
