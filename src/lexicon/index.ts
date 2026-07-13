import { DATA } from './data';

export interface LexEntry {
  term: string;
  plain: string;
  weight: number;
  empty: boolean;
}

export const LEXICON: LexEntry[] = DATA;

const normalizeTerm = (t: string): string => t.toLowerCase().replace(/[-\s]+/g, ' ').trim();

// Precompute normalized forms, longest first so multiword phrases win over sub-words.
const SORTED = LEXICON.map((e) => ({ entry: e, norm: normalizeTerm(e.term) })).sort(
  (a, b) => b.norm.length - a.norm.length,
);

const isWordChar = (c: string | undefined): boolean => c !== undefined && /[a-z0-9]/.test(c);

// Build a normalized (lowercased, hyphen/space runs → single space) view of the text,
// plus a map from each normalized-char index back to its original-string index.
function normalizeText(text: string): { norm: string; map: number[] } {
  const lower = text.toLowerCase();
  let norm = '';
  const map: number[] = [];
  let j = 0;
  while (j < lower.length) {
    const c = lower[j]!;
    if (/[-\s]/.test(c)) {
      if (norm.length > 0 && norm[norm.length - 1] !== ' ') {
        norm += ' ';
        map.push(j);
      }
      while (j < lower.length && /[-\s]/.test(lower[j]!)) j++;
      continue;
    }
    norm += c;
    map.push(j);
    j++;
  }
  return { norm, map };
}

export function findMatches(text: string): { entry: LexEntry; span: [number, number] }[] {
  const { norm, map } = normalizeText(text);
  const taken: boolean[] = new Array(norm.length).fill(false);
  const out: { entry: LexEntry; span: [number, number] }[] = [];

  for (const { entry, norm: term } of SORTED) {
    if (term.length === 0) continue;
    let from = 0;
    for (;;) {
      const i = norm.indexOf(term, from);
      if (i === -1) break;
      const end = i + term.length;
      const boundaryOk = !isWordChar(norm[i - 1]) && !isWordChar(norm[end]);
      const free = !taken.slice(i, end).some(Boolean);
      if (boundaryOk && free) {
        for (let k = i; k < end; k++) taken[k] = true;
        const origStart = map[i]!;
        const origEnd = map[end - 1]! + 1;
        out.push({ entry, span: [origStart, origEnd] });
      }
      from = end;
    }
  }

  return out.sort((a, b) => a.span[0] - b.span[0]);
}
