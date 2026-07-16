import { score } from '../engine';
import { domainOf, companyNameFrom } from '../receipts';
import type { ScoreResult } from '../engine/types';
import type { Source, Finding } from '../research/tavily';
import type { Brief } from '../shared/messages';

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

// The ✓/✕/! marker is drawn by CSS (::before), so the text stays clean and copyable.
function bullet(doc: Document, kind: 'ok' | 'bad' | 'warn', text: string): HTMLElement {
  return el(doc, 'li', { class: `rc ${kind}` }, text);
}

// In a due-diligence tool an unsourced external claim is worthless — but the links
// shouldn't crowd the read either. Collapsed by default, one click to open.
function sourceLinks(doc: Document, sources: Source[]): HTMLElement {
  const box = el(doc, 'details', { class: 'sources' });
  box.appendChild(el(doc, 'summary', {}, `${sources.length} source${sources.length === 1 ? '' : 's'}`));
  const ul = el(doc, 'ul');
  for (const s of sources) {
    const li = el(doc, 'li');
    li.appendChild(el(doc, 'a', { href: s.url, target: '_blank', rel: 'noreferrer' }, s.title));
    ul.appendChild(li);
  }
  box.appendChild(ul);
  return box;
}

function section(doc: Document, title: string): HTMLElement {
  const s = el(doc, 'section', { class: 'sec' });
  s.appendChild(el(doc, 'h2', {}, title));
  return s;
}

// A researched claim renders its answer, its sources, and — when no source
// actually corroborates *this* company — an explicit unverified warning.
// Naming the wrong CEO with confidence is worse than saying "unconfirmed".
function researchSection(doc: Document, title: string, f: Finding): HTMLElement {
  const s = section(doc, title);
  if (!f.verified) {
    s.appendChild(
      el(doc, 'p', { class: 'unverified' }, 'Unverified — no source clearly ties this to this company. Treat with suspicion.'),
    );
  }
  s.appendChild(el(doc, 'p', {}, f.answer));
  if (f.sources.length) s.appendChild(sourceLinks(doc, f.sources));
  return s;
}

export function renderBrief(root: HTMLElement, brief: Brief, r: ScoreResult): void {
  const doc = root.ownerDocument;
  root.innerHTML = '';
  if (brief.company) root.appendChild(el(doc, 'h1', { class: 'company' }, brief.company));

  // What they do (local page de-jargon)
  const what = section(doc, 'What they do');
  if (brief.whatTheyDo.type === 'enriched') {
    what.appendChild(el(doc, 'p', { class: 'tldr' }, brief.whatTheyDo.enrichment.tldr));
    const aud = brief.whatTheyDo.enrichment.audience;
    if (aud) what.appendChild(el(doc, 'p', { class: 'audience' }, `For: ${aud}`));
  } else {
    what.appendChild(
      el(doc, 'p', { class: 'cta' }, 'Add a free Groq key or enable on-device AI for the plain-English summary.'),
    );
  }
  root.appendChild(what);

  // Founders (research)
  if (brief.founders) root.appendChild(researchSection(doc, 'Founders', brief.founders));

  // Funding & traction (research)
  if (brief.funding) root.appendChild(researchSection(doc, 'Funding & traction', brief.funding));

  // Reputation (research)
  if (brief.reputation) root.appendChild(researchSection(doc, 'Reputation', brief.reputation));

  // Legitimacy (zero-key receipts)
  const rc = brief.receipts;
  if (rc && (rc.domainAgeYears != null || rc.onlineSinceYear != null)) {
    const s = section(doc, 'Legitimacy');
    const ul = el(doc, 'ul', { class: 'reality' });
    if (rc.domainAgeYears != null) {
      const young = rc.domainAgeYears < 1;
      ul.appendChild(
        bullet(doc, young ? 'bad' : 'ok', `Domain ${rc.domainAgeYears} yrs old (registered ${rc.registeredYear})`),
      );
    }
    if (rc.onlineSinceYear != null) ul.appendChild(bullet(doc, 'ok', `Online since ${rc.onlineSinceYear} (web archive)`));
    s.appendChild(ul);
    root.appendChild(s);
  }

  // Marketing honesty (local)
  const m = section(doc, 'Marketing honesty');
  const ul = el(doc, 'ul', { class: 'reality' });
  if (brief.whatTheyDo.type === 'enriched') {
    ul.appendChild(
      brief.whatTheyDo.enrichment.explainsWhatItDoes
        ? bullet(doc, 'ok', 'clearly says what it does')
        : bullet(doc, 'bad', 'never actually says what it does'),
    );
  }
  for (const f of r.redFlags) ul.appendChild(bullet(doc, 'bad', f.message));
  if (r.buzzwordLoad) ul.appendChild(bullet(doc, 'warn', `buzzword load: ${r.buzzwordLoad} (${r.claims.length} found)`));
  m.appendChild(ul);
  root.appendChild(m);

  // Decoded buzzwords
  if (r.claims.length) {
    const s = section(doc, 'Buzzwords decoded');
    const list = el(doc, 'ul', { class: 'claims' });
    for (const c of r.claims) {
      const li = el(doc, 'li', {}, `${c.text} → ${c.plain}`);
      if (c.empty) li.classList.add('empty');
      list.appendChild(li);
    }
    s.appendChild(list);
    root.appendChild(s);
  }
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

  const url = tab.url ?? '';
  const company = companyNameFrom(domainOf(url));
  root.textContent = `Looking up ${company || 'this company'}…`;

  const result = score(mainText);
  const brief = (await chrome.runtime.sendMessage({ type: 'brief', url, mainText })) as Brief;
  renderBrief(root, brief, result);
}

if (typeof chrome !== 'undefined' && chrome.tabs) {
  run().catch((e) => console.error(e));
}
