import type { LlmAdapter } from './adapter';
import { PROMPT } from './adapter';

// Chrome's on-device Prompt API (Gemini Nano). Declared here since it is not in @types/chrome.
declare const LanguageModel:
  | { availability(): Promise<string>; create(): Promise<{ prompt(s: string): Promise<string> }> }
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
    const model = await LanguageModel!.create();
    const whatTheyDo = (await model.prompt(PROMPT(mainText))).trim();
    return { whatTheyDo, claimLabels: {} };
  },
};
