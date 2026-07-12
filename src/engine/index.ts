import { findMatches } from '../lexicon';
import { wordCount, concreteCount } from './signals';
import { deriveRedFlags } from './flags';
import type { ScoreResult, DetectedClaim } from './types';

export * from './types';

// Below this word count a page has too little text to judge → null ("no signal").
const WORD_FLOOR = 25;
// Weighted-buzzword-per-1k-words thresholds for the coarse load band.
// (Replaces the retired substance% — see metrics-justification.md M1 KILL.)
const HIGH = 20;
const MEDIUM = 6;

export function score(text: string): ScoreResult {
  const words = wordCount(text);
  const matches = findMatches(text);
  const fluffRaw = matches.reduce((s, m) => s + m.entry.weight, 0);
  const concreteRaw = concreteCount(text); // used only for the no-numbers red flag

  const per1k = (n: number): number => (words === 0 ? 0 : (n / words) * 1000);
  const fluffPer1k = per1k(fluffRaw);
  const concretePer1k = per1k(concreteRaw);

  const buzzwordLoad: ScoreResult['buzzwordLoad'] =
    words < WORD_FLOOR ? null : fluffPer1k >= HIGH ? 'high' : fluffPer1k >= MEDIUM ? 'medium' : 'low';

  const claims: DetectedClaim[] = matches.map((m) => ({
    text: text.slice(m.span[0], m.span[1]),
    span: m.span,
    plain: m.entry.plain,
    empty: m.entry.empty,
  }));

  const redFlags = deriveRedFlags(text, { fluffPer1k, concretePer1k, words });
  return { buzzwordLoad, fluffPer1k, words, claims, redFlags };
}
