import type { ScoreResult, DetectedClaim, Label } from '../engine/types';

export type ExtractRequest = { type: 'extract' };

export type ExtractResponse =
  | { type: 'extracted'; mainText: string; result: ScoreResult }
  | { type: 'no-content' };

export type EnrichRequest = { type: 'enrich'; mainText: string; claims: DetectedClaim[] };

export type EnrichResponse =
  | { type: 'enriched'; whatTheyDo: string; claimLabels: Record<number, Label> }
  | { type: 'no-llm' };
