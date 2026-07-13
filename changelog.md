# Changelog

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
