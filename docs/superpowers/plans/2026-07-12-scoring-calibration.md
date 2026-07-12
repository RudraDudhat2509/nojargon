# No-Jargon — Scoring Calibration (v0.2) Implementation Plan

> Iteration on the shipped v0.1 engine, directed by two live failures observed on 2026-07-12:
> - Salesforce "Headless 360" (jargon-drenched) → **"No signal"**, 0 buzzwords caught.
> - Stripe → **100% substance** (ceiling-clustering).
>
> Root causes: (1) lexicon too small + exact-match, (2) Readability under-extracts visual hero pages, (3) score snaps to 0/100/null on short text. These are M1's named iterate levers.

**Goal:** Make the substance score a believable *spread* (not bimodal), catch real-world platform jargon, and score visual landing pages instead of returning "no signal" — then validate against a human-labeled golden set (M1, ρ ≥ 0.70).

**Branch:** `development`. Git identity: `Rudra Dudhat <contact.rdudhat@gmail.com>`. No AI-attribution on commits.

## Global constraints (carried from v0.1)

- `engine` + `lexicon` stay pure (no DOM/network/Date/random) — M3 determinism = 0 variance must still hold.
- Nothing deterministic may depend on the LLM.
- Vitest; commit per task after tests pass.

---

## Task A — Lexicon: expand + normalize matching

**Files:** `src/lexicon/data.ts` (add entries), `src/lexicon/index.ts` (normalize), `tests/lexicon.test.ts` (new coverage set).

**Problem:** "AI native", "agentic", "unified platform", "monetize", "build, scale" were all missed — the list is 45 exact-match terms; real jargon uses spacing/casing variants and words we never catalogued.

- [ ] **Step 1 — failing test:** add a REAL_WORLD reference set (from the two live pages + common platform-speak) and assert ≥ 90% coverage.

```ts
const REAL_WORLD = [
  'agentic', 'ai native', 'ai-native', 'unified platform', 'open platform', 'trusted platform',
  'monetize', 'turnkey', 'end-to-end', 'purpose-built', 'enterprise-grade', 'battle-tested',
  'reimagine', 'supercharge', 'unlock', 'accelerate', 'orchestrate', 'hyperscale',
  'single pane of glass', 'north star', 'first-class', 'out-of-the-box', 'plug-and-play',
];
it('covers >= 90% of real-world platform jargon', () => {
  const hit = REAL_WORLD.filter((t) => findMatches(t).length > 0);
  expect(hit.length / REAL_WORLD.length).toBeGreaterThanOrEqual(0.9);
});
```

- [ ] **Step 2 — normalize matching** in `findMatches`: match on a normalized form where runs of space/hyphen collapse to a single space, so `"AI native"`, `"AI-Native"`, `"ai native"` all match the entry `"ai native"`. Keep the span mapping back to the original text. Store lexicon terms in normalized (lowercased, single-spaced) form.

- [ ] **Step 3 — add entries** to `data.ts` for every REAL_WORLD term not already covered, each with a plain mapping + weight + `empty` flag (empty-filler → weight 2; jargon-with-meaning → weight 1–1.5).

- [ ] **Step 4:** `npx vitest run tests/lexicon.test.ts` → PASS (both the original M2 set and the new real-world set).
- [ ] **Step 5:** commit `feat(lexicon): expand + normalize matching for real-world jargon`.

---

## Task B — Extraction fallback for thin/visual pages

**Files:** `src/content/content-script.ts`, `tests/content.test.ts`.

**Problem:** Readability returned near-empty text on the Salesforce hero page → `null`. The pages that most need judging extract worst.

- [ ] **Step 1 — failing test:** a hero-style fixture (short `<article>`, lots of `<h1>/<h2>/<p>` in the body) where Readability yields < 200 chars, and `extractMain` must still return the heading/paragraph text.

```ts
it('falls back to visible headings/paragraphs when Readability is thin', () => {
  const { document } = parseHTML(`<html><body>
    <h1>Build your Agentic Enterprise on a trusted, open, unified platform</h1>
    <p>Turn ideas into a business. Build, scale and monetize on an AI native foundation.</p>
  </body></html>`);
  const text = extractMain(document as unknown as Document);
  expect(text).toContain('Agentic Enterprise');
});
```

