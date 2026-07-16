/**
 * M5 — founders accuracy.
 *
 * Run:  TAVILY_KEY=tvly-... npm run eval:m5
 *
 * Gate (metrics-justification.md M5):
 *   PASS    founders >= 80% correct AND 0 confident-but-wrong
 *   ITERATE 60-80%  → lever: tighten the domain-scoped query
 *   KILL    < 60%   → hide the founders section by default
 *
 * "Confident-but-wrong" is the one unacceptable failure: a wrong name rendered
 * WITHOUT the unverified badge. Wrong-but-flagged is survivable; wrong-and-
 * confident poisons trust in the whole brief.
 */
import { founders } from '../src/research/tavily';
import { companyNameFrom } from '../src/receipts';

interface Case {
  domain: string;
  expect: string[]; // any one of these names appearing = correct
}

const CASES: Case[] = [
  { domain: 'stripe.com', expect: ['Collison'] },
  { domain: 'notion.so', expect: ['Ivan Zhao'] },
  { domain: 'figma.com', expect: ['Dylan Field', 'Evan Wallace'] },
  { domain: 'linear.app', expect: ['Karri Saarinen', 'Tuomas Artman', 'Jori Lallo'] },
  { domain: 'vercel.com', expect: ['Guillermo Rauch'] },
  { domain: 'supabase.com', expect: ['Paul Copplestone', 'Ant Wilson'] },
  { domain: 'ghost.org', expect: ["John O'Nolan", 'John ONolan', 'ONolan'] },
  { domain: 'plausible.io', expect: ['Uku', 'Marko Saric'] },
  { domain: 'fly.io', expect: ['Kurt Mackey'] },
  { domain: 'cloudflare.com', expect: ['Matthew Prince', 'Michelle Zatlyn', 'Lee Holloway'] },
];

const hit = (answer: string, expect: string[]): boolean =>
  expect.some((n) => answer.toLowerCase().includes(n.toLowerCase()));

async function main(): Promise<void> {
  const key = process.env.TAVILY_KEY;
  if (!key) {
    console.error('Set TAVILY_KEY. e.g.  TAVILY_KEY=tvly-... npm run eval:m5');
    process.exit(1);
  }

  let correct = 0;
  let confidentlyWrong = 0;
  const rows: string[] = [];

  for (const c of CASES) {
    const company = companyNameFrom(c.domain);
    try {
      const f = await founders(company, c.domain, key);
      const ok = hit(f.answer, c.expect);
      if (ok) correct++;
      // The unacceptable case: wrong AND presented as verified.
      if (!ok && f.verified) confidentlyWrong++;
      rows.push(
        `${ok ? 'OK  ' : 'MISS'} ${c.domain.padEnd(16)} verified=${String(f.verified).padEnd(5)} ${f.answer.slice(0, 90).replace(/\s+/g, ' ')}`,
      );
    } catch (e) {
      rows.push(`ERR  ${c.domain.padEnd(16)} ${(e as Error).message}`);
    }
  }

  rows.forEach((r) => console.log(r));
  const pct = (correct / CASES.length) * 100;
  console.log(`\nfounders correct: ${correct}/${CASES.length} (${pct.toFixed(0)}%)`);
  console.log(`confidently wrong (wrong + not flagged unverified): ${confidentlyWrong}`);

  const band =
    pct >= 80 && confidentlyWrong === 0
      ? 'PASS'
      : pct >= 60
        ? 'ITERATE — tighten the domain-scoped query'
        : 'KILL — hide the founders section by default';
  console.log(`M5 founders: ${band}`);
}

main();
