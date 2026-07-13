export interface Enrichment {
  tldr: string; // one plain sentence: what they actually do, zero buzzwords
  explainsWhatItDoes: boolean; // did the PAGE concretely say what they do, or just hype?
  audience: string | null; // who it's for, if stated
}

export interface LlmAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  enrich(mainText: string): Promise<Enrichment>;
}

export async function selectAdapter(candidates: LlmAdapter[]): Promise<LlmAdapter | null> {
  for (const a of candidates) {
    if (await a.isAvailable()) return a;
  }
  return null;
}

// JSON schema shared by Nano's `responseConstraint` and Groq's `response_format`.
export const ENRICH_SCHEMA = {
  type: 'object',
  required: ['tldr', 'explainsWhatItDoes', 'audience'],
  additionalProperties: false,
  properties: {
    tldr: { type: 'string' },
    explainsWhatItDoes: { type: 'boolean' },
    audience: { type: ['string', 'null'] },
  },
} as const;

export const SYSTEM =
  'You do due-diligence triage. Given a company web page, reply ONLY with JSON matching this shape: ' +
  '{"tldr": string, "explainsWhatItDoes": boolean, "audience": string | null}. ' +
  'tldr: one plain sentence a normal person understands, saying what the company actually does — ' +
  'strip ALL marketing jargon, no buzzwords. explainsWhatItDoes: true only if the page concretely says ' +
  'what they do (not just hype). audience: who it is for if stated, else null.';

export function parseEnrichment(raw: unknown): Enrichment {
  if (typeof raw !== 'string') throw new Error('enrichment: expected a JSON string');
  // Free/open models sometimes wrap JSON in ```json fences or add prose — extract the object.
  const stripped = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  const json = start !== -1 && end !== -1 ? stripped.slice(start, end + 1) : stripped;
  const obj = JSON.parse(json) as Record<string, unknown>;
  if (typeof obj.tldr !== 'string' || obj.tldr.trim() === '') throw new Error('enrichment: bad tldr');
  if (typeof obj.explainsWhatItDoes !== 'boolean') throw new Error('enrichment: bad explainsWhatItDoes');
  const audience = obj.audience == null ? null : String(obj.audience);
  return { tldr: obj.tldr.trim(), explainsWhatItDoes: obj.explainsWhatItDoes, audience };
}
