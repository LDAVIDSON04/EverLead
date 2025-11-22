"use client";

/**
 * Available Leads Page - Agent Portal
 * Buy-Now-Only: Fixed pricing based on urgency (Cold: $10, Warm: $20, Hot: $35)
 */

import Link from "next/link";
import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";
import { agentOwnsLead } from "@/lib/leads";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
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
  planning_for: string | null;
  additional_notes: string | null;
  lead_price: number | null;
  buy_now_price_cents: number | null;
  assigned_agent_id: string | null;
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
      const { data: leadsData, error: leadsError } = await supabaseClient
        .from("leads")
        .select("id, created_at, city, province, postal_code, urgency_level, status, service_type, planning_for, additional_notes, lead_price, buy_now_price_cents, assigned_agent_id")
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

      // No auction filtering needed - all unsold leads are available

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

      // No outbid detection needed - buy-now-only

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
        setError(body?.error || "Could not start checkout. Please try again.");
        setBuyingId(null);
        return;
      }

      // Redirect to Stripe checkout - Stripe will handle success/cancel URLs
      window.location.href = body.url;
    } catch (err) {
      console.error("Buy Now error:", err);
      setError("Could not start checkout. Please try again.");
      setBuyingId(null);
      // DO NOT redirect, logout, or call router.back() - just show error
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


  return (
    <main className="min-h-screen bg-[#f7f4ef]">


      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Available leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            New pre-need inquiries you can purchase or use your one-time free lead on.
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

            // Price filter (using lead_price or calculated from urgency)
            if (minPrice || maxPrice) {
              const price = lead.lead_price ?? getLeadPriceFromUrgency(lead.urgency_level);
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
              
              // Get Buy Now price - use lead_price if available, otherwise calculate from urgency
              const leadPrice = lead.lead_price ?? getLeadPriceFromUrgency(lead.urgency_level);
              const buyNowPriceCents = leadPrice * 100;
              
              // Get additional notes preview (first 2 lines or 100 chars)
              const additionalNotes = lead.additional_notes || "";
              const notesPreview = additionalNotes.length > 100 
                ? additionalNotes.substring(0, 100) + "..." 
                : additionalNotes;

              return (
                <div
                  key={lead.id}
                  className="rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          {formatUrgency(lead.urgency_level)} lead
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#2a2a2a]">
                        {lead.city || "Unknown location"}
                        {lead.province && `, ${lead.province}`}
                      </div>
                      <div className="mt-1 text-xs text-[#6b6b6b]">
                        Planning for: {lead.planning_for || "Not specified"}
                      </div>
                      <div className="mt-1 text-xs text-[#6b6b6b]">
                        Service type: {lead.service_type || "Not specified"}
                      </div>
                      {notesPreview && (
                        <div className="mt-2 text-xs text-[#4a4a4a] italic">
                          "{notesPreview}"
                        </div>
                      )}
                      {!owns && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          🔒 Purchase to reveal full name, phone, and email.
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="mb-2">
                        <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Buy now
                        </div>
                        <div className="text-lg font-semibold text-[#2a2a2a]">
                          ${leadPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {/* Buy Now button - always available for unsold leads */}
                    {lead.assigned_agent_id === null && (
                      <button
                        onClick={() => handleBuyNow(lead.id, buyNowPriceCents)}
                        disabled={buyingId === lead.id}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        {buyingId === lead.id 
                          ? "Starting checkout…" 
                          : `Buy now for $${leadPrice.toFixed(2)}`}
                      </button>
                    )}

                    {firstFreeAvailable && lead.assigned_agent_id === null && (
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

