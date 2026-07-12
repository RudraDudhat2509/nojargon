import { DATA } from './data';

export interface LexEntry {
  term: string;
  plain: string;
  weight: number;
  empty: boolean;
}

export const LEXICON: LexEntry[] = DATA;

// Longest terms first so multiword phrases win over their sub-words.
const SORTED = [...LEXICON].sort((a, b) => b.term.length - a.term.length);

const isWordChar = (c: string | undefined): boolean => c !== undefined && /[a-z0-9]/.test(c);

export function findMatches(text: string): { entry: LexEntry; span: [number, number] }[] {
  const lower = text.toLowerCase();
  const taken: boolean[] = new Array(lower.length).fill(false);
  const out: { entry: LexEntry; span: [number, number] }[] = [];

  for (const entry of SORTED) {
    let from = 0;
    for (;;) {
      const i = lower.indexOf(entry.term, from);
      if (i === -1) break;
      const end = i + entry.term.length;
      const boundaryOk = !isWordChar(lower[i - 1]) && !isWordChar(lower[end]);
      const free = !taken.slice(i, end).some(Boolean);
      if (boundaryOk && free) {
        for (let k = i; k < end; k++) taken[k] = true;
        out.push({ entry, span: [i, end] });
      }
      from = end;
    }
  }

  return out.sort((a, b) => a.span[0] - b.span[0]);
}
