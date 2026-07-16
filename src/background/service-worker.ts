import { selectAdapter, type LlmAdapter } from '../llm/adapter';
import { NanoAdapter } from '../llm/nano';
import { GroqAdapter } from '../llm/groq';
import { domainOf, companyNameFrom, fetchReceipts, type Receipts } from '../receipts';
import { founders, funding, reputation, type Finding } from '../research/tavily';
import type { Brief, EnrichResponse } from '../shared/messages';

export async function handleEnrich(mainText: string, adapters: LlmAdapter[]): Promise<EnrichResponse> {
  const adapter = await selectAdapter(adapters);
  if (!adapter) return { type: 'no-llm' };
  try {
    const enrichment = await adapter.enrich(mainText);
    return { type: 'enriched', enrichment };
  } catch {
    // Adapter failed (bad key, offline, model evicted) — degrade to rules-only.
    return { type: 'no-llm' };
  }
}

export interface BriefDeps {
  enrich: (mainText: string) => Promise<EnrichResponse>;
  receipts: (domain: string) => Promise<Receipts>;
  founders: (company: string, domain: string) => Promise<Finding>;
  funding: (company: string, domain: string) => Promise<Finding>;
  reputation: (company: string, domain: string) => Promise<Finding>;
}

const orNull = <T>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);

// Fan out every section in parallel. One source being down, rate-limited, or
// key-less must never take the whole brief with it.
export async function assembleBrief(url: string, mainText: string, deps: BriefDeps): Promise<Brief> {
  const domain = domainOf(url);
  const company = companyNameFrom(domain);

  const [whatTheyDo, receipts, foundersRes, fundingRes, reputationRes] = await Promise.allSettled([
    deps.enrich(mainText),
    deps.receipts(domain),
    deps.founders(company, domain),
    deps.funding(company, domain),
    deps.reputation(company, domain),
  ]);

  return {
    company,
    whatTheyDo: orNull(whatTheyDo) ?? { type: 'no-llm' },
    receipts: orNull(receipts),
    founders: orNull(foundersRes),
    funding: orNull(fundingRes),
    reputation: orNull(reputationRes),
  };
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.action?.onClicked.addListener((tab) => {
    if (tab.windowId != null) chrome.sidePanel.open({ windowId: tab.windowId });
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'enrich') {
      handleEnrich(msg.mainText, [NanoAdapter, GroqAdapter]).then(sendResponse);
      return true;
    }
    if (msg?.type === 'brief') {
      assembleBrief(msg.url, msg.mainText, {
        enrich: (t) => handleEnrich(t, [NanoAdapter, GroqAdapter]),
        receipts: (d) => fetchReceipts(d),
        founders,
        funding,
        reputation,
      }).then(sendResponse);
      return true;
    }
    return;
  });
}
