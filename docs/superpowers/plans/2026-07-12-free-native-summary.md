# No-Jargon — Free/Native Summary (v0.3) Implementation Plan

> Decisions (2026-07-12, with Rudra):
> - **Output = Fused TL;DR + reality check** — one bold plain-English line the LLM writes, then a scannable "reality check" list that *fuses* the LLM's read with our deterministic red flags + fluff %. Not a generic paragraph.
> - **Engine = Nano → Groq → rules.** On-device Gemini Nano first (free, private, zero key, zero setup). Free Groq API as fallback for weak hardware (free key, no card). Rules-only floor. **No paid key anywhere in the default path** — the paid Claude adapter is removed.
>
> Why not a blob: the LLM returns *structured fields* (Chrome Prompt API `responseConstraint`), so it fills slots grounded in our deterministic signals and can't wander into slop.

**Goal:** A due-diligence summary that is free for everyone, native/on-device where possible, and structurally distinct from generic AI-summary tools — a TL;DR line fused with the substance/flag signals we already compute.

**Branch:** `development`. Identity: `Rudra Dudhat <contact.rdudhat@gmail.com>`. No AI-attribution.

## Research basis (cited)
- Chrome Prompt API (Gemini Nano) is stable Chrome 138+, on-device, no key, structured output via `responseConstraint` — https://developer.chrome.com/docs/ai/prompt-api and https://developer.chrome.com/docs/ai/summarizer-api
- Groq free tier is genuinely free (no card; ~30 RPM / ~14.4k req/day); OpenAI-compatible endpoint; **current free model `openai/gpt-oss-20b`** (llama-3.3-70b is deprecated) — https://console.groq.com/docs/models , https://tokenmix.ai/blog/groq-free-tier-limits-2026
- xAI Grok has **no** free API tier (paid/prepaid only) — https://x.ai/api — so "grok" is out; Groq is the free option.

## Global constraints (carried)
- `engine` + `lexicon` stay pure; M3 determinism = 0 variance must hold.
- Nothing deterministic may depend on the LLM. The reality-check list must still render (minus the LLM line) when no engine is available.
- Vitest; commit per task after tests pass.

---

## The LLM contract (shared by both adapters)

The LLM returns a small **structured** object — everything else in the card is deterministic:

```ts
// src/llm/adapter.ts
interface Enrichment {
  tldr: string;              // one plain sentence: what they actually do, zero buzzwords
  explainsWhatItDoes: boolean; // did the PAGE actually say what they do, or just hype?
  audience: string | null;   // who it's for, if stated
}
interface LlmAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  enrich(mainText: string): Promise<Enrichment>;
}
```

JSON schema used for both Nano `responseConstraint` and Groq `response_format`:

```ts
export const ENRICH_SCHEMA = {
  type: 'object',
  required: ['tldr', 'explainsWhatItDoes', 'audience'],
  additionalProperties: false,
  properties: {
    tldr: { type: 'string' },
    explainsWhatItDoes: { type: 'boolean' },
    audience: { type: ['string', 'null'] },
  },
} as const;

export const SYSTEM =
  'You do due-diligence triage. Given a company web page, reply ONLY with JSON matching the schema. ' +
  'tldr: one plain sentence a normal person understands, saying what the company actually does — ' +
  'strip ALL marketing jargon, no buzzwords. explainsWhatItDoes: true only if the page concretely says ' +
  'what they do (not just hype). audience: who it is for if stated, else null.';
```

---

## Task 1 — Adapter contract + Groq adapter (replaces Claude in the chain)

**Files:** `src/llm/adapter.ts` (new `Enrichment`, `ENRICH_SCHEMA`, `SYSTEM`, drop `PROMPT`), `src/llm/groq.ts` (new), delete `src/llm/claude.ts`, `tests/llm.test.ts` (update stub shape).

**Interfaces produced:** `LlmAdapter.enrich(mainText) → Enrichment`; `selectAdapter(candidates)` unchanged.

