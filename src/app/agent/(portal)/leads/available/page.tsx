"use client";

/**
 * Available Leads Page - Agent Portal
 * 
 * Timer behavior:
 * - Timer starts on first bid (auction_ends_at is set to now() + 30 minutes)
 * - Timer resets on each higher bid (auction_ends_at is reset to now() + 30 minutes)
 * - Bidding is disabled when timer expires or auction_status is 'closed'/'ended'
 * - Countdown displays "Time left: mm:ss" in amber inside the grey auction box
 */

import Link from "next/link";
import * as React from "react";
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
  auction_starts_at?: string | null;
  auction_ends_at?: string | null;
  auction_last_bid_at?: string | null;
  auction_status?: 'open' | 'scheduled' | 'ended' | 'closed' | null;
  auction_timezone?: string | null;
  starting_bid?: number | null;
  min_increment?: number | null;
  buy_now_price?: number | null;
  current_bid_amount?: number | null;
  current_bid_agent_id?: string | null;
  winning_agent_id?: string | null;
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
          router.push("/agent");
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
      
      // Fetch all available leads (unsold leads only - filters applied client-side)
      // Show leads where:
      // - assigned_agent_id is null (unsold), AND
      // - auction_status is NOT 'closed', OR
      // - auction_status is 'closed' BUT winning_agent_id matches current user (winner can see it)
      const { data: leadsData, error: leadsError } = await supabaseClient
        .from("leads")
        .select("*")
        .is("assigned_agent_id", null) // Only unsold leads
        .order("created_at", { ascending: false });

      if (leadsError) {
        console.error(leadsError);
        if (!isPolling) {
          setError("Failed to load leads.");
          setLoading(false);
        }
        return;
      }

      let newLeads = (leadsData || []) as Lead[];

      // Filter: exclude ended auctions unless current user is the winner
      if (currentUserId) {
        newLeads = newLeads.filter((lead: Lead) => {
          // If auction is ended, only show to the winner
          if (lead.auction_status === 'ended') {
            return lead.winning_agent_id === currentUserId;
          }
          // Show all non-ended leads (scheduled, open, or null)
          return true;
        });
      } else {
        // If no user ID, filter out ended auctions entirely
        newLeads = newLeads.filter((lead: Lead) => lead.auction_status !== 'ended');
      }

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

  async function handlePlaceBid(leadId: string, increment: number) {
    if (!userId) return;

    setBiddingId(leadId);
    setBidErrors((prev) => ({ ...prev, [leadId]: "" }));

    try {
      const res = await fetch(`/api/leads/${leadId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment, agentId: userId }),
      });

      const body = await res.json();

      if (!res.ok) {
        // Show the actual error message from the API
        const errorMessage = body?.error || body?.details || "Failed to place bid";
        setBidErrors((prev) => ({
          ...prev,
          [leadId]: errorMessage,
        }));
        console.error("Bid API error:", body);
        return;
      }

      // Update the ref to track that we're now the highest bidder
      if (userId && body.lead?.current_bid_agent_id === userId) {
        previousHighestByLeadRef.current[leadId] = userId;
      }

      // Update local state with the updated lead from API response
      if (body.lead) {
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === leadId ? { ...l, ...body.lead } : l))
        );
      }

      // Also refresh leads to ensure we have the latest data
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
    // Check auction_enabled - treat null/undefined as enabled
    const isAuctionEnabled = lead.auction_enabled !== false;
    if (!isAuctionEnabled) return false;
    
    // Check auction status
    if (lead.auction_status === 'ended') return false;
    if (lead.auction_status === 'scheduled') return false;
    
    // Must be 'open' to bid
    if (lead.auction_status !== 'open') return false;
    
    // Check if auction has ended by time
    if (lead.auction_ends_at) {
      const endAt = new Date(lead.auction_ends_at);
      const now = new Date();
      if (now >= endAt) return false; // Auction has ended
    }
    
    // Check lead is still available
    if (lead.status === "purchased_by_agent" || lead.assigned_agent_id) return false;
    
    return true;
  }

  function getAuctionStatusLabel(lead: Lead): string | null {
    if (!lead.auction_enabled) return null;
    
    const status = lead.auction_status;
    
    if (status === 'scheduled') {
      if (lead.auction_starts_at) {
        const startDate = new Date(lead.auction_starts_at);
        const localTime = startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return `Auction opens at ${localTime}`;
      }
      return 'Auction opens at 8:00 AM';
    }
    
    if (status === 'open') {
      return null; // Will show countdown instead
    }
    
    if (status === 'ended') {
      if (lead.winning_agent_id && userId && lead.winning_agent_id === userId) {
        return 'You\'ve won this lead. Complete purchase to view contact details.';
      }
      return 'Bidding closed';
    }
    
    return null;
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
              
              // Check auction_enabled - treat null/undefined as enabled (all leads have auctions now)
              const isAuctionEnabled = lead.auction_enabled !== false; // true or null/undefined = enabled
              const isHighestBidder = lead.current_bid_agent_id === userId;
              const showBidForm = canBid(lead);
              const auctionStatusLabel = getAuctionStatusLabel(lead);
              const startingBid = lead.starting_bid || 10;
              const minIncrement = lead.min_increment || 5;
              const currentBid = lead.current_bid_amount || startingBid;

              // Get Buy Now price - use existing price or default based on urgency
              // Also fix legacy low prices (like $1) to proper defaults
              const getBuyNowPrice = (): number | null => {
                const urgency = (lead.urgency_level || "warm").toLowerCase();
                
                // Determine proper default based on urgency
                let properDefault: number;
                if (urgency === "hot") properDefault = 3000; // $30
                else if (urgency === "warm") properDefault = 2000; // $20
                else properDefault = 1000; // $10 for cold or default
                
                // If lead has a price set, use it UNLESS it's a legacy low price (like $1 = 100 cents)
                if (lead.buy_now_price_cents != null) {
                  // If price is less than $5 (500 cents), treat it as legacy and use proper default
                  if (lead.buy_now_price_cents < 500) {
                    return properDefault;
                  }
                  return lead.buy_now_price_cents;
                }
                
                // Otherwise, use default based on urgency level
                return properDefault;
              };
              
              const buyNowPriceCents = getBuyNowPrice();

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
                      {buyNowPriceCents && (
                        <div className="mb-1">
                          <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Buy now
                          </div>
                          <div className="text-sm font-semibold text-[#2a2a2a]">
                            {formatPrice(buyNowPriceCents)}
                          </div>
                        </div>
                      )}
                      {isAuctionEnabled && (
                        <div>
                          <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                            {lead.auction_status === 'open' ? 'Current bid' : 'Start price'}
                          </div>
                          <div className="text-sm font-semibold text-[#2a2a2a]">
                            {lead.current_bid_amount
                              ? formatPriceDollars(lead.current_bid_amount)
                              : formatPriceDollars(startingBid)}
                          </div>
                          {auctionStatusLabel && (
                            <div className="mt-1 text-[10px] text-[#6b6b6b]">
                              {auctionStatusLabel}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Buy Now button - visibility rules based on auction status */}
                      {(() => {
                        const isClosed = lead.auction_status === 'ended';
                        const hasWinner = !!lead.winning_agent_id;
                        const isWinner = userId && lead.winning_agent_id === userId;
                        const canBuyNow = 
                          lead.assigned_agent_id === null && 
                          buyNowPriceCents != null &&
                          (
                            // Before close: anyone can buy
                            !isClosed ||
                            // After close: only winner can buy
                            (isClosed && hasWinner && isWinner)
                          );
                        
                        return canBuyNow ? (
                          <button
                            onClick={() =>
                              handleBuyNow(lead.id, buyNowPriceCents)
                            }
                            disabled={buyingId === lead.id}
                            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            {buyingId === lead.id 
                              ? "Starting checkout…" 
                              : `Buy now for $${((buyNowPriceCents || 0) / 100).toFixed(2)}`}
                          </button>
                        ) : isClosed && hasWinner && !isWinner ? (
                          <span className="text-xs text-slate-500 italic">Auction ended</span>
                        ) : null;
                      })()}

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

                    {/* Auction section - show when auction is enabled */}
                    {isAuctionEnabled && (
                      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[11px] font-semibold text-slate-700">
                          Auction
                        </p>
                        {auctionStatusLabel && (
                          <p className="mt-1 text-[11px] text-slate-600">
                            {auctionStatusLabel}
                          </p>
                        )}
                        {lead.auction_status === 'scheduled' && (
                          <>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {lead.auction_starts_at
                                ? (() => {
                                    const startDate = new Date(lead.auction_starts_at);
                                    const localTime = startDate.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    });
                                    return `Auction opens at ${localTime}`;
                                  })()
                                : 'Auction opens at 8:00 AM'}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500 italic">
                              Bidding will open soon.
                            </p>
                            {/* Disable bid buttons for scheduled auctions */}
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-2 opacity-50 pointer-events-none">
                                <button
                                  disabled
                                  className="rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white cursor-not-allowed"
                                >
                                  + $5
                                </button>
                                <button
                                  disabled
                                  className="rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white cursor-not-allowed"
                                >
                                  + $10
                                </button>
                                <button
                                  disabled
                                  className="rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white cursor-not-allowed"
                                >
                                  + $15
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {lead.auction_status === 'open' && (
                          <>
                            <p className="mt-1 text-[11px] text-slate-600">
                              {lead.current_bid_amount
                                ? `Current bid: $${lead.current_bid_amount.toFixed(2)}`
                                : `Starting bid: $${startingBid.toFixed(2)}`}
                            </p>
                            
                            <AuctionCountdown
                              auctionEndsAt={lead.auction_ends_at ?? null}
                              hasBids={!!lead.current_bid_amount && lead.current_bid_amount > 0}
                            />

                            {/* Preset bid buttons - only show if auction is active and available */}
                            {(() => {
                              // Pure function to check if expired (no hooks)
                              // Also check if auction_status is 'closed' or 'ended'
                              const isAuctionExpired = !!lead.auction_ends_at &&
                                new Date(lead.auction_ends_at).getTime() <= Date.now();
                              const status = lead.auction_status as string | null | undefined;
                              const isClosed = status === 'closed' || status === 'ended';
                              const shouldDisable = isAuctionExpired || isClosed || !showBidForm;
                              
                              if (!showBidForm && !isAuctionExpired && !isClosed) {
                                return null;
                              }
                              
                              return (
                                <div className="mt-2">
                                  <p className="mb-1 text-[10px] text-slate-500">
                                    Bid increments:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handlePlaceBid(lead.id, minIncrement)}
                                      disabled={shouldDisable || biddingId === lead.id}
                                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        shouldDisable
                                          ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
                                          : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                                      }`}
                                    >
                                      {biddingId === lead.id ? "Placing…" : `+ $${minIncrement}`}
                                    </button>
                                    <button
                                      onClick={() => handlePlaceBid(lead.id, minIncrement * 2)}
                                      disabled={shouldDisable || biddingId === lead.id}
                                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        shouldDisable
                                          ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
                                          : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                                      }`}
                                    >
                                      {biddingId === lead.id ? "Placing…" : `+ $${minIncrement * 2}`}
                                    </button>
                                    <button
                                      onClick={() => handlePlaceBid(lead.id, minIncrement * 3)}
                                      disabled={shouldDisable || biddingId === lead.id}
                                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        shouldDisable
                                          ? "bg-slate-400 text-white cursor-not-allowed opacity-50"
                                          : "bg-slate-900 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                                      }`}
                                    >
                                      {biddingId === lead.id ? "Placing…" : `+ $${minIncrement * 3}`}
                                    </button>
                                  </div>
                                  <p className="mt-1 text-[10px] text-slate-500">
                                    Next bid: ${(currentBid + minIncrement).toFixed(2)}
                                  </p>
                                </div>
                              );
                            })()}
                          </>
                        )}

                        {lead.auction_status === 'ended' && (
                          <>
                            {lead.winning_agent_id && userId && lead.winning_agent_id === userId ? (
                              <p className="mt-1 text-[11px] text-slate-600">
                                You've won this lead. Complete purchase to view contact details.
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] text-slate-600">
                                Bidding closed
                              </p>
                            )}
                          </>
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

// Auction countdown component - uses hooks properly (not in a loop)
type AuctionCountdownProps = {
  auctionEndsAt: string | null;
  hasBids: boolean;
};

function useCountdown(auctionEndsAt: string | null) {
  const [remainingMs, setRemainingMs] = React.useState<number | null>(() => {
    if (!auctionEndsAt) return null;
    const end = new Date(auctionEndsAt).getTime();
    const now = Date.now();
    return Math.max(end - now, 0);
  });

  React.useEffect(() => {
    if (!auctionEndsAt) return;

    const interval = setInterval(() => {
      const end = new Date(auctionEndsAt).getTime();
      const now = Date.now();
      const diff = end - now;
      setRemainingMs(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionEndsAt]);

  if (remainingMs === null) {
    return {
      label: null,
      isExpired: false,
    };
  }

  const isExpired = remainingMs <= 0;
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return {
    label: `${minutes}:${seconds}`,
    isExpired,
  };
}

function AuctionCountdown({ auctionEndsAt, hasBids }: AuctionCountdownProps) {
  const { label, isExpired } = useCountdown(auctionEndsAt);

  // No auction end set yet
  if (!auctionEndsAt) {
    return (
      <p className="mt-1 text-[10px] text-slate-500">
        No bids yet — be the first to bid
      </p>
    );
  }

  if (isExpired) {
    return (
      <p className="mt-1 text-[11px] font-medium text-slate-500">
        Bidding closed
      </p>
    );
  }

  return (
    <p className="mt-1 text-[11px] font-medium text-amber-700">
      Time left: {label}
    </p>
  );
}
