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
  buzzwordLoad: 'high' | 'medium' | 'low' | null;
  fluffPer1k: number;
  words: number;
  claims: DetectedClaim[];
  redFlags: RedFlag[];
}
