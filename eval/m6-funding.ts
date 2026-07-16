/**
 * M6 — funding & traction accuracy.
 *
 * Run:  $env:TAVILY_KEY='tvly-...'; npm run eval:m6
 *
 * Gate (metrics-justification.md M6):
 *   PASS    >= 80% correct AND 100% sourced
 *   ITERATE 60-80%  → lever: tighten the funding query / prefer crunchbase-class sources
 *   KILL    < 60%   → hide the funding section
 *
 * The negative cases matter most: Plausible is bootstrapped and Ghost is a
 * non-profit. Inventing a Series A for a bootstrapped company is the failure
 * that would embarrass a VC in a partner meeting — "none found" must be a real,
 * confident answer, not silence.
 */
import { funding } from '../src/research/tavily';
import { companyNameFrom } from '../src/receipts';

interface Case {
  domain: string;
  /** any one of these appearing in the answer counts as correct */
  expect: string[];
  note: string;
}

const CASES: Case[] = [
  { domain: 'stripe.com', expect: ['billion', 'series', '$'], note: 'heavily funded' },
  { domain: 'notion.so', expect: ['series c', 'series', '$275', 'billion', '$'], note: 'Series C' },
  { domain: 'vercel.com', expect: ['series', '$', 'million'], note: 'Series D/E' },
  { domain: 'supabase.com', expect: ['series', '$', 'million'], note: 'Series B/C/D' },
  { domain: 'linear.app', expect: ['series', '$', 'million'], note: 'Series A/B' },
  { domain: 'fly.io', expect: ['series', '$', 'million'], note: 'Series B/C' },
  { domain: 'figma.com', expect: ['series', '$', 'adobe', 'billion'], note: 'Series E / Adobe saga' },
  { domain: 'cloudflare.com', expect: ['public', 'ipo', 'nyse', 'nasdaq', '$'], note: 'public company' },
  // Negative cases — "no outside funding" is the correct answer.
  { domain: 'plausible.io', expect: ['bootstrap', 'no outside', 'no funding', 'none', 'self-funded', 'not raised'], note: 'BOOTSTRAPPED' },
  { domain: 'ghost.org', expect: ['non-profit', 'nonprofit', 'no outside', 'no funding', 'none', 'not raised', 'foundation'], note: 'NON-PROFIT' },
];

const hit = (answer: string, expect: string[]): boolean =>
  expect.some((n) => answer.toLowerCase().includes(n.toLowerCase()));

async function main(): Promise<void> {
  const key = process.env.TAVILY_KEY;
  if (!key) {
    console.error("Set TAVILY_KEY. e.g.  $env:TAVILY_KEY='tvly-...'; npm run eval:m6");
    process.exit(1);
  }

  let correct = 0;
  let sourced = 0;
  const rows: string[] = [];

  for (const c of CASES) {
    const company = companyNameFrom(c.domain);
    try {
      const f = await funding(company, c.domain, key);
      const ok = hit(f.answer, c.expect);
      if (ok) correct++;
      if (f.sources.length > 0) sourced++;
      rows.push(
        `${ok ? 'OK  ' : 'MISS'} ${c.domain.padEnd(15)} src=${String(f.sources.length).padEnd(2)} [${c.note}] ${f.answer.slice(0, 80).replace(/\s+/g, ' ')}`,
      );
    } catch (e) {
      rows.push(`ERR  ${c.domain.padEnd(15)} ${(e as Error).message}`);
    }
  }

  rows.forEach((r) => console.log(r));
  const pct = (correct / CASES.length) * 100;
  const srcPct = (sourced / CASES.length) * 100;
  console.log(`\nfunding correct: ${correct}/${CASES.length} (${pct.toFixed(0)}%)`);
  console.log(`sourced: ${sourced}/${CASES.length} (${srcPct.toFixed(0)}%)`);

  const band =
    pct >= 80 && srcPct === 100
      ? 'PASS'
      : pct >= 60
        ? 'ITERATE — tighten the funding query'
        : 'KILL — hide the funding section';
  console.log(`M6 funding: ${band}`);
}

main();
