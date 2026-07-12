import { selectAdapter, type LlmAdapter } from '../llm/adapter';
import { NanoAdapter } from '../llm/nano';
import { ClaudeAdapter } from '../llm/claude';
import type { DetectedClaim } from '../engine/types';
import type { EnrichResponse } from '../shared/messages';

export async function handleEnrich(
  mainText: string,
  claims: DetectedClaim[],
  adapters: LlmAdapter[],
): Promise<EnrichResponse> {
  const adapter = await selectAdapter(adapters);
  if (!adapter) return { type: 'no-llm' };
  try {
    const { whatTheyDo, claimLabels } = await adapter.enrich(mainText, claims);
    return { type: 'enriched', whatTheyDo, claimLabels };
  } catch {
    // Adapter failed (bad key, offline, model evicted) — degrade to rules-only.
    return { type: 'no-llm' };
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.action?.onClicked.addListener((tab) => {
    if (tab.windowId != null) chrome.sidePanel.open({ windowId: tab.windowId });
  });
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'enrich') return;
    handleEnrich(msg.mainText, msg.claims, [NanoAdapter, ClaudeAdapter]).then(sendResponse);
    return true;
  });
}
