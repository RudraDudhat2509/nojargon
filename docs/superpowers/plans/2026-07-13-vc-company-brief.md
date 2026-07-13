# No-Jargon — VC Company Brief (v0.4) Implementation Plan

> Vision (Rudra, 2026-07-13): **a de-jargonizer + full-context company brief for VCs.** Land on any company/startup site → get, in plain English, what a VC needs to triage: **what they do, who the founders are, reputation/reviews, legitimacy** — without reading marketing or opening ten tabs.
>
> Shift: from "summarize their page" → "answer the VC's due-diligence questions with independent signal + sources."

**Branch:** `development`. Identity: `Rudra Dudhat <contact.rdudhat@gmail.com>`. No AI-attribution.

## Research basis (verified)
- **Tavily** search API — `POST https://api.tavily.com/search`, `Authorization: Bearer tvly-…`; body `{query, search_depth, max_results, include_answer:true, include_domains?}`; response `{answer, results:[{title,url,content,score}]}`. **Free 1,000 searches/mo, no credit card** — https://docs.tavily.com/documentation/api-reference/endpoint/search , https://www.tavily.com/. (Brave killed its free tier Feb 2026.)
- **RDAP** (domain age, zero-key) — `GET https://rdap.org/domain/{domain}` → `events[]` with `eventAction:"registration"` → `eventDate`. Extension `fetch` bypasses CORS/bot-blocking via host permissions.
- **Wayback CDX** (web history, zero-key) — `GET https://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=1&sort=asc&fl=timestamp` → earliest snapshot timestamp.

## The brief (new card)
```
STRIPE · stripe.com
💡 What they do   Payment software + financial tools for online businesses.   (local)
👤 Founders       Patrick & John Collison.  [source]                          (Tavily)
💬 Reputation     Devs praise the API; common gripe is account freezes.  [links] (Tavily)
🧾 Legitimacy     ✓ Domain 15 yrs old (2010) · online since 2011               (RDAP+Wayback)
📣 Marketing      ⚠ buzzword load: medium — "orchestrate", "agentic" decoded   (local)
```

## Engines & keys (all free)
- **Local** (no key): page de-jargon TL;DR (Groq/Nano, already built) + buzzword decode.
- **Zero-key**: RDAP + Wayback legitimacy.
- **Tavily (one free key)**: founders + reputation answers with sources.

Privacy note (document honestly): legitimacy queries send only the domain you're already on. Founders/reputation send the company name to Tavily — that part leaves the device. Local layers stay local.

## Global constraints (carried)
- `engine` + `lexicon` stay pure (M3 determinism holds).
- Every external claim carries a source link; the brief degrades section-by-section (a failed search hides that section, never blanks the card).
- Vitest; commit per task.

---

## Task 1 — `receipts` module (zero-key legitimacy)

**Files:** `src/receipts/index.ts`, `tests/receipts.test.ts`.

**Produces:**
```ts
interface Receipts { domainAgeYears: number | null; registeredYear: number | null; onlineSinceYear: number | null; }
function domainOf(url: string): string;                 // hostname minus www.
function parseRdap(json: unknown): { registeredYear: number | null };  // pure
function parseCdx(json: unknown): { onlineSinceYear: number | null };  // pure
async function fetchReceipts(domain: string, now?: Date): Promise<Receipts>;  // does the fetches
```

- [ ] **Step 1 — failing tests** for the pure parsers + `domainOf`:

```ts
import { domainOf, parseRdap, parseCdx } from '../src/receipts';
it('extracts registration year from RDAP events', () => {
  expect(parseRdap({ events: [{ eventAction: 'registration', eventDate: '2010-03-25T00:00:00Z' }] }).registeredYear).toBe(2010);
});
it('extracts first-snapshot year from CDX rows', () => {
  expect(parseCdx([['timestamp'], ['20110107abc']]).onlineSinceYear).toBe(2011);
});
it('strips www and path from a URL', () => {
  expect(domainOf('https://www.stripe.com/in')).toBe('stripe.com');
});
```

- [ ] **Step 2 — implement** the pure parsers + `domainOf`; `fetchReceipts` calls RDAP + Wayback (Promise.all, each wrapped so one failure → null), computes `domainAgeYears` from `registeredYear` and `now`. Run → PASS. Commit `feat(receipts): zero-key domain age + web history`.

---

## Task 2 — `research` module (Tavily founders + reputation)

**Files:** `src/research/tavily.ts`, `tests/research.test.ts`.

