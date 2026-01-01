"use client";

/**
 * Available Leads Page - Agent Portal
 * Buy-Now-Only: Fixed pricing based on urgency (Cold: $10, Warm: $20, Hot: $35)
 * Location-based filtering with Google Maps integration
 */

import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import AgentLeadCard, { AgentLead } from '@/components/agent/AgentLeadCard';
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
import LocationChangeModal from "@/components/agent/LocationChangeModal";
import { useBrowserGeolocation } from "@/lib/hooks/useBrowserGeolocation";
import { isWithinRadius } from "@/lib/distance";

// Using AgentLead type from component

export default function AvailableLeadsPage() {
  useRequireRole("agent");

  const router = useRouter();
  const [leads, setLeads] = useState<AgentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [firstFreeAvailable, setFirstFreeAvailable] = useState(false);

  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  // Filter state
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50); // Load 50 leads at a time
  const [totalLeads, setTotalLeads] = useState(0);
  const [hasMoreLeads, setHasMoreLeads] = useState(false);
  
  // Geographic search state
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [provinceFilter, setProvinceFilter] = useState<string>("");

  // Agent location state
  const [agentCity, setAgentCity] = useState<string | null>(null);
  const [agentProvince, setAgentProvince] = useState<string | null>(null);
  const [agentLat, setAgentLat] = useState<number | null>(null);
  const [agentLng, setAgentLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Browser geolocation - automatically request if location is not set
  // Only request if agent doesn't have location saved in database
  const shouldRequestGeo = !agentCity || !agentProvince || !agentLat || !agentLng;
  const { result: geoResult, loading: geoLoading } = useBrowserGeolocation(shouldRequestGeo);

  // Function to load more leads (pagination)
  const loadMoreLeads = useCallback(async () => {
    setCurrentPage(prev => prev + 1);
  }, []);

  // Function to refresh leads (reusable for initial load, polling, and after actions)
  // Memoized with useCallback to prevent recreation on every render
  const refreshLeads = useCallback(async (isPolling = false, resetPage = false, targetPage?: number) => {
    // Determine which page to use
    const pageToUse = targetPage !== undefined ? targetPage : (resetPage ? 0 : currentPage);
    
    if (resetPage) {
      setCurrentPage(0);
      setLeads([]);
    }
    
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
          .select("first_free_redeemed, agent_city, agent_province, agent_latitude, agent_longitude, search_radius_km")
          .eq("id", currentUserId)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
        }

        const alreadyRedeemed = profile?.first_free_redeemed === true;
        setFirstFreeAvailable(!alreadyRedeemed);

        // Load agent location from profile
        if (profile?.agent_city && profile?.agent_province && profile?.agent_latitude && profile?.agent_longitude) {
          setAgentCity(profile.agent_city);
          setAgentProvince(profile.agent_province);
          setAgentLat(profile.agent_latitude);
          setAgentLng(profile.agent_longitude);
          setSearchRadius(profile.search_radius_km || 50);
          setLocationInitialized(true);
        } else if (profile?.agent_province) {
          // Even if location isn't set, we need the province for filtering
          setAgentProvince(profile.agent_province);
        }
      }

      // TODO: in a future pass, restrict contact fields at the API level
      // so non-owning agents never receive full PII (name, email, phone).
      // For now, we mask these fields in the UI.
      
      // Build query with database-side filtering for scalability
      let query = supabaseClient
        .from("leads")
        .select("id, city, province, urgency_level, service_type, lead_price, additional_notes, assigned_agent_id, planning_for, latitude, longitude", { count: 'exact' })
        .is("assigned_agent_id", null); // Only unsold leads
      
      // Filter by province in database (CRITICAL for scalability)
      if (agentProvince) {
        query = query.eq("province", agentProvince);
      }
      
      // Apply pagination
      const from = pageToUse * pageSize;
      const to = from + pageSize - 1;
      query = query
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data: leadsData, error: leadsError, count } = await query;

      if (leadsError) {
        console.error(leadsError);
        if (!isPolling) {
          setError("Failed to load leads.");
          setLoading(false);
        }
        return;
      }

      // Set pagination state
      const totalCount = count || 0;
      setTotalLeads(totalCount);
      setHasMoreLeads((from + (leadsData?.length || 0)) < totalCount);

      // Map to AgentLead format
      const newLeads: AgentLead[] = (leadsData || []).map((lead: any) => {
        const urgency = (lead.urgency_level || "cold").toLowerCase() as 'hot' | 'warm' | 'cold';
        // Use lead_price from database (in dollars), or calculate from urgency if not set
        const leadPrice = lead.lead_price ?? getLeadPriceFromUrgency(lead.urgency_level);
        
        return {
          id: lead.id,
          urgency,
          city: lead.city,
          province: lead.province,
          service_type: lead.service_type,
          lead_price: leadPrice,
          additional_details: lead.additional_notes,
          planning_for: lead.planning_for,
          latitude: lead.latitude,
          longitude: lead.longitude,
        };
      });

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

        // Check for first free availability
        if (!isPolling && currentUserId) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("first_free_redeemed")
            .eq("id", currentUserId)
            .maybeSingle();

          const alreadyRedeemed = profile?.first_free_redeemed === true;
          setFirstFreeAvailable(!alreadyRedeemed);
        }

      // No outbid detection needed - buy-now-only

      // For pagination: append new leads if loading more pages, replace if resetting
      if (resetPage || pageToUse === 0) {
        setLeads(newLeads);
      } else {
        // Append to existing leads when loading more pages
        setLeads(prev => {
          // Avoid duplicates by checking if lead ID already exists
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueNewLeads = newLeads.filter(l => !existingIds.has(l.id));
          return [...prev, ...uniqueNewLeads];
        });
      }
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
  }, [router, currentPage, pageSize, agentProvince]);

  // Track if initial load has completed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initialize location - if profile has location, use it (already set in refreshLeads)
  useEffect(() => {
    if (agentCity && agentProvince && agentLat && agentLng) {
      setLocationInitialized(true);
      return;
    }
    setLocationInitialized(false);
  }, [agentCity, agentProvince, agentLat, agentLng]);

  // Save browser geolocation result if available and location is not set
  useEffect(() => {
    // Only save if we don't have location and geolocation succeeded
    if (locationInitialized) return; // Already have location
    if (!geoResult || !geoResult.latitude || !geoResult.longitude) return;
    if (!userId) return; // Wait for userId to be set

    const updateLocation = async () => {
      try {
        const response = await fetch("/api/agent/update-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: geoResult.city || "Unknown",
            province: geoResult.province || "BC",
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            search_radius_km: 50, // Default radius
            userId, // Send userId from authenticated session
          }),
        });

        if (response.ok) {
          setAgentCity(geoResult.city || "Unknown");
          setAgentProvince(geoResult.province || "BC");
          setAgentLat(geoResult.latitude);
          setAgentLng(geoResult.longitude);
          setSearchRadius(50);
          setLocationInitialized(true);
        }
      } catch (error) {
        console.error("Failed to save browser location:", error);
      }
    };

    updateLocation();
  }, [geoResult, locationInitialized, userId]);

  // Initial load - reset pagination
  useEffect(() => {
    refreshLeads(false, true).then(() => {
      setInitialLoadComplete(true);
    });
  }, [router, agentProvince]); // Reset when province changes

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


  async function handleLocationSave(
    city: string,
    province: string,
    lat: number,
    lng: number,
    radius: number
  ) {
    if (!userId) {
      setError("You must be logged in to update your location.");
      return;
    }

    try {
      const response = await fetch("/api/agent/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          province,
          latitude: lat,
          longitude: lng,
          search_radius_km: radius,
          userId, // Send userId from authenticated session
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update location.");
        return;
      }

      // Update location state immediately
      setAgentCity(city);
      setAgentProvince(province);
      setAgentLat(lat);
      setAgentLng(lng);
      setSearchRadius(radius);
      setLocationInitialized(true);
      
      // Force a re-render by updating a state that triggers filtering
      // The filtering will happen automatically in the render
    } catch (err) {
      console.error("Location update error:", err);
      setError("Failed to update location. Please try again.");
    }
  }

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
      // Redirect to success page or dashboard
      window.location.href = `/agent/leads/success?leadId=${leadId}&free=1`;
    } catch (err) {
      console.error(err);
      setError("Unexpected error claiming free lead.");
    } finally {
      setClaimingId(null);
    }
  }

  // Buy now is handled by the AgentLeadCard component which routes to /agent/leads/[id]/buy




  return (
    <div className="w-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
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
        
        {/* Location Indicator */}
        <div className="flex items-center gap-2">
          {!locationInitialized && geoLoading && (
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-500">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting location...
            </div>
          )}
          <button
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-[#2a2a2a] hover:bg-gray-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {agentCity && agentProvince
                ? `${agentCity}, ${agentProvince} • Within ${searchRadius} km`
                : "Set location"}
            </span>
          </button>
        </div>
      </div>

      {/* Location Change Modal */}
      <LocationChangeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentCity={agentCity}
        currentProvince={agentProvince}
        currentLat={agentLat}
        currentLng={agentLng}
        currentRadius={searchRadius}
        onSave={handleLocationSave}
      />

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
            placeholder="Search by city"
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
            // Distance-based filtering (if agent location is set) - STRICT: only show leads within radius
            if (agentLat && agentLng) {
              const leadLat = (lead as any).latitude;
              const leadLng = (lead as any).longitude;
              
              // Strict filtering: only show leads with coordinates that are within radius
              if (!isWithinRadius(agentLat, agentLng, leadLat, leadLng, searchRadius)) {
                return false;
              }
            }

            // Geographic search filter - city
            const matchesLocation =
              !locationQuery ||
              lead.city?.toLowerCase().includes(locationQuery.toLowerCase());

            // Province filter
            const matchesProvince =
              !provinceFilter || lead.province === provinceFilter;

            if (!matchesLocation || !matchesProvince) {
              return false;
            }

            // Urgency filter
            if (urgencyFilter !== "all") {
              if (lead.urgency !== urgencyFilter) {
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

            // Price filter (using lead_price in dollars)
            if (minPrice || maxPrice) {
              const price = lead.lead_price;
              const min = minPrice ? parseFloat(minPrice) : 0;
              const max = maxPrice ? parseFloat(maxPrice) : Infinity;
              if (isNaN(min) || isNaN(max)) return true; // Skip if invalid numbers
              if (price < min || price > max) return false;
            }

            return true;
          });

          if (filteredLeads.length === 0) {
            return (
              <div className="mt-6">
                <p className="text-sm text-neutral-500 mb-2">
                  {agentLat && agentLng
                    ? `No leads found within ${searchRadius} km of ${agentCity}, ${agentProvince}.`
                    : "No leads are currently available. Check back again soon."}
                </p>
                {agentLat && agentLng && (
                  <p className="text-xs text-neutral-400">
                    Try increasing your search radius or selecting a different location.
                  </p>
                )}
              </div>
            );
          }

          return (
            <div className="mt-6">
              {filteredLeads.map((lead: AgentLead) => (
                <AgentLeadCard 
                  key={lead.id} 
                  lead={lead} 
                  firstFreeAvailable={firstFreeAvailable}
                  onClaimFree={handleClaimFree}
                  agentId={userId}
                />
              ))}
            </div>
          );
        })()}
    </div>
  );
}

