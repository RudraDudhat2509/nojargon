import type { LlmAdapter } from './adapter';
import { SYSTEM, ENRICH_SCHEMA, parseEnrichment } from './adapter';

// Chrome's on-device Prompt API (Gemini Nano) — not in @types/chrome.
declare const LanguageModel:
  | {
      availability(): Promise<string>;
      create(o?: unknown): Promise<{ prompt(s: string, o?: unknown): Promise<string> }>;
    }
  | undefined;

export const NanoAdapter: LlmAdapter = {
  name: 'nano',
  async isAvailable() {
    try {
      return typeof LanguageModel !== 'undefined' && (await LanguageModel.availability()) === 'available';
    } catch {
      return false;
    }
  },
  async enrich(mainText) {
    const session = await LanguageModel!.create({
      initialPrompts: [{ role: 'system', content: SYSTEM }],
    });
    const raw = await session.prompt(mainText.slice(0, 4000), { responseConstraint: ENRICH_SCHEMA });
    return parseEnrichment(raw);
  },
};
