"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";
import { agentOwnsLead } from "@/lib/leads";
import clsx from "clsx";

type Lead = {
  id: string;
  created_at: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  suggested_price_cents: number | null;
  buy_now_price_cents: number | null;
  assigned_agent_id: string | null;
  // Auction fields
  auction_enabled?: boolean | null;
  auction_ends_at?: string | null;
  buy_now_price?: number | null;
  current_bid_amount?: number | null;
  current_bid_agent_id?: string | null;
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
  
  // Filter state
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  
  // Geographic search state
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  
  // Countdown timer state
  const [now, setNow] = useState(() => new Date());
  
  // Outbid detection - track previous highest bidder per lead
  const previousHighestByLeadRef = useRef<Record<string, string | null>>({});
  const [outbidMessage, setOutbidMessage] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to compute auction countdown
  function getRemainingTime(endsAt: string | null): {
    label: string;
    isEnded: boolean;
    secondsRemaining: number;
  } {
    if (!endsAt) {
      return { label: "No end time set", isEnded: false, secondsRemaining: Infinity };
    }

    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diffMs = end - now;

    if (diffMs <= 0) {
      return { label: "Ended", isEnded: true, secondsRemaining: 0 };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let label: string;
    if (totalSeconds < 60) {
      // Less than 60 seconds remaining
      label = "Ending soon";
    } else if (hours > 0) {
      label = `Ends in ${hours}h ${minutes.toString().padStart(2, "0")}m`;
    } else if (minutes > 0) {
      label = `Ends in ${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    } else {
      label = `Ends in ${seconds}s`;
    }

    return { label, isEnded: false, secondsRemaining: totalSeconds };
  }

  // Function to refresh leads (reusable for initial load, polling, and after actions)
  // Memoized with useCallback to prevent recreation on every render
  const refreshLeads = useCallback(async (isPolling = false) => {
    if (!isPolling) {
      setLoading(true);
      setError(null);
    }
    // IMPORTANT: Do NOT clear leads here - we want to keep existing leads visible during polling

    try {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError) {
        console.error(userError);
        if (!isPolling) {
          setError("Failed to load user.");
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (!isPolling) {
          router.push("/login");
        }
        return;
      }

      const currentUserId = user.id;
      if (!isPolling) {
        setUserId(currentUserId);
      }

      if (!isPolling) {
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
      }

      // TODO: in a future pass, restrict contact fields at the API level
      // so non-owning agents never receive full PII (name, email, phone).
      // For now, we mask these fields in the UI.
      
      // Fetch all available leads (filters applied client-side)
      const { data: leadsData, error: leadsError } = await supabaseClient
        .from("leads")
        .select("*")
        .eq("status", "new")
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error(leadsError);
        if (!isPolling) {
          setError("Failed to load leads.");
          setLoading(false);
        }
        return;
      }

      const newLeads = (leadsData || []) as Lead[];

      // Extract unique locations for filter dropdown (only on initial load)
      if (!isPolling) {
        const uniqueCities = Array.from(
          new Set(
            newLeads
              .map((lead) => lead.city)
              .filter((city): city is string => !!city)
          )
        ).sort();

        setAvailableLocations(uniqueCities);
      }

      // Detect outbid changes
      if (currentUserId) {
        // Determine current set of leads where this agent is highest bidder
        const newHighest = newLeads
          .filter(
            (l) =>
              l.auction_enabled &&
              l.current_bid_agent_id === currentUserId &&
              (l.status === "new" || l.status === "cold_unassigned")
          )
          .map((l) => l.id);

        // Check for leads where we were highest but are no longer
        newLeads.forEach((lead) => {
          if (
            lead.auction_enabled &&
            (lead.status === "new" || lead.status === "cold_unassigned")
          ) {
            const prevHighest = previousHighestByLeadRef.current[lead.id];
            const currentHighest = lead.current_bid_agent_id;

            // Check if we were highest before but not now (and lead is still active)
            if (
              prevHighest === currentUserId &&
              currentHighest !== null &&
              currentHighest !== currentUserId &&
              !newHighest.includes(lead.id)
            ) {
              // This agent has been outbid
              const urgency = lead.urgency_level
                ? lead.urgency_level.toLowerCase()
                : "";
              const city = lead.city || "Unknown location";
              setOutbidMessage(
                `You've been outbid on the ${urgency} lead in ${city}.`
              );
            }
          }
        });

        // Update refs for all auction-enabled leads
        newLeads.forEach((lead) => {
          if (lead.auction_enabled) {
            previousHighestByLeadRef.current[lead.id] =
              lead.current_bid_agent_id ?? null;
          }
        });
      }

      setLeads(newLeads);
    } catch (err) {
      console.error(err);
      if (!isPolling) {
        setError("Something went wrong loading available leads.");
        setLoading(false);
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [router]);

  // Track if initial load has completed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initial load
  useEffect(() => {
    refreshLeads(false).then(() => {
      setInitialLoadComplete(true);
    });
  }, [router, refreshLeads]);

  // Filters are applied client-side, so no need to reload when filters change

  // Polling effect (refresh every 3 seconds)
  // Only start polling after initial load completes
  // Use refs to access latest values without recreating interval
  const loadingRef = useRef(loading);
  const refreshLeadsRef = useRef(refreshLeads);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    refreshLeadsRef.current = refreshLeads;
  }, [refreshLeads]);

  useEffect(() => {
    if (!initialLoadComplete || !userId) return; // Wait for initial load and user

    const interval = setInterval(() => {
      // Only poll if we're not currently loading (to avoid conflicts with filter changes)
      if (!loadingRef.current) {
        refreshLeadsRef.current(true); // Polling mode (respects current filters via closure)
      }
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [initialLoadComplete, userId]); // Stable deps - interval created once

  // Auto-dismiss outbid message after 7 seconds
  useEffect(() => {
    if (!outbidMessage) return;
    const timeout = setTimeout(() => setOutbidMessage(null), 7000);
    return () => clearTimeout(timeout);
  }, [outbidMessage]);

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
      // Refresh leads after successful claim
      await refreshLeads(false);
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

      // Update the ref to track that we're now the highest bidder
      if (userId && body.lead.current_bid_agent_id === userId) {
        previousHighestByLeadRef.current[leadId] = userId;
      }

      // Clear bid input
      setBidAmounts((prev) => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });

      // Refresh leads after successful bid
      await refreshLeads(false);
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

  function canBid(lead: Lead) {
    // Explicitly check auction_enabled (handle null/undefined)
    const isAuctionEnabled = lead.auction_enabled === true;
    if (!isAuctionEnabled) return false;
    
    // Check lead is still available
    if (lead.status !== "new" && lead.status !== "cold_unassigned") return false;
    
    // Check auction hasn't ended
    const { isEnded } = getRemainingTime(lead.auction_ends_at ?? null);
    if (isEnded) return false;
    
    return true;
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Outbid toast notification */}
      {outbidMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black text-white text-sm px-4 py-2 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <span>{outbidMessage}</span>
            <button
              type="button"
              className="ml-3 text-xs underline"
              onClick={() => setOutbidMessage(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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

        {/* Geographic Search */}
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <h2 className="text-lg font-semibold text-slate-900 w-full sm:w-auto">Available leads</h2>
          <input
            type="text"
            placeholder="Search by city or postal code"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full sm:w-64"
          />
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full sm:w-48"
          >
            <option value="">All provinces</option>
            {availableLocations
              .filter((loc) => loc && !loc.includes(","))
              .map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
          </select>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2
              className="text-sm font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Filters
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {/* Urgency filter */}
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                Urgency
              </label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as "all" | "hot" | "warm" | "cold")}
                className="w-full rounded-md border border-[#ded3c2] bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
              >
                <option value="all">All</option>
                <option value="hot">HOT</option>
                <option value="warm">WARM</option>
                <option value="cold">COLD</option>
              </select>
            </div>

            {/* Location filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-md border border-[#ded3c2] bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                disabled={availableLocations.length === 0}
              >
                <option value="all">All locations</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Service type filter */}
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                Service type
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full rounded-md border border-[#ded3c2] bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
              >
                <option value="all">All service types</option>
                <option value="burial">Burial</option>
                <option value="cremation">Cremation</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Price range filters */}
            <div className="flex items-end gap-2">
              <div className="w-24">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Min price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full rounded-md border border-[#ded3c2] bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Max price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full rounded-md border border-[#ded3c2] bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                />
              </div>
            </div>

            {/* Clear filters button */}
            {(urgencyFilter !== "all" ||
              locationFilter !== "all" ||
              serviceFilter !== "all" ||
              minPrice !== "" ||
              maxPrice !== "") && (
              <button
                onClick={() => {
                  setUrgencyFilter("all");
                  setLocationFilter("all");
                  setServiceFilter("all");
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="rounded-md border border-[#ded3c2] bg-[#f7f4ef] px-4 py-2 text-xs font-medium text-[#2a2a2a] hover:bg-[#ded3c2] transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading && leads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">Loading leads…</p>
        ) : error && leads.length === 0 ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">
              {error} Please try refreshing the page.
            </p>
          </div>
        ) : (() => {
          // Apply client-side filters
          const filteredLeads = leads.filter((lead) => {
            // Geographic search filter - city or postal code
            const matchesLocation =
              !locationQuery ||
              lead.city?.toLowerCase().includes(locationQuery.toLowerCase()) ||
              lead.postal_code?.toLowerCase().includes(locationQuery.toLowerCase());

            // Province filter
            const matchesProvince =
              !provinceFilter || lead.province === provinceFilter;

            if (!matchesLocation || !matchesProvince) {
              return false;
            }

            // Urgency filter
            if (urgencyFilter !== "all") {
              const leadUrgency = (lead.urgency_level ?? "").toLowerCase();
              if (leadUrgency !== urgencyFilter.toLowerCase()) {
                return false;
              }
            }

            // Location filter
            if (locationFilter !== "all") {
              const city = (lead.city ?? "").toLowerCase();
              const selected = locationFilter.toLowerCase();
              if (city !== selected) return false;
            }

            // Service type filter
            if (serviceFilter !== "all") {
              const type = (lead.service_type ?? "").toLowerCase();
              if (type !== serviceFilter.toLowerCase()) return false;
            }

            // Price filter (using buy_now_price)
            if (minPrice || maxPrice) {
              const price = lead.buy_now_price ?? 0;
              const min = minPrice ? parseFloat(minPrice) : 0;
              const max = maxPrice ? parseFloat(maxPrice) : Infinity;
              if (isNaN(min) || isNaN(max)) return true; // Skip if invalid numbers
              if (price < min || price > max) return false;
            }

            return true;
          });

          if (filteredLeads.length === 0) {
            return (
              <p className="text-sm text-[#6b6b6b]">
                No leads match your filters. Try adjusting your search criteria.
              </p>
            );
          }

          return (
            <div className="space-y-3">
              {filteredLeads.map((lead) => {
              // Check if agent owns this lead
              const owns = userId ? agentOwnsLead(lead, userId) : false;
              
              // Explicitly check auction_enabled (handle null/undefined)
              const isAuctionEnabled = lead.auction_enabled === true;
              const isHighestBidder = lead.current_bid_agent_id === userId;
              const { isEnded: auctionEnded } = getRemainingTime(lead.auction_ends_at ?? null);
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
                        {isAuctionEnabled && (
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
                      {!owns && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          🔒 Purchase to reveal full name, phone, and email.
                        </p>
                      )}
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
                      {isAuctionEnabled && (
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
                            <div className="mt-1">
                              {(() => {
                                const { label, isEnded, secondsRemaining } = getRemainingTime(lead.auction_ends_at);
                                return (
                                  <span
                                    className={clsx(
                                      "inline-flex items-center rounded-full px-2 py-0.5 border text-[11px]",
                                      isEnded
                                        ? "border-slate-300 text-slate-400 bg-slate-50"
                                        : secondsRemaining < 60
                                        ? "border-red-300 text-red-700 bg-red-50"
                                        : "border-amber-300 text-amber-700 bg-amber-50"
                                    )}
                                  >
                                    {isEnded ? "Ended" : label}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {lead.buy_now_price_cents && !auctionEnded && (
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
                      {auctionEnded && (
                        <span className="text-xs text-slate-500 italic">Bidding closed</span>
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

                    {/* Auction section - show when auction is enabled and not expired */}
                    {isAuctionEnabled && !auctionEnded && (
                      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[11px] font-semibold text-slate-700">
                          Auction
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {lead.current_bid_amount
                            ? `Current bid: $${lead.current_bid_amount.toFixed(2)}`
                            : "No bids yet"}
                        </p>
                        {lead.auction_ends_at && (
                          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                              {(() => {
                                const { label, isEnded, secondsRemaining } = getRemainingTime(lead.auction_ends_at);
                                return (
                                  <span
                                    className={clsx(
                                      "inline-flex items-center rounded-full px-2 py-0.5 border text-[11px]",
                                      isEnded
                                        ? "border-slate-300 text-slate-400 bg-slate-50"
                                        : secondsRemaining < 60
                                        ? "border-red-300 text-red-700 bg-red-50"
                                        : "border-amber-300 text-amber-700 bg-amber-50"
                                    )}
                                  >
                                    {isEnded ? "Ended" : label}
                                  </span>
                                );
                              })()}
                          </div>
                        )}

                        {/* Place bid form - only show if auction is active and available */}
                        {showBidForm && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                step="0.01"
                                value={bidAmounts[lead.id] || ""}
                                onChange={(e) =>
                                  setBidAmounts((prev) => ({
                                    ...prev,
                                    [lead.id]: e.target.value,
                                  }))
                                }
                                className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                placeholder="Enter amount"
                              />
                              <button
                                onClick={() => handlePlaceBid(lead.id)}
                                disabled={biddingId === lead.id}
                                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                              >
                                {biddingId === lead.id ? "Placing bid…" : "Place bid"}
                              </button>
                            </div>
                            {lead.current_bid_amount && (
                              <p className="mt-1 text-[10px] text-slate-500">
                                Min: ${(lead.current_bid_amount + 0.01).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}
                        {!showBidForm && isAuctionEnabled && auctionEnded && (
                          <p className="mt-1 text-[10px] text-slate-500">Bidding closed</p>
                        )}
                        {bidErrors[lead.id] && (
                          <p className="mt-1 text-[11px] text-red-600">
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
          );
        })()}
      </section>
    </main>
  );
}
