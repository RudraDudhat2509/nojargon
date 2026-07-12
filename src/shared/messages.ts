import type { ScoreResult } from '../engine/types';
import type { Enrichment } from '../llm/adapter';

export type ExtractRequest = { type: 'extract' };

export type ExtractResponse =
  | { type: 'extracted'; mainText: string; result: ScoreResult }
  | { type: 'no-content' };

export type EnrichRequest = { type: 'enrich'; mainText: string };

export type EnrichResponse = { type: 'enriched'; enrichment: Enrichment } | { type: 'no-llm' };
