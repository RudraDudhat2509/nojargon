import { Readability } from '@mozilla/readability';
import { score } from '../engine';
import type { ExtractResponse } from '../shared/messages';

const THIN = 200; // chars below which Readability likely under-extracted a visual/hero page

// Non-product blocks that pollute the score (analyst citations, event banners, promos).
const NOISE = /magic quadrant|gartner|omdia|forrester|that'?s a wrap|keynote|register now|apply now|get up to \$|in credits|©\s*\d{4}/i;

// Visible copy fallback: concatenate heading/paragraph/list text in document order,
// skipping citation/event/promo blocks that aren't the product description.
function headingsAndParagraphs(doc: Document): string {
  const nodes = doc.querySelectorAll('h1, h2, h3, p, li');
  const parts: string[] = [];
  nodes.forEach((n) => {
    const t = (n.textContent ?? '').trim();
    if (t && !NOISE.test(t)) parts.push(t);
  });
  return parts.join('\n');
}

export function extractMain(doc: Document): string | null {
  const clone = doc.cloneNode(true) as Document;
  const parsed = new Readability(clone, { charThreshold: 50 }).parse();
  let text = (parsed?.textContent ?? '').trim();
  const fallback = headingsAndParagraphs(doc).trim(); // noise-filtered visible copy

  if (NOISE.test(text)) {
    // Readability grabbed a citation/event/promo block — prefer the filtered visible copy.
    text = fallback;
  } else if (text.length < THIN && fallback.length > text.length) {
    // Hero/landing pages: Readability finds little article text; the jargon lives in headings.
    text = fallback;
  }
  return text.length >= 40 ? text : null;
}

// Chrome runtime wiring (not exercised in unit tests).
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'extract') return;
    const text = extractMain(document);
    const res: ExtractResponse =
      text === null
        ? { type: 'no-content' }
        : { type: 'extracted', mainText: text, result: score(text) };
    sendResponse(res);
    return true;
  });
}
