import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { score } from '../src/engine/index';

/**
 * Spearman rank correlation with tie correction. The M1 data is tie-heavy
 * (labels are only 1/2/3 and many scores repeat), so the no-ties formula
 * 1-6Σd²/n(n²-1) is invalid — compute Pearson correlation over average ranks.
 */
function averageRanks(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
  const ranks = new Array<number>(a.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1]![0] === idx[i]![0]) j++;
    const avg = (i + j + 2) / 2; // average of ranks (1-indexed) i+1..j+1
    for (let k = i; k <= j; k++) ranks[idx[k]![1]] = avg;
    i = j + 1;
  }
  return ranks;
}

export function spearman(xs: number[], ys: number[]): number {
  const rx = averageRanks(xs);
  const ry = averageRanks(ys);
  const n = rx.length;
  const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = mean(rx);
  const my = mean(ry);
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i]! - mx;
    const dy = ry[i]! - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return 0; // no variance (constant series) → undefined correlation
  return cov / Math.sqrt(vx * vy);
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
