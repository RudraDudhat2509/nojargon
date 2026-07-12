import { findMatches } from '../lexicon';
import { wordCount, concreteCount } from './signals';
import { deriveRedFlags } from './flags';
import type { ScoreResult, DetectedClaim } from './types';

export * from './types';

export function score(text: string): ScoreResult {
  const words = wordCount(text);
  const matches = findMatches(text);
  const fluffRaw = matches.reduce((s, m) => s + m.entry.weight, 0);
  const concreteRaw = concreteCount(text);

  const per1k = (n: number): number => (words === 0 ? 0 : (n / words) * 1000);
  const fluffPer1k = per1k(fluffRaw);
  const concretePer1k = per1k(concreteRaw);

  const denom = fluffPer1k + concretePer1k;
  const substancePct = denom === 0 ? null : Math.round((100 * concretePer1k) / denom);

  const claims: DetectedClaim[] = matches.map((m) => ({
    text: text.slice(m.span[0], m.span[1]),
    span: m.span,
    plain: m.entry.plain,
    empty: m.entry.empty,
  }));

  const redFlags = deriveRedFlags(text, { fluffPer1k, concretePer1k, words });
  return { substancePct, fluffPer1k, concretePer1k, words, claims, redFlags };
}
