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
  `You are helping someone do due diligence on a company. Read the page text below and explain, ` +
  `in 2-3 plain sentences a normal person understands: (1) what this company actually does, ` +
  `(2) who it is for, and (3) how it makes money if that is stated. ` +
  `Strip ALL marketing jargon — no buzzwords, no hype, just the concrete reality. ` +
  `Ban these words entirely: cutting-edge, seamless, synergy, leverage, best-in-class, world-class, ` +
  `next-generation, robust, scalable, innovative, holistic, ecosystem, empower, unlock, streamline, ` +
  `transformative, revolutionary, disruptive, agentic, platform. ` +
  `If the page genuinely does not say what they do, say exactly that — do not guess.\n\n${mainText.slice(0, 4000)}`;
