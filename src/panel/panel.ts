import { score } from '../engine';
import type { ScoreResult } from '../engine/types';
import type { EnrichResponse } from '../shared/messages';

// Runs IN the page via chrome.scripting.executeScript — must be fully self-contained
// (no imports, no outer-scope references). Grabs visible product copy, skipping
// analyst-citation / event-banner / promo noise; falls back to body text.
function grabText(): string {
  const NOISE =
    /magic quadrant|gartner|omdia|forrester|that'?s a wrap|keynote|register now|apply now|get up to \$|in credits|©\s*\d{4}/i;
  const parts: string[] = [];
  document.querySelectorAll('h1, h2, h3, p, li').forEach((n) => {
    const el = n as HTMLElement;
    // Skip hidden nav/mega-menus so buzzwords aren't counted many times.
    const visible = typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.getClientRects().length > 0;
    if (!visible) return;
    const t = (n.textContent || '').trim();
    if (t && !NOISE.test(t)) parts.push(t);
  });
  let text = parts.join('\n').trim();
  if (text.length < 40) text = (document.body?.innerText || '').trim();
  return text.length >= 40 ? text : '';
}

function el(doc: Document, tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const node = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

const GLYPH: Record<string, string> = { ok: '✓', bad: '✗', warn: '⚠' };

function bullet(doc: Document, kind: 'ok' | 'bad' | 'warn', text: string): HTMLElement {
  return el(doc, 'li', { class: `rc ${kind}` }, `${GLYPH[kind]} ${text}`);
}

// Deterministic "translations" section: each detected buzzword → its plain meaning.
export function renderResult(root: HTMLElement, r: ScoreResult): void {
  const doc = root.ownerDocument;
  root.innerHTML = '';
  if (r.claims.length) {
    root.appendChild(el(doc, 'h2', {}, 'Buzzwords decoded'));
    const list = el(doc, 'ul', { class: 'claims' });
    for (const c of r.claims) {
      const li = el(doc, 'li', {}, `${c.text} → ${c.plain}`);
      if (c.empty) li.classList.add('empty');
      list.appendChild(li);
    }
    root.appendChild(list);
  }
}

export function renderProseLoading(root: HTMLElement): void {
  const doc = root.ownerDocument;
  root.querySelector('.prose')?.remove();
  const box = el(doc, 'section', { class: 'prose loading' });
  box.append(el(doc, 'h2', {}, 'TL;DR'), el(doc, 'p', { class: 'cta' }, 'Reading the page…'));
  root.prepend(box);
}

// The fused card: LLM TL;DR (when available) + a reality check that combines the
// LLM's read with our deterministic red flags and buzzword load.
export function renderEnrichment(root: HTMLElement, res: EnrichResponse, result: ScoreResult): void {
  const doc = root.ownerDocument;
  root.querySelector('.prose')?.remove();
  const box = el(doc, 'section', { class: 'prose' });

  if (res.type === 'enriched') {
    box.append(el(doc, 'h2', {}, 'TL;DR'), el(doc, 'p', { class: 'tldr' }, res.enrichment.tldr));
    if (res.enrichment.audience) box.append(el(doc, 'p', { class: 'audience' }, `For: ${res.enrichment.audience}`));
  } else {
    box.append(
      el(doc, 'p', { class: 'cta' },
        'Turn on the free summary: enable on-device AI (chrome://flags → Gemini Nano) or add a free Groq key. The reality check below works without it.'),
    );
  }

  box.append(el(doc, 'h2', {}, 'Reality check'));
  const ul = el(doc, 'ul', { class: 'reality' });
  if (res.type === 'enriched') {
    ul.append(
      res.enrichment.explainsWhatItDoes
        ? bullet(doc, 'ok', 'clearly says what it does')
        : bullet(doc, 'bad', 'never actually says what it does'),
    );
  }
  for (const f of result.redFlags) ul.append(bullet(doc, 'bad', f.message));
  if (result.buzzwordLoad) ul.append(bullet(doc, 'warn', `buzzword load: ${result.buzzwordLoad} (${result.claims.length} found)`));
  box.append(ul);

  root.prepend(box);
}

async function run(): Promise<void> {
  const doc = globalThis.document;
  const root = doc.getElementById('root') as HTMLElement;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    root.textContent = 'No active tab.';
    return;
  }

  let mainText = '';
  try {
    const [inj] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: grabText });
    mainText = (inj?.result as string) ?? '';
  } catch {
    root.textContent = "Can't read this page (browser/system pages are off-limits).";
    return;
  }
  if (!mainText) {
    root.textContent = 'No company copy found on this page.';
    return;
  }

  const result = score(mainText);
  renderResult(root, result);
  renderProseLoading(root);
  const enrich = (await chrome.runtime.sendMessage({ type: 'enrich', mainText })) as EnrichResponse;
  renderEnrichment(root, enrich, result);
}

if (typeof chrome !== 'undefined' && chrome.tabs) {
  run().catch((e) => console.error(e));
}
