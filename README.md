# No-Jargon

An on-page **due-diligence lens** for your browser. Click the icon on any company page and a side panel tells you **what they actually do**, scores **substance vs vapor**, decodes the buzzwords, and flags the red flags.

Not another text simplifier. The question it answers isn't "can you make this sentence simpler" — it's **"is there anything real underneath the marketing?"**

## Why

The "simplify text" shelf is full but stale, generic, and selection-based. The "summarize this page" shelf condenses vapor into polished vapor. The good plain-rewrite tools are legal-docs only. Nobody sits where this does: an on-page lens that judges whether a company's claims are substance or fluff. See [`market-report.md`](./market-report.md) for the full competitive research.

## How it works

```
click icon → side panel → content script extracts the page's main copy (Readability)
           → engine.score(text)  [deterministic — runs always]
           → panel renders substance meter + red flags + decoded claims
           → background picks an LLM (on-device Nano → your Claude key → none)
           → panel fills in the plain "what they actually do" rewrite
```

**The substance score is deterministic.** Same page in → same number out, every time — it is never produced by the LLM:

```
fluff    = Σ(weight × buzzword_count) per 1000 words
concrete = count of {numbers, prices, dates, named orgs, tech specifics} per 1000 words
substance% = round(100 × concrete / (concrete + fluff))
```

This is the reliability point: the meter can't hallucinate. The LLM only writes the prose rewrite and labels each claim.

## Privacy

Fully client-side. No backend, ever. The plain-English rewrite runs on **Chrome's on-device Gemini Nano** (no data leaves your machine) or, if your hardware can't run it, on **your own Claude API key** stored in `chrome.storage.local`. If neither is present, the score, flags, and buzzword decodes still work — only the prose rewrite is hidden.

## Install (unpacked)

```bash
npm install
npm run build         # outputs dist/
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load unpacked** → select `dist/`. Open a company page and click the No-Jargon icon.

To use the Claude fallback, set a key from the extension's DevTools console:
```js
chrome.storage.local.set({ claudeKey: 'sk-ant-...' })
```

## Metrics

Success is measured, not asserted — see [`metrics-justification.md`](./metrics-justification.md) for the cited targets and pass/iterate/kill bands.

| Metric | What | Target | Status |
|---|---|---|---|
| **M2** Buzzword coverage | % of published fluff lists detected | ≥ 90% | ✅ 100% (40/40) |
| **M3** Determinism | score variance over 100 runs | 0 | ✅ 0 |
| **M1** Score validity | Spearman ρ(score, human label) on 20 real pages | ≥ 0.70 | ⏳ pending labels — run `npm run eval:m1` |
| **M4** Rewrite quality | % accurate + buzzword-free prose | ≥ 80% | ⏳ pending |

**M1 calibration:** `npm run golden:extract` fetches the 20 pages in `golden/urls.json`; label each in `golden/labels.json` as `1` (fluff) / `2` (mixed) / `3` (substance); `npm run eval:m1` prints ρ and the band. Current weights show ceiling-clustering on short pages — the M1 iterate lever (add concrete-signal detectors / low-word smoothing) is the next calibration step.

## Develop

```bash
npm test              # Vitest — 26 tests
npm run dev           # vite build --watch
```

## Roadmap

- v1.1 — inline hover tooltips on detected jargon (in-page, not just the panel)
- v2 — OCR input for PDFs and images (DOM-only today)
