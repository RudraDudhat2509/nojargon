import { describe, it, expect } from 'vitest';
import { spearman } from '../eval/m1-spearman';

describe('spearman', () => {
  it('is 1 for a perfectly monotonic series', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1, 5);
  });

  it('is -1 for a perfectly inverse series', () => {
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1, 5);
  });
});
