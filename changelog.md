# Changelog

## 0.5.0 — 2026-07-13 (UX + voice pass, founder accuracy, funding)

- **Voice**: the summary is now blunt and dryly funny ("the blunt friend a VC brings along") — with a hard prompt rule: *brutal about the marketing, never about facts.*
- **Readability**: dropped the gold-on-black theme for a high-contrast, readable panel (system font, neutral palette, neutral dark variant). Removed all emoji section headers; ✓/✕/! markers moved to CSS so text stays clean and copyable.
- **Sources** now live in a `<details>` card, collapsed by default.
- **Founder accuracy (M5: PASS 10/10)**: queries are anchored to the domain, killing the same-name conflation (the "Matt Rosen of Allata" bug). Claims with no corroborating source get an explicit **Unverified** badge rather than being asserted as fact.
- **Funding & traction** section added — **⚠️ ships with a known defect (M6: 70%, below the 80% gate)**. It systematically misreports **public** companies (Cloudflare → "private") and **bootstrapped** ones (Plausible → "VC-backed") because the answer engine assumes every company is VC-backed. `verified` does not catch this. **Treat the funding line as unreliable for non-VC-backed companies** until the decomposed status query is tried. See `metrics-justification.md` M6.
- Guard added: Tavily queries are bounded to 400 chars (an over-long query silently 400'd an entire eval run); API errors now surface their message.
- 64 tests.

## 0.4.0 — 2026-07-13 (VC company brief)

- **Reframed the product**: from "de-jargon this page" to a **plain-English company brief for VCs** — what they do, who the founders are, reputation, legitimacy — because paraphrasing a company's own marketing is inherently low-value.
- **`receipts`** (zero-key, private): domain age via RDAP + first web-archive snapshot via Wayback CDX. Independent legitimacy signal that's hard to fake.
- **`research`** (Tavily, free 1000/mo no card): founders + reputation answers, each rendered **with source links** — an unsourced claim is worthless in a DD tool.
- **Background** fans out every section in parallel (`Promise.allSettled`); any source failing/keyless nulls only its own section.
- **Panel**: the brief card — What they do / Founders / Reputation / Legitimacy / Marketing honesty / Buzzwords decoded.
- 54 tests.

### Known issues (logged from first live run)
- Founders lookup can conflate a same-named person at a different company (observed: "Matt Rosen … of Allata" surfaced for Altagic). Needs domain-scoped queries — tracked under M5.
- Wayback "online since" can reflect a **previous domain owner** (observed: stripe.com → 1996). Needs cross-checking against the registration date.
- RDAP can fail for some domains (observed: stripe.com), leaving domain age blank.

## 0.3.0 — 2026-07-12 (free/native summary + honest pivot)

- **Retired the deterministic substance %** after M1 killed it (Spearman ρ=0.227; the concrete-signal detector was noise — fired on event banners/citations, missed technical substance). Replaced with a coarse, honest `buzzwordLoad` (high/medium/low). See `learnings.md`.
- **Fused TL;DR + reality-check card**: the LLM writes a plain-English TL;DR + a "does it say what it does" judgment; the panel fuses that with deterministic red flags + buzzword load. The LLM returns 3 schema-constrained fields — no freeform slop.
- **Free/native engines, no paid key**: on-device Gemini Nano (structured output via `responseConstraint`) → free Groq (`openai/gpt-oss-20b`) → rules-only degrade. Removed the paid Claude adapter.
- **Extraction hardening**: filter analyst-citation / event-banner / promo blocks so the score isn't polluted by non-product copy.
- 38 Vitest tests; `vite build` loads clean.

## 0.1.0 — 2026-07-12 (initial build)

- Scaffolded Manifest V3 extension (TypeScript, Vite + crxjs, Vitest).
- `lexicon`: 45-entry buzzword → plain-English map with fluff weights. M2 buzzword coverage = 100% (40/40 reference terms from HubSpot + CMO Alliance lists; target ≥ 90%).
- `engine`: deterministic `score(text) → substancePct` (pure, no DOM/network). M3 determinism = 0 variance over 100 runs. Cleanly separates the synthetic fluff/substance example (0% vs 100%).
- Red-flag derivation: `high_buzzword_density`, `no_numbers_or_specs`, `no_named_customers`.
- `content-script`: main-copy extraction via @mozilla/readability, runs the engine, replies to the panel.
- `side-panel`: deterministic-first render (substance meter + flags + decoded claims), then LLM enrichment; graceful "add a Claude key" CTA when no engine is available.
- `llm`: adapter interface + `NanoAdapter` (Chrome on-device Prompt API) and `ClaudeAdapter` (user-key fetch to the Anthropic Messages API, `claude-sonnet-5`).
- `background`: adapter selection (Nano → Claude key → none) + message relay.
- `eval`: golden-set harness + Spearman ρ runner for M1. 20 real company pages fetched into `golden/`.
- 26 Vitest tests across 10 files. `vite build` produces a loadable unpacked extension.
