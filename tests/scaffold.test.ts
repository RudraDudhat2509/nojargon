import { describe, it, expect } from 'vitest';
import manifest from '../manifest.json';

describe('scaffold', () => {
  it('manifest is MV3 and targets chrome 138+', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(Number(manifest.minimum_chrome_version)).toBeGreaterThanOrEqual(138);
  });
});
