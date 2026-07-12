# Metrics Justification — No-Jargon

**Status:** Awaiting approval (build-project HARD GATE before writing-plans)
**Date:** 2026-07-12

Each metric below is falsifiable, has a live citation for its target, and three outcome bands: **pass** / **iterate (with a named lever)** / **kill**. No target number is invented — every threshold links a source.

---

## The shared golden set

One artifact underpins every metric: a **golden set of 20 real, live company/product pages**, DOM-extracted, hand-labeled by Rudra into three substance buckets:

- `1` = fluff-heavy (buzzwords, no concrete "what/for whom")
- `2` = mixed
- `3` = substantive (specs, numbers, named customers, clear function)

Target composition: ~7 / ~6 / ~7 across buckets so the set spans the range. This same set seeds the `engine` unit-test fixtures (design §7). Pages and labels are stored in `golden/` as `{url, label, extracted_text}`.

---

## M1 — Substance score validity — ⛔ KILLED 2026-07-12

**Claim under test (RETIRED):** the deterministic `substancePct` agrees with human judgment of fluff-vs-substance.

- **Result:** Spearman ρ = **0.227** on the 20-page golden set → **KILL band**. Component analysis: `ρ(concrete-signal, label) = -0.09` (noise — fires on event banners / analyst citations, misses technical substance), `ρ(-fluff-density, label) = 0.28` (weak). See `learnings.md` → "M1 KILL".
- **Why it's retired, not iterated:** "substance" is a *semantic* judgment (does the page concretely say what the product does). Regex counts of numbers/buzzwords are the wrong *kind* of signal; tuning weights can't fix that. Per the pre-registered kill band, we stop and reconsider rather than tune.
- **Decision:** the deterministic layer no longer emits a substance **percentage**. It emits **decoded buzzwords + red flags + a coarse `buzzwordLoad` (high/med/low)** — all reliable. The substance verdict ("do they actually say what they do") moves to the LLM (`explainsWhatItDoes`, validated under M4). The deterministic wedge is now "can't hallucinate the buzzword list or the flags," validated by M2.

> Superseded by the v0.3 plan (`docs/superpowers/plans/2026-07-12-free-native-summary.md`). `buzzwordLoad` is a deterministic function of buzzword density; its determinism is covered by M3. Its *usefulness* is covered by M2 (does it catch the buzzwords) rather than a correlation target, because we no longer claim it measures "substance."

---

## M2 — Buzzword detection coverage

**Claim under test:** the lexicon actually catches the buzzwords real copy uses.

- **Metric:** fraction of a canonical buzzword reference set that the lexicon detects (case- and inflection-insensitive).
- **Reference set & citation:** the union of two published corporate-fluff lists — [HubSpot, "Fluffy buzzwords marketers overuse"](https://blog.hubspot.com/blog/tabid/6307/bid/31068/31-fluffy-buzzwords-marketers-overuse-and-abuse.aspx) and [CMO Alliance, "Stop using these 90 promotional words"](https://www.cmoalliance.com/stop-using-these-90-promotional-words/). These lists *are* the ground truth for "known buzzword."
- **Target:** ≥ **90%** coverage of the reference set.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | ≥ 90% | Ship lexicon. |
| 🔧 **Iterate** | 75–90% | **Lever:** add the missing entries + plain mappings (pure data work). Re-measure. |
| ⛔ **Kill** | < 75% | Only if the approach itself is wrong; realistically this is data entry, so a miss means the lexicon is incomplete, not the concept broken. |

---

## M3 — Score determinism *(the reliability invariant)*

**Claim under test:** same page in → identical number out, always. This is the property that separates us from the "pure LLM rates it 62… then 71" incumbents.

- **Metric:** variance of `substancePct` across 100 repeated runs on each golden page.
- **Target & citation:** **0 variance / 100% identical.** Determinism is a definitional property of a pure function — [MDN, "Pure functions" (same inputs always produce same output, no side effects)](https://developer.mozilla.org/en-US/docs/Glossary/Pure_function). Anything nonzero is a defect, not a tuning target.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | variance = 0 on all pages | Invariant holds. |
| ⛔ **Fix (not iterate)** | any variance > 0 | A nondeterminism bug (unstable ordering, locale, Date, Math.random). Fix the source; there is no "acceptable" nonzero band. |

---

## M4 — Plain "what they do" rewrite quality *(LLM layer)*

**Claim under test:** the LLM prose is both accurate and actually jargon-free.

- **Metric:** fraction of the 20 golden pages where the `whatTheyDo` prose is **both** (a) accurate — human (Rudra) yes/no that it matches what the company does — **and** (b) jargon-free — contains **zero** terms from the M2 buzzword lexicon (automatable check).
- **Target & citation:** ≥ **80%**. Grounded in plain-language practice: the goal is copy a non-expert understands, per the [US federal Plain Language guidelines (plainlanguage.gov)](https://www.plainlanguage.gov/guidelines/). The jargon-free half is measured mechanically against the same cited buzzword set as M2, so only the accuracy half is human-judged.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | ≥ 80% both-true | Ship the prose layer. |
| 🔧 **Iterate** | 60–80% | **Lever:** prompt engineering (constrain output, ban buzzword list, few-shot with good/bad examples). Re-measure. |
| ⛔ **Kill (prose only)** | < 60% | Disable the prose layer by default; **rules layer still ships** (it never depended on the LLM). The product degrades to score + flags + decodes, which is still ahead of incumbents. |

---

## Why these four

- **M1** tests the *wedge* (substance-vs-vapor is real and correct).
- **M2** tests the *coverage* (we catch the jargon that exists).
- **M3** tests the *brand* (deterministic, reliable — the thing no incumbent has).
- **M4** tests the *LLM layer* independently, with a kill band that still leaves a shippable product.

Every threshold (0.70, 90%, 0-variance, 80%) links a live source. The golden set is built once and reused for M1, M3, M4 and the engine tests — no redundant labeling.
