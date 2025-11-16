"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";

type Lead = {
  id: string;
  created_at: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  suggested_price_cents: number | null;
  buy_now_price_cents: number | null;
  // Auction fields
  auction_enabled: boolean;
  auction_ends_at: string | null;
  buy_now_price: number | null;
  current_bid_amount: number | null;
  current_bid_agent_id: string | null;
};

export default function AvailableLeadsPage() {
  useRequireRole("agent");

  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [firstFreeAvailable, setFirstFreeAvailable] = useState(false);

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [biddingId, setBiddingId] = useState<string | null>(null);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [bidErrors, setBidErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError) {
          console.error(userError);
          setError("Failed to load user.");
          setLoading(false);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const currentUserId = user.id;
        setUserId(currentUserId);

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("first_free_redeemed")
          .eq("id", currentUserId)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
        }

        const alreadyRedeemed = profile?.first_free_redeemed === true;
        setFirstFreeAvailable(!alreadyRedeemed);

        const { data: leadsData, error: leadsError } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("status", "new")
          .order("created_at", { ascending: false });

        if (leadsError) {
          console.error(leadsError);
          setError("Failed to load leads.");
          setLoading(false);
          return;
        }

        setLeads((leadsData || []) as Lead[]);
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading available leads.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleClaimFree(leadId: string) {
    if (!userId) return;
    setError(null);
    setClaimingId(leadId);

    try {
      const res = await fetch("/api/leads/free-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, agentId: userId }),
      });

      const body = await res.json();

      if (!res.ok) {
        console.error("Free purchase error:", body);
        if (body?.error === "FIRST_LEAD_ALREADY_USED") {
          setError("You have already used your first free lead.");
          setFirstFreeAvailable(false);
        } else if (body?.error === "LEAD_NOT_AVAILABLE") {
          setError("That lead is no longer available.");
        } else {
          setError(body?.error || "Failed to claim free lead.");
        }
        return;
      }

      setFirstFreeAvailable(false);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      console.error(err);
      setError("Unexpected error claiming free lead.");
    } finally {
      setClaimingId(null);
    }
  }

  async function handleBuyNow(leadId: string, priceCents?: number | null) {
    if (!userId) return;
    setError(null);
    setBuyingId(leadId);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const body = await res.json();

      if (!res.ok || !body?.url) {
        console.error("Checkout create error:", body);
        setError(body?.error || "Failed to start checkout.");
        setBuyingId(null);
        return;
      }

      window.location.href = body.url;
    } catch (err) {
      console.error(err);
      setError("Unexpected error starting checkout.");
      setBuyingId(null);
    }
  }

  async function handlePlaceBid(leadId: string) {
    if (!userId) return;
    const amountStr = bidAmounts[leadId];
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setBidErrors((prev) => ({
        ...prev,
        [leadId]: "Please enter a valid bid amount",
      }));
      return;
    }

    setBiddingId(leadId);
    setBidErrors((prev) => ({ ...prev, [leadId]: "" }));

    try {
      const res = await fetch(`/api/leads/${leadId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, agentId: userId }),
      });

      const body = await res.json();

      if (!res.ok) {
        setBidErrors((prev) => ({
          ...prev,
          [leadId]: body?.error || "Failed to place bid",
        }));
        return;
      }

      // Update the lead in state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                current_bid_amount: body.lead.current_bid_amount,
                current_bid_agent_id: body.lead.current_bid_agent_id,
              }
            : lead
        )
      );

      // Clear bid input
      setBidAmounts((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    } catch (err) {
      console.error(err);
      setBidErrors((prev) => ({
        ...prev,
        [leadId]: "Unexpected error placing bid",
      }));
    } finally {
      setBiddingId(null);
    }
  }

  function formatUrgency(urgency: string | null) {
    if (!urgency) return "Unknown";
    const lower = urgency.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return urgency;
  }

  function formatPrice(priceCents: number | null | undefined) {
    if (!priceCents || priceCents <= 0) return "Set at checkout";
    return `$${(priceCents / 100).toFixed(2)}`;
  }

  function formatPriceDollars(price: number | null | undefined) {
    if (!price || price <= 0) return null;
    return `$${price.toFixed(2)}`;
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  function isAuctionEnded(endsAt: string | null) {
    if (!endsAt) return false;
    try {
      return new Date() > new Date(endsAt);
    } catch {
      return false;
    }
  }

  function canBid(lead: Lead) {
    if (!lead.auction_enabled) return false;
    if (lead.status !== "new" && lead.status !== "cold_unassigned") return false;
    if (isAuctionEnded(lead.auction_ends_at)) return false;
    return true;
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <header className="border-b border-[#ded3c2] bg-[#1f2933] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-white">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              Agent Portal
            </span>
          </div>
        </div>
      </header>

      <AgentNav />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Available leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            New pre-need inquiries you can buy, bid on, or use your one-time free lead on.
          </p>
        </div>

        {firstFreeAvailable && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">First lead free for new agents 🎉</p>
            <p className="mt-1">
              You can claim <span className="font-semibold">one</span> lead for
              free. After you use this once, this offer disappears and all
              future leads are pay-per-lead.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">
            There are no available leads right now. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const isHighestBidder = lead.current_bid_agent_id === userId;
              const auctionEnded = isAuctionEnded(lead.auction_ends_at);
              const showBidForm = canBid(lead);

              return (
                <div
                  key={lead.id}
                  className="rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          {formatUrgency(lead.urgency_level)} lead
                        </div>
                        {lead.auction_enabled && (
                          <span className="rounded-full bg-[#f7f4ef] px-2 py-0.5 text-[10px] font-medium text-[#6b6b6b]">
                            Auction
                          </span>
                        )}
                        {isHighestBidder && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                            You are highest bidder
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#2a2a2a]">
                        {lead.city || "Unknown location"}
                      </div>
                      <div className="text-xs text-[#6b6b6b]">
                        {lead.service_type || "Pre-need planning"}
                      </div>
                    </div>

                    <div className="text-right">
                      {lead.buy_now_price_cents && (
                        <div className="mb-1">
                          <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Buy now
                          </div>
                          <div className="text-sm font-semibold text-[#2a2a2a]">
                            {formatPrice(lead.buy_now_price_cents)}
                          </div>
                        </div>
                      )}
                      {lead.auction_enabled && (
                        <div>
                          <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Current bid
                          </div>
                          <div className="text-sm font-semibold text-[#2a2a2a]">
                            {lead.current_bid_amount
                              ? formatPriceDollars(lead.current_bid_amount)
                              : "No bids yet"}
                          </div>
                          {lead.auction_ends_at && (
                            <div className="mt-1 text-[10px] text-[#6b6b6b]">
                              {auctionEnded
                                ? "Auction ended"
                                : `Ends ${formatDateTime(lead.auction_ends_at)}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {lead.buy_now_price_cents && (
                        <button
                          onClick={() =>
                            handleBuyNow(lead.id, lead.buy_now_price_cents)
                          }
                          disabled={buyingId === lead.id}
                          className="rounded-full bg-[#2a2a2a] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        >
                          {buyingId === lead.id ? "Starting checkout…" : "Buy now"}
                        </button>
                      )}

                      {firstFreeAvailable && (
                        <button
                          onClick={() => handleClaimFree(lead.id)}
                          disabled={claimingId === lead.id}
                          className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        >
                          {claimingId === lead.id
                            ? "Claiming free lead…"
                            : "Use my one free lead"}
                        </button>
                      )}

                      <Link
                        href={`/agent/leads/${lead.id}`}
                        className="ml-auto text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                      >
                        View details →
                      </Link>
                    </div>

                    {showBidForm && (
                      <div className="rounded-md border border-[#ded3c2] bg-[#faf8f5] p-3">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[120px]">
                            <label className="mb-1 block text-[10px] font-medium text-[#6b6b6b]">
                              Your bid ($)
                            </label>
                            <input
                              type="number"
                              min={1}
                              step="1"
                              value={bidAmounts[lead.id] || ""}
                              onChange={(e) =>
                                setBidAmounts((prev) => ({
                                  ...prev,
                                  [lead.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                lead.current_bid_amount
                                  ? `Min: $${(lead.current_bid_amount + 0.01).toFixed(2)}`
                                  : "Enter amount"
                              }
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handlePlaceBid(lead.id)}
                            disabled={biddingId === lead.id}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                          >
                            {biddingId === lead.id ? "Placing bid…" : "Place bid"}
                          </button>
                        </div>
                        {bidErrors[lead.id] && (
                          <p className="mt-1 text-[10px] text-red-600">
                            {bidErrors[lead.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
