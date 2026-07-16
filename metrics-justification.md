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

## M4 — TL;DR quality *(LLM layer — now carries the substance verdict)*

**Claim under test:** the LLM's `tldr` is both accurate and actually jargon-free, and its `explainsWhatItDoes` judgment matches a human's.

- **Metric:** fraction of the 20 golden pages where the `tldr` is **both** (a) accurate — human yes/no that it matches what the company does — **and** (b) jargon-free — contains **zero** terms from the M2 buzzword lexicon (automatable check). Secondary: `explainsWhatItDoes` agreement with the human 1–3 label (labels 1 → false, 3 → true).
- **Target & citation:** ≥ **80%** both-true. Grounded in plain-language practice — copy a non-expert understands, per the [US federal Plain Language guidelines (plainlanguage.gov)](https://www.plainlanguage.gov/guidelines/). The jargon-free half is measured mechanically against the same cited buzzword set as M2, so only accuracy is human-judged.
- **Note:** since M1 killed the deterministic substance score, M4 is now the metric that validates the *substance verdict* — it is the wedge's correctness check, not just a nicety. Runnable once a free engine (Nano or Groq) is enabled.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | ≥ 80% both-true | Ship the prose layer. |
| 🔧 **Iterate** | 60–80% | **Lever:** prompt engineering (constrain output, ban buzzword list, few-shot with good/bad examples). Re-measure. |
| ⛔ **Kill (prose only)** | < 60% | Disable the prose layer by default; **rules layer still ships** (it never depended on the LLM). The product degrades to score + flags + decodes, which is still ahead of incumbents. |

---

---

## M5 — Brief usefulness *(the v0.4 VC gate)*

**Claim under test:** the brief tells a VC something true and useful they'd otherwise open ten tabs for.

- **Metric:** on 10 known companies — (a) **founders correct** (human yes/no), (b) **every external claim carries ≥1 source link** (auto-checkable: `sources.length > 0`), (c) **legitimacy age within ±1yr** of a manual WHOIS check.
- **Targets:** founders ≥ **80%** correct · sourcing **100%** · age accurate ≥ **90%**.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | founders ≥80% + 100% sourced | Ship the brief. |
| 🔧 **Iterate** | founders 60–80% | **Lever:** scope the query to the domain (`site:`/company+domain) instead of the bare name — the observed failure is same-name conflation across companies. |
| ⛔ **Kill (founders only)** | < 60% correct | Hide the founders section by default; the rest of the brief still ships. A confidently wrong founder is worse than no founder. |

**Known failures already logged (2026-07-13 first live run):**
- *Same-name conflation* — "Matt Rosen, Founder & CEO of **Allata**" surfaced as Altagic's CEO. The founders query uses the bare company name, so a same-named exec elsewhere wins. → the M5 iterate lever.
- *Previous-owner history* — Wayback said stripe.com was "online since 1996" (a prior owner's parked page). Cross-check `onlineSinceYear` against `registeredYear` and suppress/flag when it precedes registration.
- *RDAP gaps* — some domains (stripe.com) return no registration event, leaving age blank.

---

## M6 — Funding & traction accuracy

**Claim under test:** the funding line is right often enough for a VC to trust it at a glance — and says "none found" instead of inventing a round.

- **Metric:** on 10 companies (`eval/m6-funding.ts`, run `npm run eval:m6`) — (a) latest round/stage or status correct, (b) 100% sourced.
- **Targets:** ≥ **80%** correct · **100%** sourced.
- **The negative cases carry the weight:** Plausible is bootstrapped, Ghost is a non-profit, Cloudflare is public. Inventing a Series A for a bootstrapped company is the failure that embarrasses a VC in a partner meeting — "none found" must be a confident answer, not silence.

| Band | Condition | Action |
|---|---|---|
| ✅ **Pass** | ≥80% correct + 100% sourced | Ship the section. |
| 🔧 **Iterate** | 60–80% | **Lever:** tighten the query / bias toward crunchbase-class sources. |
| ⛔ **Kill** | <60% | Hide the funding section; the rest of the brief still ships. |

### M6 result (2026-07-13): ⚠️ ITERATE — 70%, shipped with a known defect

Two iterations, both short of the 80% gate. **The failures are systematic, not noise:**

| Case | Answer | Reality |
|---|---|---|
| plausible.io | "VC-backed private, latest round…" | **bootstrapped** (and this *regressed* — run 1 got it right) |
| cloudflare.com | "VC-backed private, last funded 2019 $150M" | **public, NYSE: NET** (2019 was the IPO) |
| figma.com | "private company with a market cap of $11.2B" | **public** (a market cap for a private company is incoherent) |

**Root cause:** the answer engine has a strong prior — *company → VC-backed private → here's the latest round* — so it fails exactly where the *absence* of VC funding is the story. Score is 6/6 on VC-backed private startups, 0/3 on public/bootstrapped.

**The "authoritative sources" lever backfired:** Crunchbase-class sources are *databases of funded companies*, so pointing at them made it **more** likely to invent a round for a bootstrapped company.

**`verified` does not catch this.** It answers "is this about the right company?", not "is this claim true?" — all three failures returned `verified: true`. Right company, wrong fact, no warning.

**Untried lever (next session):** decompose the question — a narrow "is X public/bootstrapped/acquired?" first, then round details only if private. Different mechanism, not more prompt-fiddling. If that doesn't clear 80%, hide the section.

**M5 result (2026-07-13): PASS — 10/10 founders correct, 0 confidently-wrong.** The domain-anchored query fixed the same-name conflation (the Allata bug). Honest caveat: the eval counts a hit if *any* expected founder name appears, so partial errors pass (Linear returned "Jori Timonen" for co-founder Jori Lallo). It proves *right company, right lead founder* — not every co-founder detail.

## Why these (post-pivot)

- ~~**M1**~~ — killed 2026-07-12; substance is a semantic judgment, not a regex signal. The verdict moved to the LLM (M4).
- **M2** tests the *coverage* (we catch the jargon that exists) — carries the deterministic wedge now.
- **M3** tests the *brand* (deterministic, reliable — buzzword load + flags can't hallucinate).
- **M4** tests the *substance verdict* (the LLM's TL;DR + "does it say what it does"), with a kill band that still leaves a shippable rules-only product.

The golden set is built once and reused for M4 and the engine fixtures.