**Produces:**
```ts
interface Finding { answer: string; sources: { title: string; url: string }[]; }
function parseTavily(json: unknown): Finding;                 // pure
async function ask(query: string, opts?: {includeDomains?: string[]}): Promise<Finding>;  // needs tavilyKey
async function founders(company: string): Promise<Finding>;   // ask("who founded/leads <company>…")
async function reputation(company: string): Promise<Finding>; // ask("<company> reviews complaints reputation", reddit/trustpilot/news)
```

- [ ] **Step 1 — failing test** for `parseTavily` (answer + top source links, capped at 3):

```ts
it('parses Tavily answer + sources', () => {
  const f = parseTavily({ answer: 'Founded by X and Y.', results: [{ title: 'About', url: 'https://a.com' }] });
  expect(f.answer).toBe('Founded by X and Y.');
  expect(f.sources[0].url).toBe('https://a.com');
});
```

- [ ] **Step 2 — implement** `parseTavily`, `ask` (POST to Tavily with `include_answer:true`, key from `chrome.storage.local.get('tavilyKey')`, throw on !ok), and the `founders`/`reputation` query builders (reputation uses `include_domains:['reddit.com','trustpilot.com','news.ycombinator.com']`). Run → PASS. Commit `feat(research): Tavily founders + reputation with sources`.

---

## Task 3 — Background: assemble the brief

**Files:** `src/shared/messages.ts`, `src/background/service-worker.ts`, `tests/background.test.ts`.

**Contract:** panel sends `{type:'brief', url, mainText}`; background returns a `Brief`:
```ts
interface Brief {
  whatTheyDo: EnrichResponse;   // existing local LLM (Groq/Nano) — page de-jargon
  receipts: Receipts | null;
  founders: Finding | null;
  reputation: Finding | null;
}
```

- [ ] **Step 1 — failing test** for `assembleBrief(url, mainText, deps)` where deps are injected (adapters, fetchReceipts, founders, reputation) — verify it fans out and that any one failing leaves its field `null` while others populate.
- [ ] **Step 2 — implement** `assembleBrief`: `domainOf(url)` → run `handleEnrich` (existing) + `fetchReceipts` + `founders` + `reputation` in parallel via `Promise.allSettled`; each rejection → `null`. Wire the `brief` message. Run → PASS. Commit `feat(background): assemble VC brief (local + receipts + research)`.

---

## Task 4 — Panel: the VC brief card

**Files:** `src/panel/panel.ts`, `src/panel/panel.css`, `tests/panel-brief.test.ts` (replaces panel-reality).

- [ ] **Step 1 — failing test** (`renderBrief(root, brief, score)`): given a Brief with founders + receipts + reputation, the card shows a "What they do" line, a "Founders" line with a source link, a "Reputation" line with links, "Domain 15 yrs old", and the buzzword load; a `null` section is omitted (not shown as empty).
- [ ] **Step 2 — implement** `renderBrief` with sections 💡 What they do / 👤 Founders / 💬 Reputation / 🧾 Legitimacy / 📣 Marketing. Each external section renders its `answer` + source `<a>` links; `null` sections are skipped. Keep `renderProseLoading` per-section ("Looking up founders…"). Progressive: render local + receipts first, fill research when it lands.
- [ ] **Step 3 — `run()`**: `grabText` (existing) → `score` (local, instant render) → send `brief` → `renderBrief`. Show per-section loading while research runs.
- [ ] **Step 4 — CSS** for sections + source links (small, gold). Run panel tests → PASS. Commit `feat(panel): VC company-brief card with sourced sections`.

---

## Task 5 — Setup, keys, docs

**Files:** `manifest.json` (host_permissions already `<all_urls>` — covers rdap.org / web.archive.org / api.tavily.com), `README.md`.

- [ ] Document the two free keys (Groq for page de-jargon, Tavily for founders/reputation — both free, no card), the zero-key legitimacy layer, and the honest privacy note (name leaves device for research). Commit `docs: VC brief setup + privacy`.

---

## Task 6 — Metric M5 (brief accuracy)

**Files:** `metrics-justification.md`.

- [ ] **M5 — brief usefulness:** on 10 known companies, (a) founders correct (human check), (b) every external claim carries ≥1 working source link (auto-check the array is non-empty), (c) legitimacy age within ±1yr of a manual WHOIS check. Target ≥ 80% founders correct + 100% sourced. Kill band: <60% founders correct → founders section is unreliable, hide it (rest still ships). This is the new "does it deliver VC value" gate.

---

## Self-review + finish
- Full suite green → `code-review` → push (updates PR #1). Update `changelog.md` + `learnings.md`.

## Success criteria
A VC lands on a company site and, in one panel, sees **what they do (plain), who the founders are (sourced), what people say (sourced), and how legit/established they are (domain age)** — free, degrading gracefully section-by-section, with every external claim linked to a source.
