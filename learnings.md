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

## Process

- The market-report gate paid off: the "simplify text" space is crowded with stale, generic, selection-based tools — the wedge had to be "substance vs vapor for due diligence," not "make text simpler," or this would have been competitor #47.
