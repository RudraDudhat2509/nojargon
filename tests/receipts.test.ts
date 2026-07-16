import { describe, it, expect } from 'vitest';
import { domainOf, parseRdap, parseCdx, ageFrom } from '../src/receipts';

describe('domainOf', () => {
  it('strips www and path from a URL', () => {
    expect(domainOf('https://www.stripe.com/in')).toBe('stripe.com');
  });
  it('keeps subdomains other than www', () => {
    expect(domainOf('https://docs.stripe.com/api')).toBe('docs.stripe.com');
  });
  it('returns empty string for a non-URL', () => {
    expect(domainOf('chrome://extensions')).toBe('');
  });
});

describe('parseRdap', () => {
  it('extracts the registration year from RDAP events', () => {
    const r = parseRdap({ events: [{ eventAction: 'registration', eventDate: '2010-03-25T00:00:00Z' }] });
    expect(r.registeredYear).toBe(2010);
  });
  it('ignores other event types', () => {
    const r = parseRdap({ events: [{ eventAction: 'expiration', eventDate: '2030-01-01T00:00:00Z' }] });
    expect(r.registeredYear).toBeNull();
  });
  it('returns null on garbage', () => {
    expect(parseRdap({}).registeredYear).toBeNull();
    expect(parseRdap(null).registeredYear).toBeNull();
  });
});

describe('parseCdx', () => {
  it('extracts the first-snapshot year from CDX rows (skipping the header row)', () => {
    expect(parseCdx([['timestamp'], ['20110107123456']]).onlineSinceYear).toBe(2011);
  });
  it('returns null when there are no snapshots', () => {
    expect(parseCdx([]).onlineSinceYear).toBeNull();
    expect(parseCdx([['timestamp']]).onlineSinceYear).toBeNull();
  });
});

describe('ageFrom', () => {
  it('computes domain age in years', () => {
    expect(ageFrom(2010, new Date('2026-07-13T00:00:00Z'))).toBe(16);
  });
  it('returns null without a registration year', () => {
    expect(ageFrom(null, new Date('2026-07-13T00:00:00Z'))).toBeNull();
  });
});
