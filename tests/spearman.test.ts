import { describe, it, expect } from 'vitest';
import { spearman } from '../eval/m1-spearman';

describe('spearman', () => {
  it('is 1 for a perfectly monotonic series', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1, 5);
  });

  it('is -1 for a perfectly inverse series', () => {
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1, 5);
  });

  it('handles ties without the no-ties formula blowing up', () => {
    // Tie-heavy, like the M1 buckets: labels 1/2/3 vs scores with a repeat.
    const rho = spearman([50, 50, 90, 90], [1, 1, 3, 3]);
    expect(rho).toBeCloseTo(1, 5);
  });

  it('returns 0 when a series is constant (no variance)', () => {
    expect(spearman([5, 5, 5, 5], [1, 2, 3, 4])).toBe(0);
  });
});
