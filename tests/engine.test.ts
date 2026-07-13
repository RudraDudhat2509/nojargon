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
  it('flags heavy buzzword copy as high load', () => {
    expect(score(FLUFF).buzzwordLoad).toBe('high');
  });

  it('flags concrete dev copy as low load', () => {
    expect(score(SUBSTANCE).buzzwordLoad).toBe('low');
  });

  it('returns null load when there is essentially no text', () => {
    expect(score('the and of to a').buzzwordLoad).toBeNull();
  });

  it('is deterministic across 100 runs (M3)', () => {
    const runs = Array.from({ length: 100 }, () => score(FLUFF).buzzwordLoad);
    expect(new Set(runs).size).toBe(1);
  });

  it('surfaces detected buzzwords as claims', () => {
    expect(score(FLUFF).claims.some((c) => c.text === 'seamless')).toBe(true);
  });
});
