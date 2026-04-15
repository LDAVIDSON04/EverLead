/**
 * Fire-and-forget logging for marketplace contact-only taps (search + public profile).
 * Server validates agent + contact_only; failures are ignored client-side.
 */
export type MarketplaceContactClickChannel = "reveal" | "phone" | "email";
export type MarketplaceContactClickSource = "search" | "agent_profile";

export function trackMarketplaceContactClick(params: {
  agentId: string;
  channel: MarketplaceContactClickChannel;
  source: MarketplaceContactClickSource;
}): void {
  const { agentId, channel, source } = params;
  if (!agentId) return;
  void fetch("/api/agents/marketplace-contact-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, channel, source }),
  }).catch(() => {});
}
