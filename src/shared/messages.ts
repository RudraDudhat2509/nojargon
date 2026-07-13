import type { Enrichment } from '../llm/adapter';

export type EnrichRequest = { type: 'enrich'; mainText: string };

export type EnrichResponse = { type: 'enriched'; enrichment: Enrichment } | { type: 'no-llm' };
