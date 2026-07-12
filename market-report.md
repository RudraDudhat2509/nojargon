# Market Report — No-Jargon (working name)

**Product thesis:** A browser overlay that, on any page, tells you *what a company actually does* and *flags the empty buzzwords* — plain-English rewrite for due diligence, not just "make text simpler."

**Research date:** 2026-07-12
**Method:** Live web search + page fetches only. Every claim below links its source. No claims from memory.

---

## 1. Existing solutions

| Product | What it does | How you trigger it | Whole-page? | Detects/flags jargon? | Adoption / freshness | Source |
|---|---|---|---|---|---|---|
| **Simplify AI** | Rewrites selected text in simpler English, injects back into page | Highlight + right-click | No — selection only | No jargon-specific detection; generic simplify | 589 users, **1.5★**, last updated **Apr 2023** | [store](https://chromewebstore.google.com/detail/simplify-ai/ajjelinkcmnghbblfilfgpohdpimemoj) |
| **Jargon!** | Paste text, get plain-English version | Manual copy → paste into popup | No | No auto-detection at all | ~1,000 users, **3.5★**, last updated **Mar 2023** | [store](https://chromewebstore.google.com/detail/jargon/lddfcbcbmolobdpoddaghdkdkocdinje) |
| **SimpleRead** | Rewrites complex passages in place | Highlight → "Simplify" | No — selection only | No | Chrome store listing | [store](https://chromewebstore.google.com/detail/simpleread-simplify-any-t/blnbgpmflnfckecpjojkcnmbpkfapklo) |
| **Simplify: Text Simplifier** | AI turns complex text into simpler content | Selection-based | No | No | Chrome store listing | [store](https://chromewebstore.google.com/detail/simplify-text-simplifier/geifimkfaillkbjmfkgkdabicfgnbdic) |
| **Storytell / Mapify / Kome / Page Summarizer** | AI *summary* of a whole page in a side panel; chat with page | Click → summarize | Yes (summary) | No — condenses, doesn't flag fluff | Active, popular category | [Storytell](https://web.storytell.ai/chrome-extension), [Mapify roundup](https://mapify.so/blog/top-ai-summary-extensions) |
| **ToS;DR** | Community A–E grades + plain summaries of Terms/Privacy | Auto on known sites | Legal docs only | Flags concerning clauses (legal) | Mature, multi-browser | [store](https://chromewebstore.google.com/detail/terms-of-service-didn%E2%80%99t-r/hjdoplcnndgiblooccencgcggcoihigg) |
| **Chamelio / TermsAi / Formly** | AI plain-English summaries of ToS/legal docs | Paste / upload | Legal docs only | Flags risky clauses (legal) | Active SaaS tools | [Chamelio](https://chamelio.ai/blog/simplify-terms-of-service-discover-tosdr-chamelio/), [Formly](https://formly.tools/tools/terms-simplifier) |
| **De-Jargonizer** | Highlights jargon words in *your own* writing (science comms) | Paste your text | N/A (authoring) | **Detects** jargon but does **not** rewrite it | Academic tool | [site](https://scienceandpublic.com/) |
| **Vendor DD platforms** (UpGuard, Venminder, ProcessUnity) | Enterprise third-party risk: questionnaires, security scans, monitoring | Enterprise workflow | N/A | Risk scoring, not language | Enterprise SaaS | [Compliancely roundup](https://compliancely.com/blog/vendor-due-diligence-software/) |

**Enabling tech (not a competitor — our engine option):**

| Tech | Relevance | Source |
|---|---|---|
| **Chrome Prompt API + Gemini Nano** | On-device LLM in **stable Chrome 138+**, usable by extensions, **no API key, no data sent to Google, works offline** after model download | [Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api), [Built-in AI](https://developer.chrome.com/docs/ai/built-in) |
| Rewriter / Summarizer APIs | Purpose-built on-device rewrite + summarize (Summarizer stable; Rewriter in origin trial) | [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api) |
| Hardware cost of on-device | Needs **22 GB free disk**, 16 GB RAM **or** >4 GB VRAM → not every user qualifies → cloud LLM fallback needed | [Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api) |

---

## 2. Gaps / whitespace

| # | Gap in the market | Evidence it's open | Our wedge |
|---|---|---|---|
| G1 | **Nobody frames simplification as due diligence.** Every tool either (a) simplifies text you highlight, or (b) summarizes a whole page. None answer *"is this substance or vapor?"* | Simplifiers are selection-based & generic; summarizers condense but don't judge; DD platforms are enterprise risk tools, not language overlays | Side panel: **"What they actually do" + a substance/fluff breakdown** on any company page |
| G2 | **Detection and rewrite are split across two different tools.** De-Jargonizer *detects* jargon but won't fix it; simplifiers *fix* but don't detect/flag. | De-Jargonizer explicitly only highlights, doesn't rewrite | We do **both**: auto-detect empty buzzwords in place **and** rewrite them plainly |
| G3 | **The good "plain rewrite" tooling is legal-only.** ToS;DR and Chamelio are excellent but scoped to Terms/Privacy. | Whole plain-rewrite category is TOS-bound | Same clarity, aimed at **marketing/product copy & About pages** — the DD surface |
| G4 | **Incumbent simplifiers are stale and low-trust.** The two closest matches were last updated 2023 with 1.5★ / 3.5★. | Simplify AI 1.5★ Apr 2023; Jargon! 3.5★ Mar 2023 | A fresh, well-built, **privacy-first** tool clears a low bar fast |
| G5 | **No incumbent uses on-device LLM.** Free, private, no-API-key inference just went stable (Chrome 138+). | Prompt API stable; no reviewed competitor advertises it | **Privacy-first, no-key, free** engine — directly on-brand for an "AI reliability/security lens" builder |

---

## 3. Cited claims (every load-bearing fact, with its live source)

1. Simplify AI works on highlighted text only, has 589 users, 1.5★, last updated Apr 2023 — [store page](https://chromewebstore.google.com/detail/simplify-ai/ajjelinkcmnghbblfilfgpohdpimemoj)
2. Jargon! requires manual copy-paste, no auto-detection, ~1,000 users, 3.5★, updated Mar 2023 — [store page](https://chromewebstore.google.com/detail/jargon/lddfcbcbmolobdpoddaghdkdkocdinje)
3. A whole category of AI *summary* side-panel extensions exists (Storytell, Mapify, Kome) — they summarize, not de-jargon or judge — [Mapify roundup](https://mapify.so/blog/top-ai-summary-extensions)
4. ToS;DR gives community A–E grades and plain summaries, scoped to Terms/Privacy — [Chamelio explainer](https://chamelio.ai/blog/simplify-terms-of-service-discover-tosdr-chamelio/)
5. AI ToS simplifiers exist and flag risky clauses, but only for legal docs — [Formly](https://formly.tools/tools/terms-simplifier)
6. De-Jargonizer detects jargon in your writing but does not rewrite it — [scienceandpublic.com](https://scienceandpublic.com/)
7. Vendor due-diligence software is enterprise risk tooling (questionnaires, security scans), not a language overlay — [Compliancely](https://compliancely.com/blog/vendor-due-diligence-software/)
8. Chrome Prompt API (Gemini Nano) is available to extensions in stable Chrome 138+, no API key, no data sent to Google, offline after download — [Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api)
9. On-device model needs 22 GB free disk and 16 GB RAM or >4 GB VRAM → a meaningful share of users can't run it → cloud fallback required — [Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api)
10. Purpose-built on-device Rewriter/Summarizer APIs exist (Summarizer stable, Rewriter in origin trial) — [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
11. Common empty buzzwords with no concrete meaning ("disruptive", "best-in-class", "seamless", "paradigm shift", "synergy", "leverage") are a documented tell of fluff copy — [HubSpot fluff list](https://blog.hubspot.com/blog/tabid/6307/bid/31068/31-fluffy-buzzwords-marketers-overuse-and-abuse.aspx), [CMO Alliance 90 words](https://www.cmoalliance.com/stop-using-these-90-promotional-words/)
12. Vagueness, unverifiable claims, and no concrete specs are recognized due-diligence red flags for vaporware — [TechBloat on vaporware](https://www.techbloat.com/what-is-vaporware-the-mystery-of-false-tech-promises.html)

---

## 4. Bottom line

The "text simplifier" shelf is full but **stale, generic, and selection-based**. The "whole-page AI" shelf **summarizes but never judges**. The "plain rewrite done well" shelf is **legal-only**. Nobody sits where we want to: **an on-page, privacy-first due-diligence lens that says "here's what this company actually does, and here's which of their claims are empty."** That framing (G1–G3), plus a free no-API-key on-device engine (G5) that no incumbent uses, is a real and defensible wedge.
