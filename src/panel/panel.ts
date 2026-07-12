import type { ScoreResult } from '../engine/types';
import type { EnrichResponse, ExtractResponse } from '../shared/messages';

function el(doc: Document, tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const node = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export function renderResult(root: HTMLElement, r: ScoreResult): void {
  const doc = root.ownerDocument;
  root.innerHTML = '';

  const pct = r.substancePct;
  const meter = el(doc, 'div', { 'data-testid': 'meter', class: 'meter' });
  meter.textContent = pct === null ? 'No signal on this page' : `Substance ${pct}%  ·  Vapor ${100 - pct}%`;
  root.appendChild(meter);

  if (r.redFlags.length) {
    const flags = el(doc, 'ul', { class: 'flags' });
    for (const f of r.redFlags) {
      const li = el(doc, 'li');
      li.textContent = `🚩 ${f.message}`;
      flags.appendChild(li);
    }
    root.appendChild(flags);
  }

  if (r.claims.length) {
    const list = el(doc, 'ul', { class: 'claims' });
    for (const c of r.claims) {
      const li = el(doc, 'li');
      li.textContent = `${c.text} → ${c.plain}`;
      if (c.empty) li.classList.add('empty');
      list.appendChild(li);
    }
    root.appendChild(list);
  }
}

export function renderEnrichment(root: HTMLElement, res: EnrichResponse): void {
  const doc = root.ownerDocument;
  const box = el(doc, 'section', { class: 'prose' });
  if (res.type === 'enriched') {
    const h = el(doc, 'h2');
    h.textContent = 'What they actually do';
    const p = el(doc, 'p');
    p.textContent = res.whatTheyDo;
    box.append(h, p);
  } else {
    const p = el(doc, 'p', { class: 'cta' });
    p.textContent =
      'Add a Claude key for the plain-English rewrite. The substance score and red flags above work without it.';
    box.appendChild(p);
  }
  root.prepend(box);
}

async function run(): Promise<void> {
  const doc = globalThis.document;
  const root = doc.getElementById('root') as HTMLElement;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const extracted = (await chrome.tabs.sendMessage(tab!.id!, { type: 'extract' })) as ExtractResponse;
  if (extracted.type === 'no-content') {
    root.textContent = 'No company copy found on this page.';
    return;
  }
  renderResult(root, extracted.result);
  const enrich = (await chrome.runtime.sendMessage({
    type: 'enrich',
    mainText: extracted.mainText,
    claims: extracted.result.claims,
  })) as EnrichResponse;
  renderEnrichment(root, enrich);
}

if (typeof chrome !== 'undefined' && chrome.tabs) {
  run().catch((e) => console.error(e));
}
