# No-Jargon

**A plain-English company brief for VCs.** Land on any company or startup site, click once, and get what you'd otherwise open ten tabs for: what they actually do (de-jargoned), **who the founders are**, **what people really say about them**, and **how legit/established they are** — with sources.

Not a summarizer. Paraphrasing a company's own marketing is worthless — they wrote it. The value is the **independent signal they're not putting on their homepage.**

## The brief

```
STRIPE
 What they do    Payment software for online businesses.
 Founders        Patrick and John Collison founded Stripe in 2010…   [sources]
 Reputation      Devs praise the API; complaints about support.      [reddit] [trustpilot]
 Legitimacy      ✓ Domain 16 yrs old (registered 2010)
                   ✓ Online since 2011 (web archive)
 Marketing       ✓ clearly says what it does
                   ⚠ buzzword load: medium (3 found)
Buzzwords decoded  seamless → works without extra setup
```

**Every external claim carries source links.** In a due-diligence tool, an unsourced claim is worthless.

## Where each section comes from

| Section | Source | Key? | Leaves your machine? |
|---|---|---|---|
| What they do, Buzzwords, Marketing honesty | Local page read + on-device/Groq LLM | free | no (Nano) / page text only (Groq) |
| **Founders, Reputation** | Tavily search (free 1,000/mo) | free key | company name → Tavily |
| **Legitimacy** (domain age, web history) | RDAP + Wayback | **none** | domain only |

No paid path anywhere. Sections degrade independently — no key or a failed lookup hides *that section*, never the card.

## Setup

```bash
npm install && npm run build          # → dist/
```
Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `dist/`.

Then add the free keys (panel → right-click → Inspect → Console):
```js
chrome.storage.local.set({ groqKey: 'gsk_…' })    // console.groq.com — free, no card
chrome.storage.local.set({ tavilyKey: 'tvly-…' }) // tavily.com — free 1000/mo, no card
```
Prefer fully-private? Enable Chrome's on-device AI (`chrome://flags/#prompt-api-for-gemini-nano`) instead of Groq. Legitimacy needs no key at all.

## How it works

```
click → panel injects a reader into the page (chrome.scripting)
      → local: de-jargon + buzzword decode + red flags   [instant, no network]
      → parallel fan-out:
           LLM  → what they do (structured: tldr / says-what-it-does / audience)
           RDAP + Wayback → domain age, web history      [zero-key]
           Tavily → founders, reputation + sources
      → render brief; any failed section is simply omitted
```
The LLM only ever returns 3 schema-constrained fields — it can't wander into freeform slop. The buzzword decode, red flags, and legitimacy are plain deterministic code that can't hallucinate.

## Metrics (`metrics-justification.md`)

| Metric | What | Status |
|---|---|---|
| **M2** buzzword coverage | % of published fluff lists caught | ✅ 100% |
| **M3** determinism | buzzword-load variance over 100 runs | ✅ 0 |
| ~~**M1** substance %~~ | deterministic substance score | ⛔ killed (ρ=0.23) — substance is the LLM's job now |
| **M4** TL;DR quality | accurate + buzzword-free | ⏳ |
| **M5** brief usefulness | founders correct ≥80%, 100% sourced | ⏳ known gaps logged |

## Known issues
- Founders can conflate a same-named exec at another company → fix: domain-scoped queries (M5 lever).
- Wayback "online since" may reflect a **previous domain owner** → cross-check against registration year.
- RDAP returns no registration event for some domains → age blank.

## Develop
```bash
npm test        # Vitest — 54 tests
npm run dev     # vite build --watch
```

## Roadmap
- UX pass: quieter visual design, fewer emojis, collapsible sources, editable sections.
- Punchier, more brutally-honest summary voice.
- v2: OCR input (DOM-only today).