- [ ] **Step 1 — update stub + selection tests** to the new `enrich` shape (returns `Enrichment`). Run → fail.
- [ ] **Step 2 — rewrite `adapter.ts`** with `Enrichment`, `ENRICH_SCHEMA`, `SYSTEM`, `selectAdapter` (unchanged logic).
- [ ] **Step 3 — write `groq.ts`:**

```ts
import type { LlmAdapter, Enrichment } from './adapter';
import { SYSTEM } from './adapter';
async function getKey(): Promise<string | undefined> {
  try { return (await chrome.storage.local.get('groqKey')).groqKey as string | undefined; } catch { return undefined; }
}
export const GroqAdapter: LlmAdapter = {
  name: 'groq',
  async isAvailable() { return Boolean(await getKey()); },
  async enrich(mainText) {
    const key = await getKey();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key!}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        response_format: { type: 'json_object' },
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: mainText.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return parseEnrichment(data?.choices?.[0]?.message?.content);
  },
};
```

- [ ] **Step 4 — `parseEnrichment(raw)`** (shared helper in `adapter.ts`): `JSON.parse`, validate the three fields, coerce/throw on garbage. Unit-test it (valid → object; missing field → throws; non-JSON → throws).
- [ ] **Step 5 — delete `claude.ts`.** Run `tests/llm.test.ts` → PASS. Commit `feat(llm): structured Enrichment contract + free Groq adapter, drop paid Claude`.

---

## Task 2 — Nano adapter: structured on-device output

