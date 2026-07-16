// Independent context about a company — founders and reputation — via Tavily's
// free search (1000/mo, no card). Every answer carries source links: in a
// due-diligence tool, an unsourced claim is worthless.

export interface Source {
  title: string;
  url: string;
}

export interface Finding {
  answer: string;
  sources: Source[];
  /**
   * True when at least one source actually references this company (its domain or
   * name). A bare-name search can surface a same-named exec at a different company
   * — an unverified claim is shown as unverified, never asserted as fact.
   */
  verified: boolean;
}

const ENDPOINT = 'https://api.tavily.com/search';
const MAX_SOURCES = 3;

// A source counts as corroborating only if it actually mentions this company —
// by domain, or by name in the title. Guards against same-name conflation.
export function isVerified(sources: Source[], subject?: { domain?: string; company?: string }): boolean {
  if (!subject) return true;
  const domain = subject.domain?.toLowerCase() ?? '';
  const sld = domain.split('.')[0] ?? '';
  const name = subject.company?.toLowerCase() ?? '';
  return sources.some((s) => {
    const hay = `${s.url} ${s.title}`.toLowerCase();
    return (domain && hay.includes(domain)) || (sld.length > 2 && hay.includes(sld)) || (name.length > 2 && hay.includes(name));
  });
}

export function parseTavily(json: unknown, subject?: { domain?: string; company?: string }): Finding {
  const d = json as { answer?: unknown; results?: unknown } | null;
  const answer = typeof d?.answer === 'string' ? d.answer.trim() : '';
  if (!answer) throw new Error('tavily: no answer');
  const rows = Array.isArray(d?.results) ? d.results : [];
  const sources: Source[] = rows
    .slice(0, MAX_SOURCES)
    .map((r) => r as { title?: unknown; url?: unknown })
    .filter((r) => typeof r.url === 'string')
    .map((r) => ({ title: typeof r.title === 'string' ? r.title : String(r.url), url: String(r.url) }));
  return { answer, sources, verified: isVerified(sources, subject) };
}

// Anchored on the domain: "Who founded Altagic?" pulls a same-named exec from
// Allata; "the company at altagic.com" does not.
export function foundersQuery(company: string, domain: string): string {
  return `Who founded the company at ${domain}? Name the founders and current CEO of ${company} (${domain}) specifically — not similarly named people at other companies.`;
}

export function reputationQuery(company: string, domain: string): string {
  return `${company} (${domain}) reviews, complaints and reputation — what do real customers and users say?`;
}

// "No funding found" is a real answer, not a gap — bootstrapped is a signal, and
// silence would read as "we failed to look".
export function fundingQuery(company: string, domain: string): string {
  return (
    `What is the CURRENT funding status of ${company} (${domain})? ` +
    `Start by stating which one it is: publicly traded, acquired, bootstrapped/self-funded, non-profit, or VC-backed and still private. ` +
    `If it is public or acquired, say so FIRST and name the exchange/ticker or acquirer — do not describe old pre-IPO rounds as its "latest funding". ` +
    `If it is bootstrapped or a non-profit, say that plainly and do not imply venture funding. ` +
    `Only if it is VC-backed and private, give the latest round, amount, lead investors and date. Also give approximate employee count if known.`
  );
}

// `explicit` lets the eval harness run outside the extension (env key) — inside
// Chrome there is no key argument and it reads storage.
async function getKey(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  try {
    return (await chrome.storage.local.get('tavilyKey')).tavilyKey as string | undefined;
  } catch {
    return undefined;
  }
}

export async function hasKey(): Promise<boolean> {
  return Boolean(await getKey());
}

interface AskOpts {
  includeDomains?: string[];
  subject?: { domain?: string; company?: string };
  key?: string;
}

async function ask(query: string, opts: AskOpts = {}): Promise<Finding> {
  const key = await getKey(opts.key);
  if (!key) throw new Error('tavily: no key');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
      ...(opts.includeDomains ? { include_domains: opts.includeDomains } : {}),
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  return parseTavily(await res.json(), opts.subject);
}

export async function founders(company: string, domain: string, key?: string): Promise<Finding> {
  return ask(foundersQuery(company, domain), { subject: { company, domain }, key });
}

export async function funding(company: string, domain: string, key?: string): Promise<Finding> {
  return ask(fundingQuery(company, domain), { subject: { company, domain }, key });
}

export async function reputation(company: string, domain: string, key?: string): Promise<Finding> {
  // Bias toward places where people speak plainly, not the company's own PR.
  return ask(reputationQuery(company, domain), {
    subject: { company, domain },
    key,
    includeDomains: ['reddit.com', 'trustpilot.com', 'news.ycombinator.com', 'g2.com', 'glassdoor.com'],
  });
}
