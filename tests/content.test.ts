import { describe, it, expect } from 'vitest';
import { parseHTML } from 'linkedom';
import { extractMain } from '../src/content/content-script';

describe('extractMain', () => {
  it('pulls readable body text from an article', () => {
    const { document } = parseHTML(`<html><body><article><h1>Acme</h1>
      <p>Acme sells software that syncs Shopify orders every 5 minutes for $29 per month.
      It connects to Gmail and Slack, supports a REST API, and is used by several online stores
      that need to keep their inventory and fulfilment systems aligned without manual work.</p>
      </article></body></html>`);
    const text = extractMain(document as unknown as Document);
    expect(text).toContain('syncs Shopify orders');
  });

  it('returns null for empty page', () => {
    const { document } = parseHTML('<html><body></body></html>');
    expect(extractMain(document as unknown as Document)).toBeNull();
  });
});
