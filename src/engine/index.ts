import { findMatches } from '../lexicon';
import { wordCount, concreteCount } from './signals';
import { deriveRedFlags } from './flags';
import type { ScoreResult, DetectedClaim } from './types';

export * from './types';

// Below this word count a page has too little text to score honestly → null ("no signal").
const WORD_FLOOR = 25;
// Pseudo-count strength for the neutral (0.5) prior: on sparse pages the score regresses
// toward 50 instead of snapping to 0/100; on text-rich pages the prior is negligible.
const SMOOTHING = 2;

export function score(text: string): ScoreResult {
  const words = wordCount(text);
  const matches = findMatches(text);
  const fluffRaw = matches.reduce((s, m) => s + m.entry.weight, 0);
  const concreteRaw = concreteCount(text);

  const per1k = (n: number): number => (words === 0 ? 0 : (n / words) * 1000);
  const fluffPer1k = per1k(fluffRaw);
  const concretePer1k = per1k(concreteRaw);

  const substancePct =
    words < WORD_FLOOR
      ? null
      : Math.round((100 * (concreteRaw + SMOOTHING * 0.5)) / (concreteRaw + fluffRaw + SMOOTHING));

  const claims: DetectedClaim[] = matches.map((m) => ({
    text: text.slice(m.span[0], m.span[1]),
    span: m.span,
    plain: m.entry.plain,
    empty: m.entry.empty,
  }));

  const redFlags = deriveRedFlags(text, { fluffPer1k, concretePer1k, words });
  return { substancePct, fluffPer1k, concretePer1k, words, claims, redFlags };
}
