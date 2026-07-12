# No-Jargon — Design

**Status:** Approved 2026-07-12
**Premise:** Approved via [market-report.md](./market-report.md). Wedge = an on-page, privacy-first **due-diligence lens** that says *"here's what this company actually does, and here's which claims are empty."* Not a generic text simplifier.

---

## 1. Product summary

A Manifest V3 browser extension. On any company page, the user clicks the toolbar icon and a **side panel** returns a due-diligence verdict:

- **What they actually do** — plain-English, jargon-stripped (LLM prose)
- **Substance vs Vapor** — a deterministic 0–100 score with a meter
- **Decoded claims** — each detected buzzword/claim → plain meaning + a label (`concrete` / `vague` / `unverifiable`)
- **Red flags** — rule-derived DD signals (no named customers, no specs, no numbers, high buzzword density)

Deterministic rules run **always**. The LLM prose layer is added when an engine is available, and its absence degrades gracefully — the score and flags never depend on it.

---

## 2. Scope

| In v1 | Deferred |
|---|---|
| DOM text extraction (current page) | OCR / screenshot input → **v2** |
| Side-panel verdict | Inline hover tooltips on jargon → **v1.1** |
| Deterministic score + red flags (always) | — |
| LLM prose via on-device Nano **or** user's Claude key | Hosted/cloud backend → **rejected, never** |

**Rejected approach — cloud backend.** A server that proxies the LLM would kill the privacy pitch, add hosting cost and an ops surface, and undercut the "AI reliability/security lens" that makes this project distinctive. The extension is fully client-side.

---

## 3. Architecture

Six units, each with one job, testable in isolation.

| Unit | Responsibility | Depends on | Pure? |
|---|---|---|---|
| `engine` | `score(text) → ScoreResult` — deterministic substance scoring + red-flag derivation | `lexicon` | ✅ no DOM, no network |
| `lexicon` | Curated buzzword → plain-English map + per-term weights (data) | — | ✅ data only |
| `content-script` | Extract main page copy (Mozilla Readability), run `engine`, return `{mainText, scoreResult}` to panel | `engine`, Readability | ❌ DOM |
| `side-panel` | Render the verdict UI; request LLM enrichment; degrade gracefully | messaging | ❌ UI |
| `background` (service worker) | Orchestrate LLM: select adapter (Nano → Claude key → none), relay messages | `llm` | ❌ |
| `llm` | Adapter interface + `NanoAdapter`, `ClaudeAdapter`: `(mainText, claims) → {whatTheyDo, claimLabels}` | Chrome AI API / fetch | ❌ |

### Module interfaces (contracts)

```ts
// engine
type Label = 'concrete' | 'vague' | 'unverifiable';
interface DetectedClaim { text: string; span: [number, number]; plain?: string; label?: Label; }
interface RedFlag { id: string; message: string; }
interface ScoreResult {
  substancePct: number;        // 0–100, deterministic
  fluffPer1k: number;
  concretePer1k: number;
  claims: DetectedClaim[];     // buzzword/claim spans + plain mapping from lexicon
  redFlags: RedFlag[];
}
function score(text: string): ScoreResult;

// llm adapter (both impls share this)
interface LlmAdapter {
  isAvailable(): Promise<boolean>;
  enrich(mainText: string, claims: DetectedClaim[]):
    Promise<{ whatTheyDo: string; claimLabels: Record<number, Label> }>;
}
```

---

## 4. The deterministic score (reliability core)

```
fluff_per_1k    = Σ(weightᵢ × buzzword_countᵢ) / words × 1000
concrete_per_1k = count({ numbers, currency/units, dates,
                          named orgs, named integrations/tech,
                          specs, quantified/verifiable claims }) / words × 1000
substancePct    = round( 100 × concrete_per_1k / (concrete_per_1k + fluff_per_1k) )
                  clamped to [0, 100]; if both terms 0 → null ("no signal")
```

- **Same input → same output.** Fully unit-testable. The LLM never computes or adjusts this number.
- **Weights** live in `lexicon` and are calibrated against a labeled golden set (defined in `metrics-justification.md`). Calibration is the metrics-gate deliverable, not a guess.
- **Red flags** are pure functions of the extracted text: `no_named_customers`, `no_numbers_or_specs`, `high_buzzword_density` (fluff_per_1k above threshold), `all_claims_unverifiable`.

The LLM's only jobs: write the `whatTheyDo` prose and assign each claim a `concrete/vague/unverifiable` label. If the LLM is absent, claims still show their lexicon plain-mapping without a label.

---

## 5. Data flow

```
user clicks toolbar icon
  → side panel opens
  → panel → content-script: "extract"
  → content-script: Readability(main) → engine.score(text)
  → content-script → panel: { mainText, scoreResult }
  → panel renders DETERMINISTIC parts immediately
        (substance meter, red flags, lexicon decodes)
  → panel → background: "enrich(mainText, claims)"
  → background: pick adapter (Nano.isAvailable ? Nano
                              : hasClaudeKey ? Claude
                              : none)
  → adapter.enrich(...) → { whatTheyDo, claimLabels }
  → background → panel: enrichment
  → panel fills in prose + claim labels
```

Deterministic-first render means the user sees a useful verdict even if the LLM is slow, downloading, or unavailable.

---

## 6. Error / degradation handling

| Condition | Behavior |
|---|---|
| No readable main copy (SPA/app page) | Panel: "No company copy found on this page." No score. |
| Nano unavailable **and** no Claude key | Hide `whatTheyDo` prose; show CTA "Add a Claude key for the plain rewrite." **Score + flags + decodes still render.** |
| Nano model downloading | Prose section shows a "model downloading…" state; deterministic parts already visible. |
| LLM error / timeout (>~15s) | Graceful degrade to rules-only; small "rewrite unavailable" note. |
| Claude key invalid | Inline error on the key field; rules-only otherwise. |

The invariant: **nothing deterministic ever depends on the LLM.**

---

## 7. Testing

| Target | Test |
|---|---|
| `engine` | Unit tests: pure-fluff fixture → low %, spec/number-heavy fixture → high %, empty → null. These fixtures **seed the golden set** for the metrics gate. |
| `lexicon` | Known buzzwords map to expected plain text; weights present. |
| Red flags | Each flag fires on a crafted positive and stays off on a negative. |
| `llm` adapters | Mocked; `isAvailable` gating verified; `enrich` shape verified. |
| Integration | One fixture HTML page → content-script → panel message round-trip (smoke). |

Framework: **Vitest**. Extension e2e is out of scope for v1 unit coverage; a manual load-unpacked check covers the wiring.

---

## 8. Stack

- **Manifest V3**, **TypeScript**
- **Vite** + web-extension plugin (build/bundle)
- **Vanilla TS + CSS** side panel — one view, tiny bundle. Cinematic-dark aesthetic. No React in v1 (easy swap later).
- **@mozilla/readability** — main-content extraction
- **chrome.sidePanel**, **chrome.storage.local** (Claude key), **chrome.runtime** messaging
- On-device LLM via the **Prompt API** (`LanguageModel`), Claude via `fetch` to the Anthropic API
- **Vitest** — tests

---

## 9. Open item for the metrics gate

The score weights and the `high_buzzword_density` threshold are **not yet fixed** — they are the deliverable of `metrics-justification.md`, calibrated against a small labeled golden set of real company pages (some fluffy, some substantive). The gate defines: the target metric, its citation, and pass / iterate / kill bands.
