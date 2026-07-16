import type { Enrichment } from '../llm/adapter';
import type { Receipts } from '../receipts';
import type { Finding } from '../research/tavily';

export type EnrichRequest = { type: 'enrich'; mainText: string };

export type EnrichResponse = { type: 'enriched'; enrichment: Enrichment } | { type: 'no-llm' };

export type BriefRequest = { type: 'brief'; url: string; mainText: string };

// Every section is independent: a failure or missing key nulls that section only.
export interface Brief {
  company: string;
  whatTheyDo: EnrichResponse;
  receipts: Receipts | null;
  founders: Finding | null;
  reputation: Finding | null;
}
