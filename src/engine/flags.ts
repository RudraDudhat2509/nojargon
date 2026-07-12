import type { RedFlag } from './types';

// fluff points per 1k words above which copy reads as buzzword-heavy.
// Calibrated against the M1 golden set (see metrics-justification.md).
const DENSITY_THRESHOLD = 20;

export function deriveRedFlags(
  text: string,
  m: { fluffPer1k: number; concretePer1k: number; words: number },
): RedFlag[] {
  const flags: RedFlag[] = [];

  if (m.fluffPer1k >= DENSITY_THRESHOLD) {
    flags.push({ id: 'high_buzzword_density', message: 'Heavy on buzzwords relative to concrete detail.' });
  }
  if (m.concretePer1k === 0) {
    flags.push({ id: 'no_numbers_or_specs', message: 'No numbers, prices, or technical specifics found.' });
  }
  if (!/\b[A-Z][a-z]+ (?:Inc|Ltd|LLC|Corp|GmbH|Co)\b/.test(text) && !/\bcustomers?\b/i.test(text)) {
    flags.push({ id: 'no_named_customers', message: 'No named customers or case studies.' });
  }

  return flags;
}
