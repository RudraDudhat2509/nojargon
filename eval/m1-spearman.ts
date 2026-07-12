import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { score } from '../src/engine/index';

/**
 * Spearman rank correlation (no tie correction — golden labels are 1/2/3 buckets,
 * ties handled by average-free ordinal ranking which is adequate for the M1 gate).
 */
export function spearman(xs: number[], ys: number[]): number {
  const rank = (a: number[]): number[] => {
    const idx = a.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
    const r = new Array<number>(a.length);
    idx.forEach(([, i], k) => {
      r[i] = k + 1;
    });
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const d2 = rx.reduce((s, v, i) => s + (v - ry[i]!) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function band(rho: number): string {
  if (rho >= 0.7) return 'PASS (>= 0.70, strong)';
  if (rho >= 0.5) return 'ITERATE (0.50-0.70) — reweight lexicon / add concrete-signal detectors';
  return 'KILL (< 0.50) — deterministic-score premise too weak, reconsider';
}

// main(): score the extracted golden pages, correlate with human labels, print the band.
function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const labelsPath = join(here, '..', 'golden', 'labels.json');
  if (!existsSync(labelsPath)) {
    console.error('golden/labels.json not found. Run `npm run golden:extract` and fill in labels.');
    process.exit(1);
  }
  const labels: { url: string; label: number | null }[] = JSON.parse(readFileSync(labelsPath, 'utf8'));
  const pagesDir = join(here, '..', 'golden', 'pages');

  const humans: number[] = [];
  const scores: number[] = [];
  labels.forEach((row, i) => {
    if (row.label == null) return;
    const file = join(pagesDir, `${i}.txt`);
    if (!existsSync(file)) return;
    const pct = score(readFileSync(file, 'utf8')).substancePct;
    if (pct == null) return;
    humans.push(row.label);
    scores.push(pct);
  });

  if (humans.length < 3) {
    console.error(`Only ${humans.length} labeled+extracted pages. Need at least 3 to compute rho.`);
    process.exit(1);
  }
  const rho = spearman(scores, humans);
  console.log(`n=${humans.length}  Spearman rho=${rho.toFixed(3)}`);
  console.log(`M1: ${band(rho)}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('m1-spearman.ts')) {
  main();
}
