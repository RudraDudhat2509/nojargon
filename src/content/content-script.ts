import { Readability } from '@mozilla/readability';
import { score } from '../engine';
import type { ExtractResponse } from '../shared/messages';

const THIN = 200; // chars below which Readability likely under-extracted a visual/hero page

// Visible copy fallback: concatenate heading/paragraph/list text in document order.
function headingsAndParagraphs(doc: Document): string {
  const nodes = doc.querySelectorAll('h1, h2, h3, p, li');
  const parts: string[] = [];
  nodes.forEach((n) => {
    const t = (n.textContent ?? '').trim();
    if (t) parts.push(t);
  });
  return parts.join('\n');
}

export function extractMain(doc: Document): string | null {
  const clone = doc.cloneNode(true) as Document;
  const parsed = new Readability(clone, { charThreshold: 50 }).parse();
  let text = (parsed?.textContent ?? '').trim();
  if (text.length < THIN) {
    // Hero/landing pages: Readability finds little "article" text, but the jargon
    // lives in headings and short paragraphs. Fall back to those.
    const fallback = headingsAndParagraphs(doc).trim();
    if (fallback.length > text.length) text = fallback;
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
