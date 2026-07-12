# Learnings

Rejected approaches and wrong assumptions, kept so we don't relitigate them.

## Rejected by design

- **OCR / screenshot input in v1** — the due-diligence use case is ~95% web pages, where DOM reading is free, accurate, and instant. OCR adds a heavy, error-prone dependency for the 5% (PDFs/images) case. Documented as v2, not v1.
- **Cloud/hosted backend** — would kill the privacy pitch, add hosting cost + an ops surface, and undercut the exact "AI reliability/security lens" that makes this project distinctive. The extension is fully client-side.
- **Pure-LLM substance score** — non-reproducible and untestable; a hallucinated number would undercut the whole DD-trust wedge. The score is a deterministic function; the LLM only writes prose and labels.

## Discovered during build

- **Score ceiling-clustering on short pages** — on real, short landing-page extracts (Twilio, Notion, Datadog) the score saturates at 100% because they carry a couple concrete signals and zero *catalogued* buzzwords in a small amount of extracted text. Buzzword-heavy enterprise pages (Salesforce/Oracle/SAP) correctly land 40–70%. The synthetic extremes (0% / 100%) separate perfectly. This is a calibration issue, not a broken premise — it is exactly what the M1 gate is meant to surface, and it maps to M1's named iterate lever (add more concrete-signal detectors, and/or a low-word-count smoothing prior). Do not "fix" it before the golden set is human-labeled; calibration is the M1 deliverable.
- **Readability charThreshold** — @mozilla/readability defaults to a 500-char threshold and returns `null` for short articles. Set `charThreshold: 50` so short-but-real company copy still extracts.
- **linkedom in tests** — render helpers must use `root.ownerDocument.createElement`, not a global `document`, so the pure render functions work under linkedom without a jsdom environment.

## M1 KILL — the deterministic "substance %" premise failed (2026-07-12)

Labeled the 20-page golden set (rubric 1/2/3) and ran M1. **Spearman ρ = 0.227 → KILL band.** Diagnosis with the data:

- `rho(concrete-signal, label) = -0.09` — the concrete detector is **noise**. It fired hardest on an *event banner* (Datadog, concrete 136 → score 88) and *analyst-citation footnotes* (Twilio, concrete 159 → score 96), and **missed technical substance** (MongoDB/Supabase name "vector search, Kafka, Edge Functions" — nouns, not numbers → scored 46/50 despite being label-3).
- `rho(-fluff-density, label) = 0.28` — buzzword density is weakly right-direction but nowhere near 0.70.

**Root cause (conceptual, not a tuning miss):** "substance" is a *semantic* judgment — does the page concretely say what the product does and for whom. Regexes counting numbers/buzzwords are weak proxies for it; no weight-tuning fixes the wrong *kind* of signal.

**Decision (with Rudra):** retire the deterministic substance **percentage**. Reposition the deterministic layer to what it measures reliably — **buzzword detection/decoding (M2 = 100%) + red flags + a coarse "buzzword load: high/med/low"**. Move the substance verdict to the free on-device LLM (`explainsWhatItDoes`). This is more honest and fits the v0.3 fused-card. The "can't hallucinate the number" wedge narrows to "can't hallucinate the buzzword list and flags."

**Also found:** 3/20 pages (Datadog, Twilio, Render) extracted a promo banner / citation footer instead of product copy → extraction needs to prefer main product sections and skip event/citation/promo blocks.

**Methodology caveat:** these labels were assigned by Claude (self-labeled) after seeing the scores, so ρ is a sanity check, not independent validation — but the ρ is so low and the failure modes so concrete that the conclusion holds regardless.

## Process

- The market-report gate paid off: the "simplify text" space is crowded with stale, generic, selection-based tools — the wedge had to be "substance vs vapor for due diligence," not "make text simpler," or this would have been competitor #47.
