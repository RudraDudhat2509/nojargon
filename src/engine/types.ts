export type Label = 'concrete' | 'vague' | 'unverifiable';

export interface DetectedClaim {
  text: string;
  span: [number, number];
  plain: string;
  empty: boolean;
  label?: Label;
}

export interface RedFlag {
  id: string;
  message: string;
}

export interface ScoreResult {
  substancePct: number | null;
  fluffPer1k: number;
  concretePer1k: number;
  words: number;
  claims: DetectedClaim[];
  redFlags: RedFlag[];
}
