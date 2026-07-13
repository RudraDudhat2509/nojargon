/**
 * Spearman rank correlation with tie correction (Pearson over average ranks).
 * Retained as a general eval utility. NOTE: the M1 substance-validity metric it
 * originally served was KILLED (ρ=0.227) — see metrics-justification.md M1 /
 * learnings.md. The deterministic layer no longer emits a substance score to
 * correlate; this function stays for future evals (e.g. M4).
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
