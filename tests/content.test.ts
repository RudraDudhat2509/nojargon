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

  it('falls back to visible headings/paragraphs when Readability is thin', () => {
    const { document } = parseHTML(`<html><body>
      <h1>Build your Agentic Enterprise on a trusted, open, unified platform</h1>
      <p>Turn ideas into a business. Build, scale and monetize on an AI native foundation.</p>
    </body></html>`);
    const text = extractMain(document as unknown as Document);
    expect(text).toContain('Agentic Enterprise');
    expect(text).toContain('monetize');
  });

  it('skips analyst-citation / event-banner noise in the fallback', () => {
    const { document } = parseHTML(`<html><body>
      <p>Gartner®, Magic Quadrant™ for Communications Platform as a Service, 2026.</p>
      <p>Omdia Universe: Customer Engagement Platforms, 2026.</p>
    </body></html>`);
    // Only noise blocks present → nothing product-worthy survives → null.
    expect(extractMain(document as unknown as Document)).toBeNull();
  });
});
