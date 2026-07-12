# No-Jargon

A bullshit detector for company websites. Click the icon on any company page and a side panel tells you — in plain English — **what they actually do**, whether they even *say* what they do, and where they're blowing smoke. Free, private, and it doesn't make things up.

Not another AI summarizer. The question it answers isn't "can you shorten this" — it's **"is there anything real underneath the marketing?"**

## What you get

A single card:

```
TL;DR
They automate busywork by wiring your apps together.
For: small teams

Reality check
  ✓ clearly says what it does        ← the AI's read
  ✗ no named customers                ← deterministic flag
  ✗ no pricing shown                  ← deterministic flag
  ⚠ buzzword load: high (14 found)    ← deterministic

Buzzwords decoded
  cutting-edge → new
  orchestrate → coordinate
  enterprise-grade → (vague — "serious enough for big companies")
```

The **TL;DR** and the "does it say what it does" line come from the AI. **Everything else — the flags, the buzzword load, the translations — is plain deterministic code that can't hallucinate.** So when it says "no named customers," that's a fact, not a guess.

## Free & private — no paid key

The summary runs on free engines, in this order:

1. **Gemini Nano** — Chrome's built-in on-device AI. No key, no cost, nothing leaves your machine. Zero setup once enabled. *(Needs Chrome 138+, ~4GB model, 22GB free disk, capable hardware.)*
2. **Groq** — a free hosted fallback for machines that can't run Nano. Free API key, no credit card.
3. **Rules only** — if neither is on, the reality check + buzzwords still work; only the TL;DR line is hidden.

There is no paid path. (An earlier build used a paid Claude key — removed.)

### Turning on the summary

**Nano (recommended):** enable `chrome://flags/#prompt-api-for-gemini-nano` and the on-device model component, restart Chrome, let the model download.

**Groq (fallback):** get a free key at console.groq.com (no card), then in the panel's DevTools console:
```js
chrome.storage.local.set({ groqKey: 'gsk_YOUR_KEY' })
```

## Install (unpacked)

```bash
npm install
npm run build            # → dist/
```
Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`. Open a company page in a **fresh** tab and click the icon.

## How it works

```
click icon → content script extracts the page's main copy (Readability,
             with a fallback for hero pages + citation/banner filtering)
           → engine.score(text)  [deterministic: buzzwords + flags + buzzword load]
           → panel renders the reality check + decoded buzzwords instantly
           → background picks an engine (Nano → Groq → none)
           → the LLM returns 3 structured fields; panel fills in the TL;DR
```

The LLM only ever returns `{ tldr, explainsWhatItDoes, audience }` (structured, schema-constrained) — it can't wander into freeform slop.

## Metrics (see `metrics-justification.md`)

| Metric | What | Status |
|---|---|---|
| **M2** buzzword coverage | % of published fluff lists detected | ✅ 100% |
| **M3** determinism | buzzword-load variance over 100 runs | ✅ 0 |
| ~~**M1** substance %~~ | deterministic substance score vs human labels | ⛔ **killed** (ρ=0.23) — retired; substance is now the LLM's job, see `learnings.md` |
| **M4** TL;DR quality | accurate + buzzword-free on the golden set | ⏳ pending an enabled engine |

## Develop

```bash
npm test                 # Vitest — 38 tests
npm run dev              # vite build --watch
```

## Roadmap
- Wire M4 once an engine is enabled; validate the TL;DR quality.
- v1.1 inline hover tooltips; v2 OCR input (DOM-only today).
