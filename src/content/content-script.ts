import { Readability } from '@mozilla/readability';
import { score } from '../engine';
import type { ExtractResponse } from '../shared/messages';

export function extractMain(doc: Document): string | null {
  const clone = doc.cloneNode(true) as Document;
  const parsed = new Readability(clone, { charThreshold: 50 }).parse();
  const text = (parsed?.textContent ?? '').trim();
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
