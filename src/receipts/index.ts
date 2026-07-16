// Zero-key legitimacy signals: how old the domain is, and how long the site has
// actually existed on the web. Public registries + the Internet Archive — no API
// key, no signup. Hard for a company to fake, and not on their marketing page.

export interface Receipts {
  registeredYear: number | null;
  domainAgeYears: number | null;
  onlineSinceYear: number | null;
}

export function domainOf(url: string): string {
  try {
    const { hostname, protocol } = new URL(url);
    if (!/^https?:$/.test(protocol)) return '';
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// RDAP: events[] contains { eventAction: "registration", eventDate: ISO }
export function parseRdap(json: unknown): { registeredYear: number | null } {
  const events = (json as { events?: { eventAction?: string; eventDate?: string }[] } | null)?.events;
  if (!Array.isArray(events)) return { registeredYear: null };
  const reg = events.find((e) => e?.eventAction === 'registration' && typeof e.eventDate === 'string');
  if (!reg?.eventDate) return { registeredYear: null };
  const year = new Date(reg.eventDate).getUTCFullYear();
  return { registeredYear: Number.isFinite(year) ? year : null };
}

// Wayback CDX with fl=timestamp returns [["timestamp"], ["20110107123456"], ...]
export function parseCdx(json: unknown): { onlineSinceYear: number | null } {
  if (!Array.isArray(json) || json.length < 2) return { onlineSinceYear: null };
  const first = json[1];
  const ts = Array.isArray(first) ? String(first[0] ?? '') : '';
  const year = Number(ts.slice(0, 4));
  return { onlineSinceYear: Number.isFinite(year) && year > 1990 ? year : null };
}

// "docs.stripe.com" → "Stripe". Good enough to seed a search query.
export function companyNameFrom(domain: string): string {
  const parts = domain.split('.').filter(Boolean);
  const sld = parts.length >= 2 ? parts[parts.length - 2]! : (parts[0] ?? '');
  return sld ? sld.charAt(0).toUpperCase() + sld.slice(1) : '';
}

export function ageFrom(registeredYear: number | null, now: Date): number | null {
  if (registeredYear == null) return null;
  return now.getUTCFullYear() - registeredYear;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// Each source fails independently — one being down never kills the other.
export async function fetchReceipts(domain: string, now: Date = new Date()): Promise<Receipts> {
  const [rdap, cdx] = await Promise.allSettled([
    getJson(`https://rdap.org/domain/${encodeURIComponent(domain)}`),
    getJson(
      `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=1&sort=asc&fl=timestamp`,
    ),
  ]);

  const registeredYear = rdap.status === 'fulfilled' ? parseRdap(rdap.value).registeredYear : null;
  const onlineSinceYear = cdx.status === 'fulfilled' ? parseCdx(cdx.value).onlineSinceYear : null;
  return { registeredYear, domainAgeYears: ageFrom(registeredYear, now), onlineSinceYear };
}
