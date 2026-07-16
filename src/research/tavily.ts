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
}

const ENDPOINT = 'https://api.tavily.com/search';
const MAX_SOURCES = 3;

export function parseTavily(json: unknown): Finding {
  const d = json as { answer?: unknown; results?: unknown } | null;
  const answer = typeof d?.answer === 'string' ? d.answer.trim() : '';
  if (!answer) throw new Error('tavily: no answer');
  const rows = Array.isArray(d?.results) ? d.results : [];
  const sources: Source[] = rows
    .slice(0, MAX_SOURCES)
    .map((r) => r as { title?: unknown; url?: unknown })
    .filter((r) => typeof r.url === 'string')
    .map((r) => ({ title: typeof r.title === 'string' ? r.title : String(r.url), url: String(r.url) }));
  return { answer, sources };
}

export function foundersQuery(company: string): string {
  return `Who founded ${company}? Name the founders and current CEO, and their background.`;
}

export function reputationQuery(company: string): string {
  return `${company} reviews, complaints and reputation — what do real customers and users say?`;
}

async function getKey(): Promise<string | undefined> {
  try {
    return (await chrome.storage.local.get('tavilyKey')).tavilyKey as string | undefined;
  } catch {
    return undefined;
  }
}

export async function hasKey(): Promise<boolean> {
  return Boolean(await getKey());
}

async function ask(query: string, includeDomains?: string[]): Promise<Finding> {
  const key = await getKey();
  if (!key) throw new Error('tavily: no key');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
      ...(includeDomains ? { include_domains: includeDomains } : {}),
    }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  return parseTavily(await res.json());
}

export async function founders(company: string): Promise<Finding> {
  return ask(foundersQuery(company));
}

export async function reputation(company: string): Promise<Finding> {
  // Bias toward places where people speak plainly, not the company's own PR.
  return ask(reputationQuery(company), [
    'reddit.com',
    'trustpilot.com',
    'news.ycombinator.com',
    'g2.com',
    'glassdoor.com',
  ]);
}