- [ ] **Step 2 — implement fallback:** if `Readability(...).parse()?.textContent` trimmed is shorter than `THIN = 200`, collect `innerText`-equivalent from `h1,h2,h3,p,li` in document order and use that instead. Keep the `>= 40` floor for the final null decision.

- [ ] **Step 3:** `npx vitest run tests/content.test.ts` → PASS (article case + empty case + thin-fallback case).
- [ ] **Step 4:** commit `feat(content): fall back to headings/paragraphs on thin extraction`.

---

## Task C — Low-word smoothing prior in the score

**Files:** `src/engine/index.ts`, `src/engine/types.ts` (unchanged shape), `tests/engine.test.ts`.

**Problem:** On short text both counts are tiny, so `concrete/(concrete+fluff)` snaps to 0/100/null. Add pseudo-counts so sparse pages regress toward a neutral 50 instead of the extremes; long pages are unaffected.

- [ ] **Step 1 — failing tests:** encode the new behavior.

```ts
it('does not snap to 100 on a page with one concrete signal and no buzzwords', () => {
  const s = score('We process payments. It costs money and moves fast for teams.');
  expect(s.substancePct!).toBeLessThan(95); // smoothed, not a hard 100
});
it('pulls a low-signal page toward neutral rather than null', () => {
  const s = score('We help teams do great work together every single day of the week.');
  expect(s.substancePct).not.toBeNull();
  expect(s.substancePct!).toBeGreaterThan(30);
  expect(s.substancePct!).toBeLessThan(70);
});
it('still returns null when there is essentially no text', () => {
  expect(score('the and of to a').substancePct).toBeNull(); // words < WORD_FLOOR
});
```

- [ ] **Step 2 — implement:** work on raw counts with a smoothing constant `A` and neutral prior `P0 = 0.5`; keep a hard `WORD_FLOOR` below which the page is genuinely unscoreable.

```ts
const WORD_FLOOR = 25;
const A = 2; // pseudo-count strength
// ...
if (words < WORD_FLOOR) substancePct = null;
else substancePct = Math.round((100 * (concreteRaw + A * 0.5)) / (concreteRaw + fluffRaw + A));
```

(Keep `fluffPer1k`/`concretePer1k` on the result for the red-flag thresholds; only the final % uses the smoothed raw form.)

- [ ] **Step 3:** update the existing engine assertions that assumed hard 0/100 (fluff still < substance; determinism 100-run test unchanged); run `npx vitest run tests/engine.test.ts tests/flags.test.ts` → PASS.
- [ ] **Step 4:** commit `feat(engine): low-word smoothing prior so scores spread instead of clustering`.

---

## Task D — Live re-check + M1 validation (the gate)

**Files:** `golden/labels.json` (Rudra), no code.

- [ ] **Step 1 — rebuild + reload:** `npm run build`, reload the unpacked extension, re-open the Salesforce hero page and Stripe. Expected: Salesforce now shows a **low** substance score with buzzwords decoded (not "no signal"); Stripe lands **high but < 100**. Eyeball a couple more.
- [ ] **Step 2 — re-extract golden set** (lexicon/extraction changed the text pipeline): `npm run golden:extract`.
- [ ] **Step 3 — Rudra labels** each of the 20 pages in `golden/labels.json` as `1` (fluff) / `2` (mixed) / `3` (substance).
- [ ] **Step 4 — measure M1:** `npm run eval:m1` → read ρ and the band.
  - **PASS (ρ ≥ 0.70):** freeze weights; update `metrics-justification.md` + README with the number; done.
  - **ITERATE (0.50–0.70):** adjust lexicon weights + `A` + concrete-signal detectors; re-run. Log each attempt.
  - **KILL (< 0.50):** stop — the deterministic-meter premise doesn't hold on real pages; reconsider the score model (raise with Rudra before more tuning).
- [ ] **Step 5:** commit `docs: record M1 result + calibrated weights`; update `changelog.md`.

---

## Self-review + finish

- Run full suite (`npm test`), self-review the diff with `code-review`, then update the PR (`git push`) — the open PR #1 picks up the new commits.

## Success criteria

The two live pages no longer cluster (Salesforce low, Stripe high-but-not-100), the lexicon covers real platform jargon, and **M1 ρ ≥ 0.70 on the human-labeled golden set** — or a logged, evidence-based decision to iterate/kill.
