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
  /** if any of these appear, the answer is WRONG regardless of `expect` */
  reject?: string[];
  note: string;
}

// `reject` is checked first and wins: it catches answers that are confidently
// wrong ("Cloudflare is private") or that match an expect token inside a
// negation ("does not trade on publicly...").
const CASES: Case[] = [
  { domain: 'stripe.com', expect: ['private', 'billion'], reject: ['publicly traded', 'acquired by'], note: 'private, VC-backed' },
  { domain: 'notion.so', expect: ['private', 'series', 'vc-backed'], reject: ['publicly traded', 'bootstrapped'], note: 'VC-backed private' },
  { domain: 'vercel.com', expect: ['private', 'series', 'vc-backed'], reject: ['publicly traded', 'bootstrapped'], note: 'VC-backed private' },
  { domain: 'supabase.com', expect: ['private', 'series', 'vc-backed'], reject: ['publicly traded', 'bootstrapped'], note: 'VC-backed private' },
  { domain: 'linear.app', expect: ['private', 'series', 'vc-backed'], reject: ['publicly traded', 'bootstrapped'], note: 'VC-backed private' },
  { domain: 'fly.io', expect: ['private', 'series', 'vc-backed'], reject: ['publicly traded', 'bootstrapped'], note: 'VC-backed private' },
  {
    domain: 'figma.com',
    expect: ['public', 'ipo', 'nyse'],
    // The Adobe deal was terminated; calling Figma "acquired" is stale, and
    // "does not trade publicly" is the negation that faked an OK last run.
    reject: ['acquired by adobe', 'does not trade', 'not publicly traded', 'is a private company'],
    note: 'PUBLIC (IPO)',
  },
  {
    domain: 'cloudflare.com',
    expect: ['public', 'ipo', 'nyse'],
    reject: ['private company', 'vc-backed private', 'does not trade', 'not publicly traded'],
    note: 'PUBLIC (NYSE: NET)',
  },
  // Negative cases — "no outside funding" is the correct answer. Inventing a
  // round here is the failure that embarrasses a VC in a partner meeting.
  {
    domain: 'plausible.io',
    expect: ['bootstrap', 'self-funded', 'no outside', 'not raised', 'no venture'],
    reject: ['series a', 'series b', 'series c', 'vc-backed'],
    note: 'BOOTSTRAPPED',
  },
  {
    domain: 'ghost.org',
    expect: ['non-profit', 'nonprofit', 'no outside', 'not raised', 'foundation', 'self-funded'],
    reject: ['series a', 'series b', 'series c', 'vc-backed private'],
    note: 'NON-PROFIT',
  },
];

const hit = (answer: string, c: Case): boolean => {
  const a = answer.toLowerCase();
  if (c.reject?.some((r) => a.includes(r.toLowerCase()))) return false;
  return c.expect.some((n) => a.includes(n.toLowerCase()));
};

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
      const ok = hit(f.answer, c);
      if (ok) correct++;
      if (f.sources.length > 0) sourced++;
      rows.push(
        `${ok ? 'OK  ' : 'MISS'} ${c.domain.padEnd(15)} src=${String(f.sources.length).padEnd(2)} ver=${String(f.verified).padEnd(5)} [${c.note}] ${f.answer.slice(0, 72).replace(/\s+/g, ' ')}`,
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
