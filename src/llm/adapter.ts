import type { DetectedClaim, Label } from '../engine/types';

export interface LlmAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  enrich(
    mainText: string,
    claims: DetectedClaim[],
  ): Promise<{ whatTheyDo: string; claimLabels: Record<number, Label> }>;
}

export async function selectAdapter(candidates: LlmAdapter[]): Promise<LlmAdapter | null> {
  for (const a of candidates) {
    if (await a.isAvailable()) return a;
  }
  return null;
}

export const PROMPT = (mainText: string): string =>
  `In two plain sentences, say what this company actually does. Ban these words: ` +
  `cutting-edge, seamless, synergy, leverage, best-in-class, world-class, next-generation, ` +
  `robust, scalable, innovative, holistic, ecosystem, empower, unlock, streamline, ` +
  `transformative, revolutionary, disruptive. If you cannot tell what they do, say so.\n\n${mainText.slice(0, 4000)}`;