**Files:** `src/llm/nano.ts`, `tests/llm.test.ts` (parse path only; the Nano global isn't in jsdom).

- [ ] **Step 1 — rewrite `nano.ts`** to use `initialPrompts` (system) + `responseConstraint`:

```ts
declare const LanguageModel: { availability(): Promise<string>;
  create(o?: unknown): Promise<{ prompt(s: string, o?: unknown): Promise<string> }> } | undefined;
export const NanoAdapter: LlmAdapter = {
  name: 'nano',
  async isAvailable() {
    try { return typeof LanguageModel !== 'undefined' && (await LanguageModel.availability()) === 'available'; }
    catch { return false; }
  },
  async enrich(mainText) {
    const s = await LanguageModel!.create({ initialPrompts: [{ role: 'system', content: SYSTEM }] });
    const raw = await s.prompt(mainText.slice(0, 4000), { responseConstraint: ENRICH_SCHEMA });
    return parseEnrichment(raw);
  },
};
```

- [ ] **Step 2** — run tests (selection + parse) → PASS. Commit `feat(llm): Nano adapter returns structured enrichment via responseConstraint`.

---

## Task 3 — Background: chain = [Nano, Groq]

**Files:** `src/background/service-worker.ts`, `src/shared/messages.ts`, `tests/background.test.ts`.

- [ ] **Step 1 — messages:** `EnrichResponse` becomes `{ type:'enriched'; enrichment: Enrichment } | { type:'no-llm' }`.
- [ ] **Step 2 — `handleEnrich`** returns the `Enrichment` (keep the try/catch → `no-llm` degrade). Chain `[NanoAdapter, GroqAdapter]`.
- [ ] **Step 3** — update `background.test.ts` stub to the new shape; run → PASS. Commit `feat(background): Nano→Groq enrich chain`.

---

## Task 4 — Panel: Fused TL;DR + reality check

**Files:** `src/panel/panel.ts`, `src/panel/panel.css`, `tests/panel-degrade.test.ts`, new `tests/panel-reality.test.ts`.

The reality-check list **fuses** LLM + deterministic signals. `renderEnrichment` now needs the `ScoreResult` too.

- [ ] **Step 1 — failing test** (`panel-reality.test.ts`): given an `enriched` enrichment + a `ScoreResult` with `substancePct: 20` and a `no_named_customers` flag, the rendered card contains the TL;DR text, a "✗ no named customers" line, and an "80% marketing fluff" line.

- [ ] **Step 2 — implement `renderEnrichment(root, res, result)`:**

```ts
export function renderEnrichment(root: HTMLElement, res: EnrichResponse, result: ScoreResult): void {
  const doc = root.ownerDocument; root.querySelector('.prose')?.remove();
  const box = el(doc, 'section', { class: 'prose' });
  if (res.type === 'enriched') {
    const tldr = el(doc, 'p', { class: 'tldr' }); tldr.textContent = res.enrichment.tldr;
    box.append(el(doc, 'h2', {}, 'TL;DR'), tldr, el(doc, 'h2', {}, 'Reality check'));
    const ul = el(doc, 'ul', { class: 'reality' });
    // LLM-derived
    ul.append(bullet(doc, res.enrichment.explainsWhatItDoes ? 'ok' : 'bad',
      res.enrichment.explainsWhatItDoes ? 'clear what it does' : 'never actually says what it does'));
    // deterministic
    for (const f of result.redFlags) ul.append(bullet(doc, 'bad', f.message));
    if (result.substancePct != null) ul.append(bullet(doc, 'warn', `${100 - result.substancePct}% marketing fluff`));
    box.append(ul);
  } else {
    box.append(el(doc, 'p', { class: 'cta' },
      'Turn on the free summary: enable on-device AI (chrome://flags → Gemini Nano) or paste a free Groq key. Score + flags above work without it.'));
  }
  root.prepend(box);
}
```
(Add small `el(doc,tag,attrs,text?)` overload + a `bullet(doc, kind, text)` helper with ✓/✗/⚠ glyphs; CSS classes `.ok/.bad/.warn`.)

- [ ] **Step 3 — `run()`** passes `extracted.result` into `renderEnrichment`; keep `renderProseLoading`.
- [ ] **Step 4 — update `panel-degrade.test.ts`** for the new signature + the free-summary CTA copy.
- [ ] **Step 5 — CSS:** style `.tldr` (bold, larger), `.reality` bullets, glyph colors (gold ✓, terracotta ✗, muted ⚠). Run panel tests → PASS. Commit `feat(panel): fused TL;DR + reality-check card`.

---

## Task 5 — Setup/UX for the free engines

**Files:** `README.md`, a short `src/panel/panel.ts` help link.

- [ ] Document both free paths: (a) **Nano** — `chrome://flags` enable "Prompt API for Gemini Nano" + on-device model, restart, ~4GB download (22GB disk); (b) **Groq** — free key from console.groq.com (no card), `chrome.storage.local.set({groqKey:'gsk_...'})`. Note the paid Claude path is gone.
- [ ] Commit `docs: free/native summary setup (Nano + Groq)`.

---

## Task 6 — M4 metric (rewrite quality), re-scoped

**Files:** `metrics-justification.md`, `eval/` optional helper.

- [ ] Redefine **M4**: on the 20-page golden set, fraction where the `tldr` is (a) accurate (human yes/no) AND (b) buzzword-free (auto-check: contains 0 terms from the lexicon). Target ≥ 80% ([plainlanguage.gov](https://www.plainlanguage.gov/guidelines/)). Kill band <60% → hide TL;DR by default, reality-check + score still ship.
- [ ] Runnable once an engine is enabled: script prompts each golden page, checks buzzword-free automatically, prints the accurate-count worksheet for Rudra to fill. Commit `docs+eval: M4 rewrite-quality harness`.

---

## Self-review + finish
- Full suite green → `code-review` on the diff → push (updates PR #1). Update `changelog.md` + `learnings.md`.

## Success criteria
The summary renders as a **TL;DR + fused reality-check card** (not a generic paragraph), powered with **no paid key** — Nano on capable machines, free Groq otherwise, graceful rules-only degrade — and **M4 ≥ 80%** buzzword-free + accurate on the golden set.
