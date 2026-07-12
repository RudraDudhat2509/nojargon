import { describe, it, expect } from 'vitest';
import { score } from '../src/engine';

const FLUFF =
  'Nexus is a cutting-edge, AI-native platform that leverages next-generation ' +
  'intelligence to deliver seamless, end-to-end automation. Best-in-class, world-class synergy ' +
  'to unlock operational excellence and future-proof your digital transformation.';

const SUBSTANCE =
  'Nexus connects Shopify and Gmail. It syncs orders every 5 minutes, costs $29 ' +
  'per month, and is used by Acme Corp and Bluebird Ltd. It supports 12 integrations and a REST API.';

describe('engine', () => {
  it('scores fluff low and substance high (validity direction)', () => {
    expect(score(FLUFF).substancePct!).toBeLessThan(score(SUBSTANCE).substancePct!);
  });

  it('returns null when there is no signal', () => {
    expect(score('the and of to a').substancePct).toBeNull();
  });

  it('is deterministic across 100 runs (M3)', () => {
    const runs = Array.from({ length: 100 }, () => score(FLUFF).substancePct);
    expect(new Set(runs).size).toBe(1);
  });

  it('surfaces detected buzzwords as claims', () => {
    expect(score(FLUFF).claims.some((c) => c.text === 'seamless')).toBe(true);
  });

  it('does not snap to a hard 100 on a page with few signals and no buzzwords', () => {
    const s = score(
      'We process payments for online businesses. It costs $29 per month and moves money ' +
        'quickly between accounts for small teams that sell products on the internet.',
    );
    expect(s.substancePct!).toBeLessThan(95); // smoothed, not a raw 100
  });

  it('pulls a low-signal page toward neutral rather than null', () => {
    const s = score(
      'We help teams do great work together every single day of the week, and we care ' +
        'about the people we work with and how they feel about the things they make.',
    );
    expect(s.substancePct).not.toBeNull();
    expect(s.substancePct!).toBeGreaterThan(30);
    expect(s.substancePct!).toBeLessThan(70);
  });
});
