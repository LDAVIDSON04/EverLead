"use client";

// Time slot modal implementation

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { Search, Star, MapPin, Calendar, Clock, Stethoscope, Video, SlidersHorizontal, ChevronRight, X, ArrowLeft, Shield, ExternalLink, Menu, Instagram, Facebook } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
// Removed static imports - now using dynamic imports below
import { TrustHighlights } from "@/app/agent/[agentId]/components/TrustHighlights";
import { DateTime } from 'luxon';
import { cities as CANADIAN_CITIES } from "@/lib/cities";

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  city: string | null;
  province: string | null;
  service_type: string | null;
  price_cents: number | null;
  leads: {
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    province: string | null;
  } | null;
  agent?: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    job_title: string | null;
    agent_city?: string | null;
    agent_province?: string | null;
    business_address?: string | null;
    business_street?: string | null;
    business_city?: string | null;
    business_province?: string | null;
    business_zip?: string | null;
    rating?: number;
    reviewCount?: number;
    officeLocations?: Array<{
      id: string;
      name: string | null;
      city: string | null;
      street_address: string | null;
      province: string | null;
      postal_code: string | null;
      associated_firm?: string | null;
    }>;
    first_business_name?: string | null;
  } | null;
};

type AppointmentData = {
  id: any;
  requested_date: any;
  requested_window: any;
  status: any;
  city: any;
  province: any;
  service_type: any;
  price_cents: any;
  leads: {
    first_name: any;
    last_name: any;
    city: any;
    province: any;
  } | null | Array<{
    first_name: any;
    last_name: any;
    city: any;
    province: any;
  }>;
};

type AvailabilitySlot = {
  date: string;
  spots: number;
};

type AvailabilityDay = {
  date: string;
  timezone?: string; // Agent's timezone (e.g., "America/Toronto")
  slots: { startsAt: string; endsAt: string }[];
};

// Suggested specialties for service/specialist input (matches search API roles)
const SERVICE_SUGGESTIONS = [
  "Pre-need planning",
  "Estate lawyer",
  "Insurance agent",
  "Financial advisor",
];

// Dynamic imports for heavy components to improve initial load and reduce bundle size
const BookingPanel = dynamic(() => import("@/app/agent/[agentId]/components/BookingPanel").then(mod => ({ default: mod.BookingPanel })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false,
});

const OfficeLocationMap = dynamic(() => import("@/components/OfficeLocationMap").then(mod => ({ default: mod.OfficeLocationMap })), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />,
  ssr: false,
});

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const service = searchParams.get("service") || "";
  const mode = searchParams.get("mode") || "in-person";

  // Decode URL-encoded location for display
  const decodedLocation = location ? decodeURIComponent(location.replace(/\+/g, ' ')) : "";
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  // When in-person returns 0, we fetch video agents in same province and show this list
  const [videoFallbackAppointments, setVideoFallbackAppointments] = useState<Appointment[]>([]);
  const [showingVideoFallback, setShowingVideoFallback] = useState(false);
  const [videoFallbackAvailability, setVideoFallbackAvailability] = useState<Record<string, AvailabilityDay[]>>({});
  // Input values (what user is typing)
  const [inputQuery, setInputQuery] = useState(query);
  const [inputLocation, setInputLocation] = useState(decodedLocation);
  const [inputService, setInputService] = useState(service);
  // Actual search values (what was searched/submitted)
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchLocation, setSearchLocation] = useState(decodedLocation);
  const [searchService, setSearchService] = useState(service);
  // Location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  // Service/specialist suggestions (show 4 options on focus)
  const [showServiceSuggestionsDesktop, setShowServiceSuggestionsDesktop] = useState(false);
  const [showServiceSuggestionsMobile, setShowServiceSuggestionsMobile] = useState(false);

  // Handle location input change with autocomplete - memoized to prevent recreation
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputLocation(value);
    
    if (value.length > 0) {
      const filtered = CANADIAN_CITIES.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 80); // Show up to 80 matches (includes small cities across Canada)
      setLocationSuggestions(filtered);
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  }, []);

  // Handle location selection from dropdown - memoized
  const handleLocationSelect = useCallback((city: string) => {
    setInputLocation(city);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
    setSearchLocation(city);
    const params = new URLSearchParams();
    if (inputQuery) params.set("q", inputQuery);
    params.set("location", city);
    if (inputService) params.set("service", inputService);
    params.set("mode", mode);
    router.push(`/search?${params.toString()}`);
  }, [inputQuery, inputService, mode, router]);

  const handleServiceSuggestionSelect = useCallback((suggestion: string) => {
    setInputQuery(suggestion);
    setSearchQuery(suggestion);
    setShowServiceSuggestionsDesktop(false);
    setShowServiceSuggestionsMobile(false);
    const params = new URLSearchParams();
    params.set("q", suggestion);
    if (inputLocation) params.set("location", inputLocation);
    if (inputService) params.set("service", inputService);
    params.set("mode", mode);
    router.push(`/search?${params.toString()}`);
  }, [inputLocation, inputService, mode, router]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showMoreAvailability, setShowMoreAvailability] = useState(false);
  const [showMoreWeeks, setShowMoreWeeks] = useState(false);
  const [agentAvailability, setAgentAvailability] = useState<Record<string, AvailabilityDay[]>>({});
  const [availabilityDaysToShow, setAvailabilityDaysToShow] = useState<Record<string, number>>({});
  const [calendarDaysToShow, setCalendarDaysToShow] = useState<Record<string, number>>({});
  
  // Time slot modal state
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);
  const [selectedAgentIdForModal, setSelectedAgentIdForModal] = useState<string | null>(null);
  
  const [selectedAgentInfo, setSelectedAgentInfo] = useState<{
    full_name: string | null;
    profile_picture_url: string | null;
    job_title: string | null;
    funeral_home: string | null;
    first_business_name?: string | null;
    agent_city: string | null;
    agent_province: string | null;
    business_address: string | null;
    business_street: string | null;
    business_city: string | null;
    business_province: string | null;
    business_zip: string | null;
    officeLocations?: Array<{ city: string | null; associated_firm?: string | null }>;
  } | null>(null);
  const [dayTimeSlots, setDayTimeSlots] = useState<{ time: string; startsAt: string; endsAt: string; available: boolean }[]>([]);

  const [allAvailabilityDays, setAllAvailabilityDays] = useState<AvailabilityDay[]>([]); // Store all days with slots
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  // Portfolio modal state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioAgentData, setPortfolioAgentData] = useState<any>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioReviews, setPortfolioReviews] = useState<any[]>([]);
  const [portfolioReviewsLoading, setPortfolioReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // When showing video fallback (no in-person in city), booking should use video mode
  const effectiveBookingMode = showingVideoFallback && videoFallbackAppointments.length > 0 ? "video" : mode;
  
  // Debug: Log modal state changes
  useEffect(() => {
    console.log("Portfolio modal state changed:", { showPortfolioModal, hasData: !!portfolioAgentData, loading: portfolioLoading });
  }, [showPortfolioModal, portfolioAgentData, portfolioLoading]);

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchQuery(query);
    setInputQuery(query);
    if (location) {
      const decoded = decodeURIComponent(location.replace(/\+/g, ' '));
      setSearchLocation(decoded);
      setInputLocation(decoded);
    } else {
      setSearchLocation("");
      setInputLocation("");
    }
    setSearchService(service);
    setInputService(service);
  }, [query, location, service]);

  // No longer auto-detect location - user must provide location
  // Auto-detection is only used by homepage cards (See reviews, Book appointment)

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      setShowingVideoFallback(false);
      setVideoFallbackAppointments([]);
      setVideoFallbackAvailability({});
      try {
        // Build query params for agent search
        const params = new URLSearchParams();
        if (searchLocation) params.set("location", searchLocation);
        if (searchService) params.set("service", searchService);
        if (searchQuery) params.set("q", searchQuery);
        params.set("mode", mode);

        const res = await fetch(`/api/agents/search?${params.toString()}`);
        
        if (!res.ok) {
          console.error("Error loading agents:", res.statusText);
          setLoading(false);
          return;
        }

        const { agents } = await res.json();
        console.log(`✅ [SEARCH] Found ${agents?.length || 0} agents for location "${searchLocation}"`);

        // In-person with 0 results (same for all 4 professions: funeral, lawyer, insurance, financial):
        // Show "No in-person availability in your city" popup and list video agents in same profession + province
        if (mode === "in-person" && (agents?.length || 0) === 0 && searchLocation) {
          setShowingVideoFallback(true);
          const videoParams = new URLSearchParams();
          if (searchLocation) videoParams.set("location", searchLocation);
          if (searchService) videoParams.set("service", searchService);
          if (searchQuery) videoParams.set("q", searchQuery);
          videoParams.set("mode", "video");
          videoParams.set("fallback", "1"); // get ALL agents in province (same profession), not just those with video
          const videoRes = await fetch(`/api/agents/search?${videoParams.toString()}`);
          if (videoRes.ok) {
            const { agents: videoAgents } = await videoRes.json();
            if (videoAgents?.length > 0) {
              const videoMapped: Appointment[] = (videoAgents || []).map((agent: any) => ({
                id: agent.id,
                requested_date: new Date().toISOString().split("T")[0],
                requested_window: "flexible",
                status: "pending",
                city: agent.agent_city,
                province: agent.agent_province,
                service_type: agent.specialty || agent.job_title || "Pre-need Planning",
                price_cents: null,
                leads: {
                  first_name: agent.first_name,
                  last_name: agent.last_name,
                  city: agent.agent_city,
                  province: agent.agent_province,
                },
                agent: {
                  ...agent,
                  business_address: agent.business_address,
                  business_street: agent.business_street,
                  business_city: agent.business_city,
                  business_province: agent.business_province,
                  business_zip: agent.business_zip,
                  officeLocations: agent.officeLocations || [],
                },
              }));
              const videoAgentIds = videoMapped.map((apt) => apt.agent?.id).filter(Boolean) as string[];
              let videoReviewStats: Record<string, { averageRating: number; totalReviews: number }> = {};
              if (videoAgentIds.length > 0) {
                try {
                  const reviewResponse = await fetch("/api/reviews/agents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ agentIds: videoAgentIds }),
                  });
                  if (reviewResponse.ok) {
                    const reviewData = await reviewResponse.json();
                    videoReviewStats = reviewData.stats || {};
                  }
                } catch (err) {
                  console.error("Error fetching review stats for video fallback:", err);
                }
              }
              const videoWithReviews = videoMapped.map((apt) => {
                const agentId = apt.agent?.id;
                const stats = agentId ? videoReviewStats[agentId] : null;
                const totalReviews = Number(stats?.totalReviews) || 0;
                const averageRating = Number(stats?.averageRating) || 0;
                return {
                  ...apt,
                  agent: apt.agent ? {
                    ...apt.agent,
                    id: apt.agent.id,
                    rating: averageRating,
                    reviewCount: totalReviews,
                  } : undefined,
                };
              });
              const today = new Date();
              const startDate = today.toISOString().split("T")[0];
              const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
              // Video fallback: do not pass location so API returns agent's default schedule (their bookable slots)
              const videoAvailabilityPromises = videoWithReviews.map(async (apt) => {
                if (!apt.agent?.id) return null;
                try {
                  const url = `/api/agents/availability?agentId=${apt.agent.id}&startDate=${startDate}&endDate=${endDate}`;
                  const r = await fetch(url);
                  if (r.ok) {
                    const data: AvailabilityDay[] = await r.json();
                    return { agentId: apt.agent.id, availability: data };
                  }
                } catch (err) {
                  console.error("Error loading availability for video fallback agent:", err);
                }
                return null;
              });
              const videoAvailabilityResults = await Promise.all(videoAvailabilityPromises);
              const videoAvailabilityMap: Record<string, AvailabilityDay[]> = {};
              videoAvailabilityResults.forEach((result) => {
                if (result) videoAvailabilityMap[result.agentId] = result.availability;
              });
              setVideoFallbackAppointments(videoWithReviews);
              setVideoFallbackAvailability(videoAvailabilityMap);
              setAgentAvailability(videoAvailabilityMap); // so modal and handleDayClick have data
              setLoading(false);
              return; // don't overwrite agentAvailability with empty in-person data below
            }
            // Video fetch returned 0 agents: keep showing banner, empty list (handled in UI)
            setVideoFallbackAppointments([]);
            setVideoFallbackAvailability({});
          } else {
            setVideoFallbackAppointments([]);
            setVideoFallbackAvailability({});
          }
          setLoading(false);
          return;
        }

        // Map agents to appointment-like format for compatibility with existing UI
        const mappedAppointments: Appointment[] = (agents || []).map((agent: any) => ({
          id: agent.id,
          requested_date: new Date().toISOString().split("T")[0], // Placeholder
          requested_window: "flexible",
          status: "pending",
          city: agent.agent_city,
          province: agent.agent_province,
          service_type: agent.specialty || agent.job_title || "Pre-need Planning",
          price_cents: null,
          leads: {
            first_name: agent.first_name,
            last_name: agent.last_name,
            city: agent.agent_city,
            province: agent.agent_province,
          },
          agent: {
            ...agent,
            business_address: agent.business_address, // Include business address
            business_street: agent.business_street,
            business_city: agent.business_city,
            business_province: agent.business_province,
            business_zip: agent.business_zip,
            officeLocations: agent.officeLocations || [], // Include office locations
          }, // Store full agent data
        }));

        // Fetch review stats for all agents
        const agentIds = mappedAppointments.map((apt) => apt.agent?.id).filter(Boolean) as string[];
        let reviewStats: Record<string, { averageRating: number; totalReviews: number }> = {};
        
        if (agentIds.length > 0) {
          try {
            const reviewResponse = await fetch("/api/reviews/agents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agentIds }),
            });
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              reviewStats = reviewData.stats || {};
            }
          } catch (err) {
            console.error("Error fetching review stats:", err);
          }
        }

        // Add review stats to appointments (ensure numbers so we never show "0" when no reviews)
        const appointmentsWithReviews = mappedAppointments.map((apt) => {
          const agentId = apt.agent?.id;
          const stats = agentId ? reviewStats[agentId] : null;
          const totalReviews = Number(stats?.totalReviews) || 0;
          const averageRating = Number(stats?.averageRating) || 0;
          return {
            ...apt,
            agent: apt.agent ? {
              ...apt.agent,
              id: apt.agent.id, // Ensure id is always defined
              rating: averageRating,
              reviewCount: totalReviews,
            } : undefined,
          };
        });

        setAppointments(appointmentsWithReviews);

        // CRITICAL: Clear old availability data when location/search changes
        // This prevents showing stale data from previous location
        setAgentAvailability({});
        console.log(`🔄 [CALENDAR] Cleared agentAvailability for new search`, {
          searchLocation,
          searchQuery,
          agentCount: mappedAppointments.length,
        });

        // Load availability for each agent to show accurate availability counts
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const availabilityPromises = mappedAppointments.map(async (apt) => {
          if (!apt.agent?.id) return null;
          try {
            // For video mode, never pass location so API returns video schedule (not in-person by office)
            const locationParam = mode === "video" ? "" : (searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : "");
            const url = `/api/agents/availability?agentId=${apt.agent.id}&startDate=${startDate}&endDate=${endDate}${locationParam}`;
            
            console.log(`📅 [CALENDAR] Fetching availability for agent ${apt.agent.id}:`, {
              url,
              mode,
              searchLocation,
              locationParam,
            });
            
            const res = await fetch(url);
            if (res.ok) {
              const data: AvailabilityDay[] = await res.json();
              
              // Debug: Log what we got - EXPANDED to see full details
              console.log(`📅 [CALENDAR] Got availability for agent ${apt.agent.id}:`, {
                totalDays: data.length,
                daysWithSlots: data.filter(d => d.slots.length > 0).length,
                searchLocation,
                locationParam,
                days: data.map(d => {
                  // Parse date to get day name for verification
                  const [year, month, dayOfMonth] = d.date.split("-").map(Number);
                  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                  return {
                    date: d.date,
                    dayName,
                    slotCount: d.slots.length,
                    slots: d.slots.slice(0, 2).map(s => s.startsAt), // First 2 slots for debugging
                  };
                }),
                fullData: data, // Include full data for deep inspection
              });
              
              return { agentId: apt.agent.id, availability: data };
            }
          } catch (err) {
            console.error(`Error loading availability for agent ${apt.agent.id}:`, err);
          }
          return null;
        });

        const availabilityResults = await Promise.all(availabilityPromises);
        const availabilityMap: Record<string, AvailabilityDay[]> = {};
        availabilityResults.forEach((result) => {
          if (result) {
            availabilityMap[result.agentId] = result.availability;
          }
        });
        setAgentAvailability(availabilityMap);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, [searchQuery, searchLocation, searchService, mode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputQuery);
    setSearchLocation(inputLocation);
    setSearchService(inputService);

    const params = new URLSearchParams();
    if (inputQuery) params.set("q", inputQuery);
    if (inputLocation) params.set("location", inputLocation);
    if (inputService) params.set("service", inputService);
    params.set("mode", mode);
    router.push(`/search?${params.toString()}`);
  };

  // Generate availability slots for the calendar grid
  const generateAvailability = (appointment: Appointment, availabilityMap?: Record<string, AvailabilityDay[]>): AvailabilitySlot[] => {
    const slots: AvailabilitySlot[] = [];
    const today = new Date();
    const map = availabilityMap ?? agentAvailability;
    // Get real availability if we have it
    const agentId = appointment.agent?.id;
    const realAvailability = agentId ? map[agentId] : null;
    const daysToShow = agentId ? (calendarDaysToShow[agentId] || 8) : 8;
    
    // Debug: Log what we're using - CRITICAL for debugging
    console.log(`📅 [GENERATE AVAILABILITY] For agent ${agentId}:`, {
      agentId,
      hasRealAvailability: !!realAvailability,
      realAvailabilityLength: realAvailability?.length || 0,
      searchLocation,
      daysToShow,
      availabilityKeys: Object.keys(agentAvailability),
      currentAgentData: realAvailability ? {
        totalDays: realAvailability.length,
        daysWithSlots: realAvailability.filter(d => d.slots.length > 0).length,
        firstFewDays: realAvailability.slice(0, 5).map(d => {
          const [year, month, dayOfMonth] = d.date.split("-").map(Number);
          const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
          return {
            date: d.date,
            dayName,
            slotCount: d.slots.length,
          };
        }),
      } : null,
    });
    
    if (realAvailability && realAvailability.length > 0) {
      // Use real availability data from agent's settings
      const mapped = realAvailability.slice(0, daysToShow).map((day) => {
        // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts
        const [year, month, dayOfMonth] = day.date.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: "UTC" });
        const monthName = date.toLocaleDateString('en-US', { month: 'short', timeZone: "UTC" });
        const dayNum = date.getUTCDate();
        const fullDayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: "UTC" });
        
        // Get current time in agent's timezone for filtering past slots
        const agentTimezone = day.timezone || 'America/Toronto';
        const now = DateTime.now().setZone(agentTimezone);
        const todayDateStr = now.toISODate(); // YYYY-MM-DD format
        const isToday = day.date === todayDateStr;
        
        // Count slots - filter out past slots for today's date
        let slotCount = day.slots.length;
        if (isToday) {
          // For today, count only future slots
          slotCount = day.slots.filter(slot => {
            const slotTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' }).setZone(agentTimezone);
            return slotTime > now;
          }).length;
        }
        
        // Debug: Log specific dates
        if (day.date === "2026-01-01" || day.date === "2026-01-02") {
          console.log(`📅 [GENERATE AVAILABILITY] Mapping ${day.date}:`, {
            date: day.date,
            fullDayName,
            slotCount: day.slots.length,
            filteredSlotCount: slotCount,
            isToday,
            displayDate: `${dayName}\n${monthName} ${dayNum}`,
            agentId,
            searchLocation,
          });
        }
        
        return {
          date: `${dayName}\n${monthName} ${dayNum}`,
          spots: slotCount,
        };
      });
      
      // Debug: Log the full result
      console.log(`📅 [GENERATE AVAILABILITY] Final mapped result for agent ${agentId}:`, {
        agentId,
        searchLocation,
        mapped: mapped.map(m => ({
          displayDate: m.date,
          spots: m.spots,
        })),
      });
      
      return mapped;
    }
    
    // Fallback: generate placeholder slots if availability not loaded yet
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = date.getDate();
      
      // Show 0 spots until real data loads
      slots.push({
        date: `${dayName}\n${monthName} ${dayNum}`,
        spots: 0,
      });
    }
    
    return slots;
  };

  const handleMoreButtonClick = async (appointment: Appointment, index: number) => {
    if (!appointment.agent?.id) return;
    
    // Open modal with first available day
    const agentId = appointment.agent.id;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    
    setSelectedDayForModal(dateStr);
    setSelectedAgentIdForModal(agentId);
    setLoadingTimeSlots(true);
    setShowTimeSlotModal(true);
    
    // Fetch agent info and availability
    const fetchAgentInfo = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (!error && data) {
          const metadata = data.metadata || {};
          setSelectedAgentInfo({
            ...data,
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
            first_business_name: appointment.agent?.first_business_name ?? undefined,
            officeLocations: appointment.agent?.officeLocations ?? undefined,
          });
        }
      } catch (err) {
        console.error("Error loading agent info:", err);
      }
    };
    
    const fetchAvailability = async () => {
      try {
        const startDate = dateStr;
        // Fetch 14 days of availability (2 weeks)
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // When in video fallback (or video mode), do not pass location so API returns video schedule
        const locationParam = effectiveBookingMode === "in-person" && searchLocation
          ? `&location=${encodeURIComponent(searchLocation)}`
          : "";
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          
          // Store all availability days
          setAllAvailabilityDays(availabilityData);
          
          if (availabilityData.length > 0) {
            // Find first day with available slots
            const firstDayWithSlots = availabilityData.find(day => day.slots.length > 0) || availabilityData[0];
            setSelectedDayForModal(firstDayWithSlots.date);
            
            // Format slots for the first day in the agent's timezone
            const agentTimezone = firstDayWithSlots.timezone || 'America/Toronto';
            
            // Get current time in agent's timezone for filtering past slots
            const now = DateTime.now().setZone(agentTimezone);
            const todayDateStr = now.toISODate(); // YYYY-MM-DD format
            const isToday = firstDayWithSlots.date === todayDateStr;
            
            const formattedSlots = firstDayWithSlots.slots
              .map(slot => {
                const utcTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' });
                const agentLocalTime = utcTime.setZone(agentTimezone);
                
                const hours = agentLocalTime.hour;
                const minutes = agentLocalTime.minute;
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
                
                return {
                  time: timeStr,
                  startsAt: slot.startsAt,
                  endsAt: slot.endsAt,
                  available: true,
                  agentLocalTime // Keep for filtering
                };
              })
              .filter(slot => {
                // If it's today, filter out past time slots
                if (isToday) {
                  // Compare slot time with current time (both in agent's timezone)
                  return slot.agentLocalTime > now;
                }
                // For future dates, keep all slots
                return true;
              })
              .map(({ agentLocalTime, ...slot }) => slot); // Remove agentLocalTime from final output
            
            setDayTimeSlots(formattedSlots);
          } else {
            setDayTimeSlots([]);
          }
        } else {
          setDayTimeSlots([]);
          setAllAvailabilityDays([]);
        }
      } catch (err) {
        console.error("Error loading time slots:", err);
        setDayTimeSlots([]);
        setAllAvailabilityDays([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    
    Promise.all([fetchAgentInfo(), fetchAvailability()]);
  };

  // Generate time slots for a selected date
  const generateTimeSlots = (dateString: string): string[] => {
    // Generate time slots (9 AM to 5 PM, every hour)
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      const time = hour <= 12 
        ? `${hour === 12 ? 12 : hour}:00 ${hour < 12 ? 'AM' : 'PM'}`
        : `${hour - 12}:00 PM`;
      times.push(time);
    }
    
    // Randomly remove some times to simulate availability (keep 60-80% of slots)
    return times.filter(() => Math.random() > 0.25);
  };

  const handleDayClick = async (e: React.MouseEvent, appointment: Appointment, slot: AvailabilitySlot, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!slot.spots || slot.spots === 0 || !appointment.agent?.id) {
      return;
    }

    const agentId = appointment.agent.id;
    
    // Use same source as the grid: when in video fallback use videoFallbackAvailability so we never miss
    const realAvailability = agentId
      ? (showingVideoFallback && videoFallbackAvailability?.[agentId]
        ? videoFallbackAvailability[agentId]
        : agentAvailability[agentId])
      : null;
    
    if (!realAvailability || realAvailability.length === 0) {
      console.error("No availability data found for agent", agentId);
      return;
    }
    
    // Find the day that matches this slot's display date
    // The slot.date is in format "Thu\nJan 1" - we need to match it to the actual date in availability
    const dayDate = slot.date.split('\n')[1]; // Extract "Jan 1" from "Thu\nJan 1"
    const dateMatch = dayDate.match(/(\w+)\s+(\d+)/);
    if (!dateMatch) {
      console.error("Could not parse date from slot:", slot.date);
      return;
    }
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = dateMatch[1];
    const dayNum = parseInt(dateMatch[2]);
    const monthIndex = monthNames.indexOf(monthName);
    
    if (monthIndex === -1) {
      console.error("Invalid month name:", monthName);
      return;
    }
    
    // Find the matching day in availability data by matching month and day
    // This ensures we get the correct year (could be 2025, 2026, etc.)
    const matchingDay = realAvailability.find(day => {
      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
      return month === monthIndex + 1 && dayOfMonth === dayNum;
    });
    
    if (!matchingDay) {
      console.error("Could not find matching day in availability data:", { monthIndex, dayNum, availableDates: realAvailability.map(d => d.date) });
      return;
    }
    
    // Use the actual date from the availability data (this has the correct year!)
    const dateStr = matchingDay.date; // This is already in YYYY-MM-DD format with correct year
    
    console.log("📅 [HANDLE DAY CLICK] Matched slot to date:", {
      slotDisplay: slot.date,
      parsedMonthDay: `${monthName} ${dayNum}`,
      matchedDate: dateStr,
      slotCount: matchingDay.slots.length,
    });
    
    // Store today for use in fetchAvailability
    const todayForFetch = new Date();
    
    // Set modal state
    setSelectedDayForModal(dateStr);
    setSelectedAgentIdForModal(agentId);
    setLoadingTimeSlots(true);
    setShowTimeSlotModal(true);
    
    // Fetch agent info and availability in parallel
    const fetchAgentInfo = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (!error && data) {
          const metadata = data.metadata || {};
          setSelectedAgentInfo({
            ...data,
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
            first_business_name: appointment.agent?.first_business_name ?? undefined,
            officeLocations: appointment.agent?.officeLocations ?? undefined,
          });
        }
      } catch (err) {
        console.error("Error loading agent info:", err);
      }
    };
    
    const fetchAvailability = async () => {
      try {
        const startDate = dateStr;
        // Fetch 14 days of availability (2 weeks) to show multiple days in modal
        const endDate = new Date(todayForFetch.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // When in video fallback (or video mode), do not pass location so API returns video schedule
        const locationParam = effectiveBookingMode === "in-person" && searchLocation
          ? `&location=${encodeURIComponent(searchLocation)}`
          : "";
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          
          console.log("📅 [MODAL] Fetched availability data:", {
            totalDays: availabilityData.length,
            daysWithSlots: availabilityData.filter(d => d.slots.length > 0).length,
            selectedDate: dateStr,
            allDays: availabilityData.map(d => ({
              date: d.date,
              slotCount: d.slots.length,
              firstSlot: d.slots[0]?.startsAt || null
            }))
          });
          
          // CRITICAL: Always store all availability days, even if empty
          // This is what the modal checks to determine if slots are available
          setAllAvailabilityDays(availabilityData);
          
          // Find the selected day's data - ensure exact string match
          // Normalize both dates to YYYY-MM-DD format for comparison
          const normalizedDateStr = dateStr.trim();
          const dayData = availabilityData.find(d => {
            const normalizedDayDate = d.date.trim();
            const matches = normalizedDayDate === normalizedDateStr;
            if (!matches && availabilityData.length > 0) {
              console.log("🔍 [MODAL] Date mismatch:", {
                lookingFor: normalizedDateStr,
                checking: normalizedDayDate,
                matches,
                allDates: availabilityData.map(d => d.date)
              });
            }
            return matches;
          });
          
          console.log("📅 [MODAL] Selected day data:", {
            dateStr: normalizedDateStr,
            found: !!dayData,
            slotCount: dayData?.slots.length || 0,
            dayDate: dayData?.date,
            slots: dayData?.slots.slice(0, 3).map(s => s.startsAt) || [] // Show first 3 for debugging
          });
          
          // CRITICAL: Always ensure the clicked day exists in allAvailabilityDays
          // If the clicked day has no slots, we still need to show it in the modal
          // Add it to the array if it's missing
          let updatedAvailabilityDays = [...availabilityData];
          if (!dayData) {
            // The clicked day doesn't exist in the availability data - add it with empty slots
            console.log("📅 [MODAL] Adding clicked day with no slots to availability data:", normalizedDateStr);
            updatedAvailabilityDays.push({
              date: normalizedDateStr,
              slots: []
            });
            // Sort by date to keep days in order
            updatedAvailabilityDays.sort((a, b) => a.date.localeCompare(b.date));
            setAllAvailabilityDays(updatedAvailabilityDays);
          } else if (dayData.slots.length === 0) {
            // Day exists but has no slots - this is fine, it will show in the modal
            console.log("📅 [MODAL] Clicked day has no slots:", {
              date: normalizedDateStr,
              message: "Day will be shown in modal with 'no slots' message"
            });
          }
          
          // Set dayTimeSlots for backward compatibility (though modal uses allAvailabilityDays)
          if (dayData && dayData.slots.length > 0) {
            // Format time slots in the agent's timezone
            const formattedSlots = dayData.slots.map(slot => {
              const agentTimezone = dayData.timezone || 'America/Toronto';
              const utcTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' });
              const agentLocalTime = utcTime.setZone(agentTimezone);
              
              const hours = agentLocalTime.hour;
              const minutes = agentLocalTime.minute;
              const ampm = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 || 12;
              const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
              
              return {
                time: timeStr,
                startsAt: slot.startsAt,
                endsAt: slot.endsAt,
                available: true
              };
            });
            
            setDayTimeSlots(formattedSlots);
          } else {
            console.warn("📅 [MODAL] Selected day has no slots:", {
              dateStr: normalizedDateStr,
              dayData: dayData ? "exists but empty slots" : "not found",
              allDays: availabilityData.map(d => ({ date: d.date, slots: d.slots.length }))
            });
            setDayTimeSlots([]);
          }
        } else {
          const errorText = await res.text();
          console.error("❌ [MODAL] Failed to fetch availability:", {
            status: res.status,
            statusText: res.statusText,
            error: errorText
          });
          setAllAvailabilityDays([]);
          setDayTimeSlots([]);
        }
      } catch (err) {
        console.error("Error loading time slots:", err);
        setAllAvailabilityDays([]);
        setDayTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    
    // Fetch both in parallel
    Promise.all([fetchAgentInfo(), fetchAvailability()]);
  };
  
  const handleTimeSlotClick = (timeSlot: { time: string; startsAt: string; endsAt: string }) => {
    if (!selectedAgentIdForModal || !selectedDayForModal) return;
    
    const params = new URLSearchParams({
      startsAt: timeSlot.startsAt,
      endsAt: timeSlot.endsAt,
      date: selectedDayForModal,
    });
    
    // Build absolute URL
    const bookingUrl = `${window.location.origin}/book/step1/${selectedAgentIdForModal}?${params.toString()}`;
    console.log("FORCE NAVIGATING to:", bookingUrl);
    
    // Close modal
    closeTimeSlotModal();
    
    // Force immediate navigation - no delays, no React interference
    window.location.assign(bookingUrl);
  };
  
  const closeTimeSlotModal = () => {
    setShowTimeSlotModal(false);
    setSelectedDayForModal(null);
    setSelectedAgentIdForModal(null);
    setSelectedAgentInfo(null);
    setDayTimeSlots([]);
    setAllAvailabilityDays([]);
  };
  
  // Handle date selection in modal - show time slots for selected date
  const handleDateSelectInModal = (date: string) => {
    const selectedDay = allAvailabilityDays.find(day => day.date === date);
    if (selectedDay) {
      setSelectedDayForModal(date);
      // Format time slots in the agent's timezone
      const formattedSlots = selectedDay.slots.map(slot => {
        const agentTimezone = selectedDay.timezone || 'America/Toronto';
        const utcTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' });
        const agentLocalTime = utcTime.setZone(agentTimezone);
        
        const hours = agentLocalTime.hour;
        const minutes = agentLocalTime.minute;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
        
        return {
          time: timeStr,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          available: true
        };
      });
      setDayTimeSlots(formattedSlots);
    }
  };

  const handleShowMoreWeeks = async (agentId: string) => {
    if (!showMoreWeeks) {
      // Load next 2 weeks (14 days total)
      try {
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const locationParam = effectiveBookingMode === "in-person" && searchLocation
          ? `&location=${encodeURIComponent(searchLocation)}`
          : "";
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          setAgentAvailability((prev) => ({
            ...prev,
            [agentId]: availabilityData,
          }));
          setAvailabilityDaysToShow((prev) => ({
            ...prev,
            [agentId]: 14,
          }));
          setShowMoreWeeks(true);
        }
      } catch (err) {
        console.error("Error loading more availability:", err);
      }
    } else {
      // Already showing 2 weeks, just toggle the display
      setShowMoreWeeks(false);
      setAvailabilityDaysToShow((prev) => ({
        ...prev,
        [agentId]: 7,
      }));
    }
  };

  const handleBookAgent = (agentId: string) => {
    // Navigate to agent booking page (old flow - keeping for compatibility)
    window.location.href = `/book/agent/${agentId}`;
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setSelectedAppointmentIndex(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowMoreAvailability(false);
    setShowMoreWeeks(false);
  };

  // Handle time slot click in old modal - navigate to Step 1 booking page
  const handleTimeSlotClickOld = (agentId: string | undefined, timeSlot: any, dayDate: string) => {
    console.log("handleTimeSlotClick called:", { agentId, timeSlot, dayDate });
    
    if (!agentId) {
      console.error("Missing agentId");
      alert("Error: Agent information is missing. Please try again.");
      return;
    }
    
    if (!timeSlot?.startsAt || !timeSlot?.endsAt) {
      console.error("Missing time slot data:", { startsAt: timeSlot?.startsAt, endsAt: timeSlot?.endsAt });
      alert("Error: Time slot information is missing. Please try again.");
      return;
    }
    
    if (!dayDate) {
      console.error("Missing date");
      alert("Error: Date information is missing. Please try again.");
      return;
    }
    
    try {
      const params = new URLSearchParams({
        startsAt: timeSlot.startsAt,
        endsAt: timeSlot.endsAt,
        date: dayDate,
      });
      if (searchLocation) {
        params.set("city", searchLocation);
      }
      if (mode) {
        params.set("mode", mode);
      }
      const url = `/book/step2?agentId=${agentId}&${params.toString()}`;
      console.log("Navigating to:", url);
      
      // Force navigation immediately
      window.location.href = url;
    } catch (error) {
      console.error("Error navigating:", error);
      alert("Error navigating to booking page. Please try again.");
    }
  };

  const filters = [
    { icon: Calendar, label: "I'm flexible" },
    { icon: Clock, label: "Time of day" },
    { icon: Stethoscope, label: "Service type" },
    { icon: MapPin, label: "Distance" },
    { icon: Video, label: "In-person/video" },
    { icon: SlidersHorizontal, label: "More filters" },
  ];

  const avatarColors = [
    'bg-neutral-700',
    'bg-neutral-800',
    'bg-neutral-900',
  ];

  return (
    <div className="bg-white flex flex-col min-h-screen">
      {/* Appointment Booking Modal */}
      {selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop itself, not links, buttons, or forms
            if (e.target === e.currentTarget) {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'A' && !target.closest('a') && 
                  target.tagName !== 'BUTTON' && !target.closest('button') &&
                  target.tagName !== 'FORM' && !target.closest('form')) {
                closeModal();
              }
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-50"
            onClick={(e) => {
              // NEVER stop propagation for links, buttons, or forms - let them handle clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A' || target.closest('a') || 
                  target.tagName === 'BUTTON' || target.closest('button') ||
                  target.tagName === 'FORM' || target.closest('form')) {
                return; // Let link/button/form handle its own click
              }
              e.stopPropagation();
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-black text-xl font-semibold">Book an appointment</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Agent Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                {selectedAppointment.agent?.profile_picture_url ? (
                  <img
                    src={selectedAppointment.agent.profile_picture_url}
                    alt={selectedAppointment.agent.full_name || "Agent"}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                ) : (
                <div className={`w-16 h-16 ${avatarColors[selectedAppointmentIndex % avatarColors.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-2xl">
                      {selectedAppointment.agent?.full_name?.[0]?.toUpperCase() ||
                       selectedAppointment.leads?.first_name?.[0]?.toUpperCase() ||
                       'A'}
                  </span>
                </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-black mb-1 text-lg font-semibold">
                    {selectedAppointment.agent?.full_name ||
                     (selectedAppointment.leads 
                      ? `${selectedAppointment.leads.first_name || ''} ${selectedAppointment.leads.last_name || ''}`.trim() || 'Pre-need Specialist'
                       : 'Pre-need Specialist')}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {selectedAppointment.agent?.job_title ||
                     selectedAppointment.service_type || 
                     'Pre-need Planning Specialist'}
                  </p>
                  {(selectedAppointment.agent?.first_business_name || selectedAppointment.agent?.funeral_home) && (
                    <p className="text-gray-500 text-xs mb-2">{selectedAppointment.agent?.first_business_name || selectedAppointment.agent?.funeral_home}</p>
                  )}
                  
                  {(Number(selectedAppointment.agent?.rating) || 0) > 0 && (Number(selectedAppointment.agent?.reviewCount) || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-neutral-600 text-neutral-600" />
                      <span className="text-sm text-black">{(Number(selectedAppointment.agent?.rating) || 0).toFixed(1)}</span>
                      <span className="text-sm text-gray-500">· {Number(selectedAppointment.agent?.reviewCount) || 0} {(Number(selectedAppointment.agent?.reviewCount) || 0) === 1 ? 'review' : 'reviews'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Available Appointments */}
            <div className="p-6">
              <h3 className="text-black mb-4 font-semibold">Available appointments</h3>
              
              {/* Show days with their time slots */}
              {(() => {
                const agentId = selectedAppointment?.agent?.id;
                const agentAvailabilityData = agentId ? agentAvailability[agentId] : null;
                const daysToShow = agentId ? (availabilityDaysToShow[agentId] || 7) : 7;
                
                if (!agentAvailabilityData || agentAvailabilityData.length === 0) {
                  // Fallback: show placeholder
                  return (
                    <div className="text-gray-500 text-sm">
                      Loading availability...
                    </div>
                  );
                }
                
                // Show days (7 or 14 based on showMoreWeeks) with their time slots
                return agentAvailabilityData.slice(0, daysToShow).map((day, dayIdx) => {
                  // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts
                  const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: "UTC" });
                  const monthName = date.toLocaleDateString('en-US', { month: 'short', timeZone: "UTC" });
                  const dayNum = date.getUTCDate();
                  const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                  
                  // Convert slots to time strings
                  // Use getHours() instead of getUTCHours() to convert from UTC to local time for display
                  const timeSlots = day.slots.map((slot) => {
                    const slotDate = new Date(slot.startsAt);
                    const hours = slotDate.getHours(); // Use getHours() for local time display
                    const minutes = slotDate.getMinutes(); // Use getMinutes() for local time display
                    const ampm = hours >= 12 ? "PM" : "AM";
                    const displayHours = hours % 12 || 12;
                    return {
                      time: `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`,
                      startsAt: slot.startsAt,
                      endsAt: slot.endsAt,
                    };
                  });
                  
                  if (timeSlots.length === 0) return null;
                  
                  return (
                    <div key={dayIdx} className="mb-6">
                      <p className="text-black mb-3 font-medium">{displayDate}</p>
                      <div className="flex flex-wrap gap-2" style={{ position: 'relative', zIndex: 1 }}>
                        {timeSlots.map((timeSlot, timeIdx) => {
                          const timeKey = `${day.date}-${timeSlot.time}`;
                          const isSelected = selectedTime === timeKey;
                          
                          // Build URL
                          const bookingUrl = (() => {
                            if (!agentId || !timeSlot.startsAt || !timeSlot.endsAt || !day.date) {
                              return null;
                            }
                            const params = new URLSearchParams({
                              startsAt: timeSlot.startsAt,
                              endsAt: timeSlot.endsAt,
                              date: day.date,
                            });
                            if (searchLocation) {
                              params.set("city", searchLocation);
                            }
                            if (effectiveBookingMode) {
                              params.set("mode", effectiveBookingMode);
                            }
                            return `/book/step2?agentId=${agentId}&${params.toString()}`;
                          })();
                          
                          if (!bookingUrl) {
                    return (
                      <button
                        key={timeIdx}
                                type="button"
                                disabled
                                className="px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                              >
                                {timeSlot.time}
                      </button>
                    );
                          }
                    
                    return (
                            <form
                                key={timeIdx}
                              action={bookingUrl || '#'}
                              method="get"
                              onSubmit={(e) => {
                                e.stopPropagation();
                                // Close modal before navigation
                                closeModal();
                                // Let form submit naturally - don't prevent default
                              }}
                              style={{ display: 'inline' }}
                            >
                              <button
                                type="submit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Don't close modal here - let form onSubmit handle it
                                }}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-neutral-600 text-white'
                                    : 'bg-neutral-100 text-black hover:bg-neutral-200'
                                }`}
                                style={{
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {timeSlot.time}
                              </button>
                            </form>
                            );
                          })}
                        </div>
                      </div>
                    );
                });
              })()}
              
              {/* Show More button for next 2 weeks */}
              {(() => {
                const agentId = selectedAppointment?.agent?.id;
                const agentAvailabilityData = agentId ? agentAvailability[agentId] : null;
                const daysToShow = agentId ? (availabilityDaysToShow[agentId] || 7) : 7;
                
                if (!agentId || !agentAvailabilityData || agentAvailabilityData.length === 0) {
                  return null;
                }
                
                return (
                  <button
                    onClick={() => handleShowMoreWeeks(agentId)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-black hover:bg-gray-50 transition-colors mt-4"
                  >
                    {showMoreWeeks ? "Show less" : "Show more availability"}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Header - tighter vertical padding on mobile so content sits higher */}
      <header className="bg-white border-b-0 md:border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 py-3 pb-2 md:py-4">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-1">
              {/* Logo and Soradin */}
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/Soradin.png"
                  alt="Soradin Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <span className="text-xl font-semibold text-gray-900">Soradin</span>
              </Link>

              {/* Hamburger Menu Button - Top right */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-700 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 mt-4 pt-4">
              <form onSubmit={handleSearch} className="space-y-3">
                <input
                  type="text"
                  placeholder="Service or specialist"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 text-base"
                />
                <input
                  type="text"
                  placeholder="Service type"
                  value={inputService}
                  onChange={(e) => setInputService(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 text-base"
                />
                <button 
                  type="submit"
                  className="w-full bg-neutral-800 text-white px-6 py-2 rounded-lg hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Desktop Header - Original Layout */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">Soradin</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Service or specialist"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onFocus={() => setShowServiceSuggestionsDesktop(true)}
                    onBlur={() => setTimeout(() => setShowServiceSuggestionsDesktop(false), 200)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  {showServiceSuggestionsDesktop && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {SERVICE_SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleServiceSuggestionSelect(s);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Location"
                    value={inputLocation}
                    onChange={handleLocationChange}
                    onFocus={() => {
                      if (inputLocation.length > 0) {
                        const filtered = CANADIAN_CITIES.filter(city => 
                          city.toLowerCase().includes(inputLocation.toLowerCase())
                        ).slice(0, 10);
                        setLocationSuggestions(filtered);
                        setShowLocationDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowLocationDropdown(false), 200);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
                  />
                  {/* Location Autocomplete Dropdown */}
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2">
                        {locationSuggestions.map((city, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleLocationSelect(city);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-900"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  className="bg-neutral-800 text-white px-6 py-2 rounded-lg hover:bg-neutral-900 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content - flex-1 so footer stays at bottom; minimal top padding on mobile so content sits higher */}
      <main className="flex-1 max-w-[1200px] mx-auto px-4 pt-2 pb-6 md:py-6 w-full">

        {/* Desktop Results Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900">
            {loading ? "Loading..." : `${appointments.length} ${appointments.length === 1 ? 'provider' : 'providers'} available`}
          </h2>
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: Providers count, Date, Service bar, then Location Search Bar */}
        <div className="md:hidden mb-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base text-gray-900 font-medium">
              {loading ? "Loading..." : `${appointments.length} ${appointments.length === 1 ? 'provider' : 'providers'} available`}
            </h2>
            <button type="button" className="flex items-center gap-1 shrink-0 text-gray-700 hover:text-gray-900 text-sm">
              <span className="truncate">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Service or specialist"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onFocus={() => setShowServiceSuggestionsMobile(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowServiceSuggestionsMobile(false);
                  const params = new URLSearchParams();
                  if (inputQuery) params.set("q", inputQuery);
                  if (inputLocation) params.set("location", inputLocation);
                  if (inputService) params.set("service", inputService);
                  params.set("mode", mode);
                  router.push(`/search?${params.toString()}`);
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const params = new URLSearchParams();
                  if (inputQuery) params.set("q", inputQuery);
                  if (inputLocation) params.set("location", inputLocation);
                  if (inputService) params.set("service", inputService);
                  params.set("mode", mode);
                  router.push(`/search?${params.toString()}`);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 text-base"
            />
            {showServiceSuggestionsMobile && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                onMouseDown={(e) => e.preventDefault()}
              >
                {SERVICE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleServiceSuggestionSelect(s);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Location"
              value={inputLocation}
              onChange={handleLocationChange}
              onFocus={() => {
                if (inputLocation.length > 0) {
                  const filtered = CANADIAN_CITIES.filter(city => 
                    city.toLowerCase().includes(inputLocation.toLowerCase())
                  ).slice(0, 10);
                  setLocationSuggestions(filtered);
                  setShowLocationDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowLocationDropdown(false);
                  setSearchLocation(inputLocation);
                  const params = new URLSearchParams();
                  if (inputQuery) params.set("q", inputQuery);
                  if (inputLocation) params.set("location", inputLocation);
                  if (inputService) params.set("service", inputService);
                  params.set("mode", mode);
                  router.push(`/search?${params.toString()}`);
                }, 200);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowLocationDropdown(false);
                  setSearchLocation(inputLocation);
                  const params = new URLSearchParams();
                  if (inputQuery) params.set("q", inputQuery);
                  if (inputLocation) params.set("location", inputLocation);
                  if (inputService) params.set("service", inputService);
                  params.set("mode", mode);
                  router.push(`/search?${params.toString()}`);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 text-base"
            />
            {/* Location Autocomplete Dropdown */}
            {showLocationDropdown && locationSuggestions.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-2">
                  {locationSuggestions.map((city, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleLocationSelect(city);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-900"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Cards */}
        {(() => {
          const displayAppointments = showingVideoFallback && videoFallbackAppointments.length > 0 ? videoFallbackAppointments : appointments;
          const displayMode = showingVideoFallback && videoFallbackAppointments.length > 0 ? "video" : mode;
          const displayAvailability = showingVideoFallback && videoFallbackAppointments.length > 0 ? videoFallbackAvailability : agentAvailability;
          const showEmptyState = displayAppointments.length === 0;
          return loading ? (
          <div className="text-center py-12 min-h-[320px] flex flex-col items-center justify-center" aria-busy="true">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : showEmptyState ? (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600 mb-6 text-lg font-medium">
                There are no available providers in your city.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  href="/"
                  className="inline-block bg-neutral-800 hover:bg-neutral-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 min-h-[200px]">
            {showingVideoFallback && videoFallbackAppointments.length > 0 && (
              <div className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-2xl p-8 mb-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1.5">
                      No in-person availability in your city
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      There are no agents available for in-person meetings in your city. Here are some agents available to put your plan in place over a video call:
                    </p>
                  </div>
                </div>
              </div>
            )}
            {displayAppointments.map((appointment, index) => {
              // Add location to key to force re-render when location changes
              const availability = generateAvailability(appointment, displayAvailability);
              const specialistName = appointment.leads 
                ? `${appointment.leads.first_name || ''} ${appointment.leads.last_name || ''}`.trim() || 'Pre-need Specialist'
                : 'Pre-need Specialist';
              const location = appointment.city && appointment.province
                ? `${appointment.city}, ${appointment.province}`
                : appointment.city || appointment.province || 'Location not specified';
              
              const agent = appointment.agent;
              const agentName = agent 
                ? `${agent.full_name || ''}`.trim() || `${appointment.leads?.first_name || ''} ${appointment.leads?.last_name || ''}`.trim()
                : specialistName;
              const agentId = agent?.id || appointment.id;
              
              // Find office location that matches the search location; otherwise use first office so we show one firm + one address (not all locations)
              type OfficeLoc = { street_address: string | null; city: string | null; province: string | null; postal_code: string | null; associated_firm?: string | null };
              let displayOfficeLocation: OfficeLoc | null = null;
              if (agent?.officeLocations && agent.officeLocations.length > 0) {
                const normalizeLocation = (loc: string | null | undefined): string => {
                  if (!loc) return '';
                  let normalized = loc.split(',').map(s => s.trim())[0];
                  normalized = normalized.replace(/\s+office$/i, '').trim();
                  return normalized.toLowerCase();
                };
                if (searchLocation) {
                  const searchCity = normalizeLocation(decodeURIComponent(searchLocation.replace(/\+/g, ' ')));
                  const matching = agent.officeLocations.find((loc: any) =>
                    normalizeLocation(loc.city) === searchCity
                  );
                  displayOfficeLocation = (matching as OfficeLoc) || (agent.officeLocations[0] as OfficeLoc);
                } else {
                  displayOfficeLocation = agent.officeLocations[0] as OfficeLoc;
                }
              }
              // In-person: show only the firm for the office we're displaying (matching or first). Never show all firms.
              const displayFirmName = displayMode === "video"
                ? (agent?.first_business_name || agent?.funeral_home)
                : (displayOfficeLocation?.associated_firm || agent?.first_business_name || agent?.funeral_home);
              
              // Address for the same office we're showing (so location + address match)
              const displayAddress = displayOfficeLocation 
                ? (displayOfficeLocation.street_address && displayOfficeLocation.city && displayOfficeLocation.province && displayOfficeLocation.postal_code
                    ? `${displayOfficeLocation.street_address}, ${displayOfficeLocation.city}, ${displayOfficeLocation.province} ${displayOfficeLocation.postal_code}`
                    : displayOfficeLocation.street_address && displayOfficeLocation.city && displayOfficeLocation.province
                    ? `${displayOfficeLocation.street_address}, ${displayOfficeLocation.city}, ${displayOfficeLocation.province}`
                    : displayOfficeLocation.city && displayOfficeLocation.province
                    ? `${displayOfficeLocation.city}, ${displayOfficeLocation.province}`
                    : displayOfficeLocation.city || null)
                : (agent?.business_street && agent?.business_city && agent?.business_province && agent?.business_zip
                    ? `${agent.business_street}, ${agent.business_city}, ${agent.business_province} ${agent.business_zip}`
                    : agent?.business_address || null);
              // Location line: show the office city we're displaying (so it matches the address below), not the search city when different
              const displayLocationLabel = displayOfficeLocation?.city && displayOfficeLocation?.province
                ? `${displayOfficeLocation.city}, ${displayOfficeLocation.province}`
                : (searchLocation ? decodeURIComponent(searchLocation.replace(/\+/g, ' ')) : location ? decodeURIComponent(location.replace(/\+/g, ' ')) : 'Location not specified');
              
              return (
                <div key={`${appointment.id}-${searchLocation}`} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  {/* Desktop: Side-by-side layout - Provider info left, Day blocks right */}
                  <div className="hidden md:flex gap-0 items-start">
                    {/* Left Section: Provider Info */}
                    <div className="flex-shrink-0 w-[30%] min-w-0">
                      {/* Top row: Profile pic with name/title/company to the right */}
                      <div className="flex gap-4 mb-2">
                        {/* Agent Avatar */}
                        <div className="flex-shrink-0">
                          {agent?.profile_picture_url ? (
                            <img
                              src={agent.profile_picture_url}
                              alt={agentName}
                              className="w-16 h-16 rounded-full object-cover"
                              width={64}
                              height={64}
                              loading="lazy"
                            />
                          ) : (
                          <div className={`w-16 h-16 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center`}>
                              <span className="text-white text-2xl">{agentName[0]?.toUpperCase() || 'A'}</span>
                          </div>
                          )}
                        </div>

                        {/* Name, title, company to the right of pic */}
                        <div className="flex-1 min-w-0">
                          <div>
                            <h3 className="text-xl text-gray-900 font-semibold">{agentName}</h3>
                            <p className="text-gray-600 mt-1">
                              {agent?.job_title || appointment.service_type || 'Pre-need Planning Specialist'}
                            </p>
                            {displayFirmName && (
                              <p className="text-gray-500 text-sm mt-1">{displayFirmName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Below profile pic: Location, address (in-person only), rating, learn more (wrapping around) */}
                      <div className="mt-2 space-y-1">
                        {/* Location & address - only for in-person; for video fallback show "Video call" */}
                        {displayMode !== "video" ? (
                          <>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600 text-sm">
                                {displayLocationLabel}
                              </span>
                            </div>
                            {displayAddress && (
                              <div className="flex items-start gap-1">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-500 text-xs">
                                  {displayAddress}
                                </span>
                              </div>
                            )}
                          </>
                        ) : null}

                        {/* Rating - only show when agent has at least one review */}
                        {agent && (Number(agent.rating) || 0) > 0 && (Number(agent.reviewCount) || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-900 text-sm">{(Number(agent.rating) || 0).toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">· {Number(agent.reviewCount) || 0} {(Number(agent.reviewCount) || 0) === 1 ? 'review' : 'reviews'}</span>
                          </div>
                        )}

                        {/* Learn more about button */}
                        {agent?.id && (
                          <div>
                            <button
                              type="button"
                              onClick={async (e) => {
                                console.log("Portfolio button clicked for agent:", agent.id);
                                e.preventDefault();
                                e.stopPropagation();
                                
                                console.log("Setting modal to show");
                                setShowPortfolioModal(true);
                                setPortfolioLoading(true);
                                setPortfolioAgentData(null);
                                setPortfolioReviews([]);
                                setShowAllReviews(false);
                                
                                try {
                                  console.log("Fetching agent data for:", agent.id);
                                  const { data, error } = await supabaseClient
                                    .from("profiles")
                                    .select("id, full_name, first_name, last_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, email, phone, metadata, ai_generated_bio, bio_approval_status, approval_status")
                                    .eq("id", agent.id)
                                    .eq("role", "agent")
                                    .maybeSingle();
                                  
                                  if (error) {
                                    console.error("Error loading agent:", error);
                                  } else if (data) {
                                    console.log("Agent data loaded:", data);
                                    const metadata = data.metadata || {};
                                    const specialty = (metadata as any)?.specialty || null;
                                    const licenseNumber = (metadata as any)?.license_number || null;
                                    const location = data.agent_city && data.agent_province
                                      ? `${data.agent_city}, ${data.agent_province}`
                                      : data.agent_city || data.agent_province || 'Location not specified';
                                    
                                    // Single unified approval - check only approval_status
                                    if (data.approval_status !== "approved") {
                                      setPortfolioAgentData(null);
                                      return;
                                    }
                                    
                                    // Use AI-generated bio if it exists (bios are auto-approved on creation)
                                    const hasApprovedBio = !!data.ai_generated_bio;
                                    const fallbackSummary = `${data.full_name || 'This agent'} brings years of compassionate expertise in end-of-life planning and grief support. ${specialty || 'They help'} families navigate difficult decisions with dignity and care.`;
                                    const fallbackFullBio = `${data.full_name || 'This agent'}'s journey into end-of-life care is driven by a commitment to helping families during life's most challenging moments.\n\n${specialty || 'Their expertise'} allows them to address both the emotional and practical aspects of end-of-life planning.\n\nThey are known for their patient, non-judgmental approach and their ability to facilitate difficult family conversations.`;
                                    
                                    // Fetch review stats
                                    let rating = 0;
                                    let reviewCount = 0;
                                    try {
                                      const reviewResponse = await fetch(`/api/reviews/agent/${agent.id}`);
                                      if (reviewResponse.ok) {
                                        const reviewData = await reviewResponse.json();
                                        rating = reviewData.averageRating || 0;
                                        reviewCount = reviewData.totalReviews || 0;
                                        // Set the reviews for display
                                        setPortfolioReviews(reviewData.reviews || []);
                                      } else {
                                        setPortfolioReviews([]);
                                      }
                                    } catch (err) {
                                      console.error("Error fetching review stats:", err);
                                      setPortfolioReviews([]);
                                    }
                                    
                                    setPortfolioAgentData({
                                      ...data,
                                      business_address: (metadata as any)?.business_address || null,
                                      business_street: (metadata as any)?.business_street || null,
                                      business_city: (metadata as any)?.business_city || null,
                                      business_province: (metadata as any)?.business_province || null,
                                      business_zip: (metadata as any)?.business_zip || null,
                                      specialty: specialty,
                                      license_number: licenseNumber,
                                      credentials: licenseNumber ? `LFD, ${licenseNumber}` : 'LFD',
                                      rating: rating,
                                      reviewCount: reviewCount,
                                      verified: true,
                                      location: location,
                                      summary: hasApprovedBio ? data.ai_generated_bio.split('\n\n')[0] || data.ai_generated_bio : fallbackSummary,
                                      fullBio: hasApprovedBio ? data.ai_generated_bio : fallbackFullBio,
                                      aiGeneratedBio: hasApprovedBio ? data.ai_generated_bio : null,
                                    });
                                  }
                                } catch (err) {
                                  console.error("Error:", err);
                                } finally {
                                  setPortfolioLoading(false);
                                }
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              className="text-gray-900 hover:text-gray-700 underline decoration-black hover:decoration-gray-700 text-sm font-medium transition-colors cursor-pointer bg-transparent border-none p-0 relative z-10"
                            >
                              Learn more about {agentName}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Section: Day Blocks Grid - relative z-10 so clicks aren't blocked */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className="grid grid-cols-4 gap-2 w-full">
                        {availability.map((slot, slotIndex) => {
                          const hasSpots = slot.spots > 0;
                          return (
                            <button
                              key={slotIndex}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hasSpots && appointment.agent?.id) {
                                  handleDayClick(e, appointment, slot, index);
                                }
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              disabled={!hasSpots}
                              className={`
                                relative px-3 py-2 rounded-lg border text-center text-sm transition-colors select-none
                                ${hasSpots 
                                  ? 'bg-neutral-800 text-white border-neutral-800 hover:bg-neutral-900 cursor-pointer' 
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}
                              `}
                            >
                              {hasSpots && displayMode === 'video' && (
                                <span className="absolute top-1 right-1 text-white pointer-events-none" aria-hidden>
                                  <Video className="w-5 h-5" strokeWidth={2.5} />
                                </span>
                              )}
                              <div className="whitespace-pre-line leading-tight pointer-events-none">{slot.date}</div>
                              <div className="text-xs mt-1 whitespace-pre-line pointer-events-none">
                                <span className="hidden md:inline">{hasSpots ? slot.spots + '\nappointments' : 'No\nappointments'}</span>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMoreButtonClick(appointment, index);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-neutral-800 hover:bg-neutral-50 text-sm flex items-center justify-center"
                        >
                          More
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Picture with text wrapping around */}
                  <div className="md:hidden">
                    <div className="flex gap-4 items-start">
                      {/* Agent Avatar - Mobile: picture only */}
                      <div className="flex-shrink-0">
                        {agent?.profile_picture_url ? (
                          <img
                            src={agent.profile_picture_url}
                            alt={agentName}
                            className="w-16 h-16 rounded-full object-cover"
                            width={64}
                            height={64}
                            loading="lazy"
                          />
                        ) : (
                        <div className={`w-16 h-16 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center`}>
                            <span className="text-white text-2xl">{agentName[0]?.toUpperCase() || 'A'}</span>
                        </div>
                        )}
                      </div>

                      {/* Mobile: Name, job title, and company to the right of picture - wrapping around */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl text-gray-900 font-semibold leading-tight mb-1">{agentName}</h3>
                        <p className="text-gray-600 text-sm leading-tight mb-1">
                          {agent?.job_title || appointment.service_type || 'Pre-need Planning Specialist'}
                        </p>
                        {displayFirmName && (
                          <p className="text-gray-500 text-sm leading-tight">{displayFirmName}</p>
                        )}
                      </div>
                    </div>

                    {/* Mobile: Info under profile pic - location/address for in-person, "Video call" for video fallback */}
                    <div className="mt-2 space-y-1">
                        {displayMode !== "video" ? (
                          <>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                              <span className="text-gray-600 text-sm">
                                {displayLocationLabel}
                              </span>
                            </div>
                            {displayAddress && (
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-500 text-xs">
                                  {displayAddress}
                                </span>
                              </div>
                            )}
                          </>
                        ) : null}

                        {/* Rating with star - only show when agent has at least one review */}
                        {agent && (Number(agent.rating) || 0) > 0 && (Number(agent.reviewCount) || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-900 text-sm">{(Number(agent.rating) || 0).toFixed(1)}</span>
                            <span className="text-gray-500 text-sm">· {Number(agent.reviewCount) || 0} {(Number(agent.reviewCount) || 0) === 1 ? 'review' : 'reviews'}</span>
                          </div>
                        )}

                        {/* 4. Learn more about */}
                        {agent?.id && (
                          <div>
                            <button
                              type="button"
                              onClick={async (e) => {
                                console.log("Portfolio button clicked for agent:", agent.id);
                                e.preventDefault();
                                e.stopPropagation();
                                
                                console.log("Setting modal to show");
                                setShowPortfolioModal(true);
                                setPortfolioLoading(true);
                                setPortfolioAgentData(null);
                                setPortfolioReviews([]);
                                setShowAllReviews(false);
                                
                                try {
                                  console.log("Fetching agent data for:", agent.id);
                                  const { data, error } = await supabaseClient
                                    .from("profiles")
                                    .select("id, full_name, first_name, last_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, email, phone, metadata, ai_generated_bio, bio_approval_status, approval_status")
                                    .eq("id", agent.id)
                                    .eq("role", "agent")
                                    .maybeSingle();
                                  
                                  if (error) {
                                    console.error("Error loading agent:", error);
                                  } else if (data) {
                                    console.log("Agent data loaded:", data);
                                    const metadata = data.metadata || {};
                                    const specialty = (metadata as any)?.specialty || null;
                                    const licenseNumber = (metadata as any)?.license_number || null;
                                    const location = data.agent_city && data.agent_province
                                      ? `${data.agent_city}, ${data.agent_province}`
                                      : data.agent_city || data.agent_province || 'Location not specified';
                                    
                                    // Single unified approval - check only approval_status
                                    if (data.approval_status !== "approved") {
                                      setPortfolioAgentData(null);
                                      return;
                                    }
                                    
                                    // Use AI-generated bio if it exists (bios are auto-approved on creation)
                                    const hasApprovedBio = !!data.ai_generated_bio;
                                    const fallbackSummary = `${data.full_name || 'This agent'} brings years of compassionate expertise in end-of-life planning and grief support. ${specialty || 'They help'} families navigate difficult decisions with dignity and care.`;
                                    const fallbackFullBio = `${data.full_name || 'This agent'}'s journey into end-of-life care is driven by a commitment to helping families during life's most challenging moments.\n\n${specialty || 'Their expertise'} allows them to address both the emotional and practical aspects of end-of-life planning.\n\nThey are known for their patient, non-judgmental approach and their ability to facilitate difficult family conversations.`;
                                    
                                    // Fetch review stats
                                    let rating = 0;
                                    let reviewCount = 0;
                                    try {
                                      const reviewResponse = await fetch(`/api/reviews/agent/${agent.id}`);
                                      if (reviewResponse.ok) {
                                        const reviewData = await reviewResponse.json();
                                        rating = reviewData.averageRating || 0;
                                        reviewCount = reviewData.totalReviews || 0;
                                        // Set the reviews for display
                                        setPortfolioReviews(reviewData.reviews || []);
                                      } else {
                                        setPortfolioReviews([]);
                                      }
                                    } catch (err) {
                                      console.error("Error fetching review stats:", err);
                                      setPortfolioReviews([]);
                                    }
                                    
                                    setPortfolioAgentData({
                                      ...data,
                                      business_address: (metadata as any)?.business_address || null,
                                      business_street: (metadata as any)?.business_street || null,
                                      business_city: (metadata as any)?.business_city || null,
                                      business_province: (metadata as any)?.business_province || null,
                                      business_zip: (metadata as any)?.business_zip || null,
                                      specialty: specialty,
                                      license_number: licenseNumber,
                                      credentials: licenseNumber ? `LFD, ${licenseNumber}` : 'LFD',
                                      rating: rating,
                                      reviewCount: reviewCount,
                                      verified: true,
                                      location: location,
                                      summary: hasApprovedBio ? data.ai_generated_bio.split('\n\n')[0] || data.ai_generated_bio : fallbackSummary,
                                      fullBio: hasApprovedBio ? data.ai_generated_bio : fallbackFullBio,
                                      aiGeneratedBio: hasApprovedBio ? data.ai_generated_bio : null,
                                    });
                                  }
                                } catch (err) {
                                  console.error("Error:", err);
                                } finally {
                                  setPortfolioLoading(false);
                                }
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              className="text-gray-900 hover:text-gray-700 underline decoration-black hover:decoration-gray-700 text-xs font-medium transition-colors cursor-pointer bg-transparent border-none p-0 relative z-10"
                            >
                              Learn more about {agentName}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Mobile: Day blocks below provider info */}
                  <div className="mt-4 md:hidden relative z-10">
                      <div className="grid grid-cols-4 gap-2">
                        {availability.map((slot, slotIndex) => {
                          const hasSpots = slot.spots > 0;
                          return (
                            <button
                              key={slotIndex}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hasSpots && appointment.agent?.id) {
                                  handleDayClick(e, appointment, slot, index);
                                }
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              disabled={!hasSpots}
                              className={`
                                relative px-3 py-2 rounded-lg border text-center text-sm transition-colors select-none
                                ${hasSpots 
                                  ? 'bg-neutral-800 text-white border-neutral-800 hover:bg-neutral-900 cursor-pointer' 
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}
                              `}
                            >
                              {hasSpots && displayMode === 'video' && (
                                <span className="absolute top-1 right-1 text-white pointer-events-none" aria-hidden>
                                  <Video className="w-3 h-3" strokeWidth={2.5} />
                                </span>
                              )}
                              <div className="whitespace-pre-line leading-tight pointer-events-none">{slot.date}</div>
                              <div className="text-xs mt-1 whitespace-pre-line pointer-events-none">
                                <span>{hasSpots ? slot.spots + '\nappts' : 'No\nappts'}</span>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMoreButtonClick(appointment, index);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-neutral-800 hover:bg-neutral-50 text-sm flex items-center justify-center"
                        >
                          More
                        </button>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        );
        })()}
      </main>

      {/* Time Slot Selection Modal */}
      {showTimeSlotModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeTimeSlotModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Agent Info */}
            <div className="bg-gradient-to-r from-neutral-50 to-white p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Book an appointment</h2>
                <button
                  onClick={closeTimeSlotModal}
                  className="text-gray-500 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
    </div>
              
              {/* Agent Profile Card */}
              {selectedAgentInfo && (() => {
                const modalFirmName = effectiveBookingMode === "video"
                  ? (selectedAgentInfo.first_business_name || selectedAgentInfo.funeral_home)
                  : (() => {
                      const norm = (s: string | null | undefined) => (!s ? "" : String(s).split(",").map((x) => x.trim())[0].replace(/\s+office$/i, "").trim().toLowerCase());
                      const locs = selectedAgentInfo.officeLocations;
                      const matchedLoc = searchLocation && locs ? locs.find((loc: { city?: string | null }) => norm(loc.city) === norm(decodeURIComponent(searchLocation.replace(/\+/g, " ")))) : undefined;
                      const firm = matchedLoc && typeof matchedLoc === "object" && "associated_firm" in matchedLoc ? matchedLoc.associated_firm : null;
                      return firm ?? selectedAgentInfo.funeral_home;
                    })();
                return (
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    {selectedAgentInfo.profile_picture_url ? (
                      <Image
                        src={selectedAgentInfo.profile_picture_url}
                        alt={selectedAgentInfo.full_name || "Agent"}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-neutral-600"
                        unoptimized
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center border-2 border-neutral-600">
                        <span className="text-neutral-700 text-2xl font-semibold">
                          {(selectedAgentInfo.full_name || "A")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-1">
                        {selectedAgentInfo.full_name || "Agent"}
                      </h3>
                      {selectedAgentInfo.job_title && (
                        <p className="text-gray-700 font-medium text-sm mb-1">{selectedAgentInfo.job_title}</p>
                      )}
                      {modalFirmName && (
                        <p className="text-gray-600 text-sm mb-2">{modalFirmName}</p>
                      )}
                      {/* Location & address - only for in-person; for video show "Video call" */}
                      {effectiveBookingMode !== "video" ? (
                        <>
                          {searchLocation && (
                            <div className="flex items-center gap-1 mb-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 text-sm">
                                {decodeURIComponent(searchLocation.replace(/\+/g, ' '))}
                              </span>
                            </div>
                          )}
                          {(selectedAgentInfo?.business_street || selectedAgentInfo?.business_address) && (
                            <div className="flex items-start gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-500 text-xs">
                                {selectedAgentInfo.business_street && selectedAgentInfo.business_city && selectedAgentInfo.business_province && selectedAgentInfo.business_zip
                                  ? `${selectedAgentInfo.business_street}, ${selectedAgentInfo.business_city}, ${selectedAgentInfo.business_province} ${selectedAgentInfo.business_zip}`
                                  : selectedAgentInfo.business_address || `${selectedAgentInfo.business_street || ''}${selectedAgentInfo.business_city ? `, ${selectedAgentInfo.business_city}` : ''}${selectedAgentInfo.business_province ? `, ${selectedAgentInfo.business_province}` : ''}${selectedAgentInfo.business_zip ? ` ${selectedAgentInfo.business_zip}` : ''}`.trim()}
                              </span>
                            </div>
                          )}
                        </>
                      ) : null}

                      {/* Rating */}
                      {selectedAgentInfo && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {(() => {
                              // Get rating from appointments if available
                              const agentAppointment = (showingVideoFallback && videoFallbackAppointments.length > 0 ? videoFallbackAppointments : appointments).find(apt => apt.agent?.id === selectedAgentIdForModal);
                              const rating = agentAppointment?.agent?.rating || 0;
                              const reviewCount = agentAppointment?.agent?.reviewCount || 0;
                              if (rating > 0 && reviewCount > 0) {
                                return `${rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`;
                              }
                              return 'No reviews yet';
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-neutral-600" />
                <h3 className="text-lg font-semibold text-black">Select a date and time</h3>
              </div>

              {loadingTimeSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600 mb-4"></div>
                  <p className="text-gray-600">Loading available times...</p>
                </div>
              ) : allAvailabilityDays.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : allAvailabilityDays.filter(day => day.slots.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show days - prioritize showing the selected day even if it has no slots */}
                  {(() => {
                    const normalizedSelectedDate = selectedDayForModal?.trim() || "";
                    
                    // Always include the selected day, even if it has no slots
                    const selectedDay = allAvailabilityDays.find(d => d.date.trim() === normalizedSelectedDate);
                    const daysWithSlots = allAvailabilityDays.filter(day => day.slots.length > 0);
                    
                    // If selected day has no slots, show it first, then show days with slots
                    // If selected day has slots, it will already be in daysWithSlots
                    let daysToShow = [...daysWithSlots];
                    if (selectedDay && selectedDay.slots.length === 0) {
                      // Insert selected day at the beginning
                      daysToShow.unshift(selectedDay);
                    }
                    
                    // Remove duplicates (in case selected day is already in daysWithSlots)
                    const uniqueDays = daysToShow.filter((day, index, self) => 
                      index === self.findIndex(d => d.date.trim() === day.date.trim())
                    );
                    
                    console.log("📅 [MODAL] Rendering days:", {
                      totalDays: allAvailabilityDays.length,
                      daysWithSlots: daysWithSlots.length,
                      selectedDay: normalizedSelectedDate,
                      selectedDayHasSlots: selectedDay?.slots.length || 0,
                      daysToShow: uniqueDays.map(d => ({ date: d.date, slotCount: d.slots.length }))
                    });
                    return uniqueDays;
                  })()
                    .map((day, dayIdx) => {
                      // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts
                      // This ensures the date displayed matches the date in the API response
                      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                      
                      // Validate parsed date components
                      if (isNaN(year) || isNaN(month) || isNaN(dayOfMonth)) {
                        console.error("Invalid date format:", day.date);
                        return null;
                      }
                      
                      // Create date in UTC to get correct day of week
                      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                      
                      // Use UTC methods to get day of week and date components
                      // This ensures the day name matches the actual calendar day
                      const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
                      const monthName = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                      const dayNum = date.getUTCDate();
                      const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                      
                      // Debug: Log day calculation for verification
                      if (day.date === "2026-01-01" || day.date === "2026-01-02") {
                        console.log(`📅 [FRONTEND] Day display for ${day.date}:`, {
                          dateStr: day.date,
                          parsed: {year, month, dayOfMonth},
                          dateISO: date.toISOString(),
                          getUTCDay: date.getUTCDay(),
                          dayName,
                          displayDate,
                          expectedDay: day.date === "2026-01-01" ? "Thursday" : "Friday",
                          correct: day.date === "2026-01-01" ? dayName === "Thursday" : dayName === "Friday"
                        });
                      }
                      
                      // Compare normalized dates
                      const normalizedSelectedDate = selectedDayForModal?.trim() || "";
                      const normalizedDayDate = day.date.trim();
                      const isSelected = normalizedSelectedDate === normalizedDayDate;
                      
                      if (isSelected) {
                        console.log("✅ [MODAL] Day selected match:", {
                          selectedDayForModal: normalizedSelectedDate,
                          dayDate: normalizedDayDate,
                          displayDate,
                          slotCount: day.slots.length
                        });
                      }
                      
                      // Format time slots for this day
                      // Format time slots for this day in the agent's timezone
                      const agentTimezone = day.timezone || 'America/Toronto'; // Default fallback
                      
                      // Get current time in agent's timezone for filtering past slots
                      const now = DateTime.now().setZone(agentTimezone);
                      const todayDateStr = now.toISODate(); // YYYY-MM-DD format
                      const isToday = day.date === todayDateStr;
                      
                      const formattedSlots = day.slots
                        .map(slot => {
                          // Parse the UTC ISO string and convert to agent's timezone
                          const utcTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' });
                          const agentLocalTime = utcTime.setZone(agentTimezone);
                          
                          const hours = agentLocalTime.hour;
                          const minutes = agentLocalTime.minute;
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
                          
                          return {
                            time: timeStr,
                            startsAt: slot.startsAt,
                            endsAt: slot.endsAt,
                            available: true,
                            agentLocalTime // Keep for filtering
                          };
                        })
                        .filter(slot => {
                          // If it's today, filter out past time slots
                          if (isToday) {
                            // Compare slot time with current time (both in agent's timezone)
                            return slot.agentLocalTime > now;
                          }
                          // For future dates, keep all slots
                          return true;
                        })
                        .map(({ agentLocalTime, ...slot }) => slot); // Remove agentLocalTime from final output
                      
                      // Skip if date parsing failed
                      if (!date || !dayName || !monthName) {
                        return null;
                      }
                      
                      // Show this day even if it has no slots (so user sees the day they clicked)
                      const hasSlots = formattedSlots.length > 0;
                      
                      return (
                        <div key={dayIdx} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h4 className="text-base font-semibold text-black mb-3">{displayDate}</h4>
                          {!hasSlots ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No available time slots for this date.</p>
                              <p className="text-xs mt-2 text-gray-400">Please select another date.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {formattedSlots.map((timeSlot, idx) => {
                                const params = new URLSearchParams({
                                  startsAt: timeSlot.startsAt,
                                  endsAt: timeSlot.endsAt,
                                  date: day.date,
                                });
                                if (searchLocation) {
                                  params.set("city", searchLocation);
                                }
                                if (effectiveBookingMode) {
                                  params.set("mode", effectiveBookingMode);
                                }
                                const bookingUrl = `${window.location.origin}/book/step2?agentId=${selectedAgentIdForModal}&${params.toString()}`;
                                const timeSlotId = `time-slot-${dayIdx}-${idx}-${timeSlot.startsAt}`;
                                
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    id={timeSlotId}
                                    name={timeSlotId}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      
                                      const params = new URLSearchParams({
                                        startsAt: timeSlot.startsAt,
                                        endsAt: timeSlot.endsAt,
                                        date: day.date,
                                      });
                                      if (searchLocation) {
                                        params.set("city", searchLocation);
                                      }
                                      if (effectiveBookingMode) {
                                        params.set("mode", effectiveBookingMode);
                                      }
                                      const url = `${window.location.origin}/book/step2?agentId=${selectedAgentIdForModal}&${params.toString()}`;
                                      
                                      console.log("Time slot clicked, FORCING navigation to:", url);
                                      
                                      // Close modal
                                      setShowTimeSlotModal(false);
                                      setSelectedDayForModal(null);
                                      setSelectedAgentIdForModal(null);
                                      setSelectedAgentInfo(null);
                                      setDayTimeSlots([]);
                                      setAllAvailabilityDays([]);
                                      
                                      // IMMEDIATE navigation
                                      window.location.href = url;
                                    }}
                                    className="group relative w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-neutral-100 text-black hover:bg-neutral-600 hover:text-white border-2 border-neutral-300 hover:border-neutral-600 shadow-sm hover:shadow-md"
                                  >
                                    {effectiveBookingMode === 'video' && (
                                      <span className="absolute top-1.5 right-1.5 text-neutral-800 group-hover:text-white transition-colors" aria-hidden>
                                        <Video className="w-5 h-5" strokeWidth={2.5} />
                                      </span>
                                    )}
                                    {timeSlot.time}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Modal - Full Screen */}
      {showPortfolioModal && (
        <div 
          className="fixed inset-0 bg-white z-[9999] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPortfolioModal(false);
              setPortfolioAgentData(null);
              setShowAllReviews(false);
            }
          }}
        >
          <div className="min-h-screen bg-white">
            {/* Header with Back Button */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <button
                  onClick={() => {
                    setShowPortfolioModal(false);
                    setPortfolioAgentData(null);
                    setShowAllReviews(false);
                  }}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Search</span>
                </button>
              </div>
            </header>

            {/* Main Container - Matching Design */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {portfolioLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d2e] mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                  </div>
                </div>
              ) : portfolioAgentData ? (
                <>
                  {/* Two-column layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Main Content (7 columns) */}
                    <div className="lg:col-span-7">
                      {/* Agent Header */}
                      <div className="mb-6">
                        <div className="flex gap-6 pb-6">
                          <div className="flex-shrink-0">
                            {portfolioAgentData.profile_picture_url ? (
                              <img
                                src={portfolioAgentData.profile_picture_url}
                                alt={portfolioAgentData.full_name || "Agent"}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                width={96}
                                height={96}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full bg-[#1a4d2e] flex items-center justify-center border-4 border-white shadow-lg">
                                <span className="text-white text-3xl font-semibold">
                                  {(portfolioAgentData.full_name || "A")[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h1 className="mb-1">{portfolioAgentData.full_name || "Agent"}</h1>
                            <p className="text-gray-600 mb-2">{portfolioAgentData.specialty || portfolioAgentData.job_title || "Pre-need Planning Specialist"}</p>
                          </div>
                        </div>
                      </div>

                      {/* About Section */}
                      <div id="about" className="py-8 border-t border-gray-200">
                        <div className="text-gray-700 leading-relaxed space-y-4">
                          {(() => {
                            let displayBio = portfolioAgentData.aiGeneratedBio || portfolioAgentData.fullBio || portfolioAgentData.summary || 'This professional brings years of compassionate expertise in end-of-life planning and grief support. They help families navigate difficult decisions with dignity and care.';
                            
                            // Remove "About the Specialist" heading if present (case-insensitive, with or without markdown)
                            displayBio = displayBio
                              .replace(/^\*\*About the Specialist\*\*\s*/i, '')
                              .replace(/^About the Specialist\s*/i, '')
                              .replace(/^##\s*About the Specialist\s*/i, '')
                              .replace(/^#\s*About the Specialist\s*/i, '')
                              .trim();
                            
                            const bioParagraphs = displayBio.split('\n\n').filter((p: string) => p.trim().length > 0);
                            
                            // Limit to max 2 paragraphs
                            const limitedParagraphs = bioParagraphs.slice(0, 2);
                            
                            return limitedParagraphs.map((paragraph: string, index: number) => (
                              <p key={index}>{paragraph}</p>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Trust Highlights */}
                      <TrustHighlights 
                        rating={portfolioAgentData.rating || 0} 
                        reviewCount={portfolioAgentData.reviewCount || 0} 
                      />
                    </div>

                    {/* Right Column - Sticky Booking Panel (5 columns) */}
                    <div className="lg:col-span-5">
                      {portfolioAgentData?.id && (
                        <BookingPanel agentId={portfolioAgentData.id} initialLocation={searchLocation} />
                      )}
                    </div>
                  </div>

                  {/* Full-width sections below two-column layout */}
                  <div className="mt-8">
                    {/* Reviews */}
                    <div id="reviews" className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3>Reviews & Testimonials</h3>
                        {portfolioAgentData.reviewCount > 0 && (
                          <div className="text-sm text-gray-500">Based on {portfolioAgentData.reviewCount} verified {portfolioAgentData.reviewCount === 1 ? 'client' : 'clients'}</div>
                        )}
                      </div>
                      {portfolioAgentData.reviewCount === 0 ? (
                        <p className="text-gray-600">This professional has no reviews.</p>
                      ) : (() => {
                        // Sort ALL reviews by rating (highest first), then by date (most recent first)
                        // Prioritize reviews with comments, but include all reviews
                        const sortedReviews = [...portfolioReviews].sort((a, b) => {
                          // First priority: rating (highest first)
                          if (b.rating !== a.rating) {
                            return b.rating - a.rating;
                          }
                          // Second priority: reviews with comments come before those without
                          const aHasComment = a.comment && a.comment.trim().length > 0;
                          const bHasComment = b.comment && b.comment.trim().length > 0;
                          if (aHasComment !== bHasComment) {
                            return bHasComment ? 1 : -1;
                          }
                          // Third priority: date (most recent first)
                          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
                        });
                        
                        // Show top 3 initially, or all if expanded
                        const reviewsToShow = showAllReviews ? sortedReviews : sortedReviews.slice(0, 3);
                        const hasMoreReviews = sortedReviews.length > 3;
                        
                        return (
                          <div>
                            <div className="space-y-4">
                              {reviewsToShow.map((review) => (
                                <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-900 font-medium">{review.author}</span>
                                        {review.verified && (
                                          <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: '#e8f5e9', color: '#1a4d2e' }}>
                                            Verified Client
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                          ))}
                                        </div>
                                        <span className="text-sm text-gray-500">{review.date}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="text-gray-700">{review.comment}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                            {hasMoreReviews && (
                              <button
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="mt-4 text-[#1A1A1A] hover:text-[#1A1A1A]/80 transition-colors font-medium text-sm"
                              >
                                {showAllReviews ? 'Show fewer reviews' : `See more reviews (${sortedReviews.length - 3} more)`}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Office Locations */}
                    <OfficeLocationsSection agentId={portfolioAgentData.id} agentData={portfolioAgentData} />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4 text-lg">Failed to load agent profile</p>
                    <button
                      onClick={() => {
                        setShowPortfolioModal(false);
                        setPortfolioAgentData(null);
                        setShowAllReviews(false);
                      }}
                      className="px-4 py-2 bg-[#1a4d2e] hover:bg-[#0f2e1c] text-white font-semibold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] text-white">
        {/* Main Footer */}
        <div className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-5 gap-12 mb-12">
              {/* Column 1 - Soradin */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Soradin</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-white/60 hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-white/60 hover:text-white transition-colors">
                      About us
                    </Link>
                  </li>
                  <li>
                    <Link href="mailto:support@soradin.com" className="text-white/60 hover:text-white transition-colors">
                      Contact us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2 - Discover */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Discover</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                      Resources for specialists
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                      Data and privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Verified reviews
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3 - For Specialists */}
              <div>
                <h4 className="mb-6 text-lg font-medium">For Specialists</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                      List your practice
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4 - Have questions? */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Have questions?</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/help" className="text-white/60 hover:text-white transition-colors">
                      Help
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 5 - Are you a specialist */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Are you a planning professional?</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                      List your availability on Soradin
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom section */}
            <div className="border-t border-white/10 pt-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo - white.png"
                    alt="Soradin Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                  <span className="text-2xl font-medium">Soradin</span>
                </div>

                <div className="flex gap-5">
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                  <Link
                    href="https://www.facebook.com/profile.php?id=61583953961107"
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="text-sm text-white/40 text-center md:text-left">
                <p>
                  © {new Date().getFullYear()} Soradin, Inc.{" "}
                  <Link href="/terms" className="hover:text-white/60 transition-colors underline">
                    Terms
                  </Link>
                  {" · "}
                  <Link href="/privacy" className="hover:text-white/60 transition-colors underline">
                    Privacy
                  </Link>
                  {" "}
                  <Image src="/ssl-certificate.png" alt="SSL certificate" width={132} height={132} className="inline-block align-middle" aria-hidden />
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

function OfficeLocationsSection({ agentId, agentData }: { agentId: string; agentData: any }) {
  const searchParams = useSearchParams();
  const searchLocation = searchParams?.get("location") || "";
  const decodedSearchLocation = searchLocation ? decodeURIComponent(searchLocation.replace(/\+/g, ' ')) : "";
  
  const [officeLocations, setOfficeLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOfficeLocations() {
      try {
        // First try to load from office_locations table
        const { data: locations, error } = await supabaseClient
          .from('office_locations')
          .select('*')
          .eq('agent_id', agentId)
          .order('display_order', { ascending: true });

        if (!error && locations && locations.length > 0) {
          setOfficeLocations(locations);
          
          // Find the office that matches the search location (by city)
          if (decodedSearchLocation && locations.length > 1) {
            const searchCity = decodedSearchLocation.split(',')[0].trim().toLowerCase();
            const matchingLocation = locations.find((loc: any) => 
              loc.city?.toLowerCase() === searchCity
            );
            if (matchingLocation) {
              setSelectedLocationId(matchingLocation.id);
            } else {
              // Default to first location if no match
              setSelectedLocationId(locations[0].id);
            }
          } else {
            // Default to first location
            setSelectedLocationId(locations[0].id);
          }
          
          setLoading(false);
          return;
        }

        // Fallback to legacy business address fields
        const fallbackLocations = [];
        if (agentData.business_street || agentData.business_address) {
          const address = agentData.business_street && agentData.business_city && agentData.business_province && agentData.business_zip
            ? `${agentData.business_street}, ${agentData.business_city}, ${agentData.business_province} ${agentData.business_zip}`
            : agentData.business_address || `${agentData.business_city || ''}, ${agentData.business_province || ''}`;
          
          fallbackLocations.push({
            id: '1',
            name: agentData.funeral_home || 'Main Office',
            street_address: agentData.business_street || '',
            address: address,
            city: agentData.business_city || agentData.agent_city || '',
            province: agentData.business_province || agentData.agent_province || '',
            postal_code: agentData.business_zip || '',
            latitude: null,
            longitude: null,
          });
        } else if (agentData.agent_city && agentData.agent_province) {
          fallbackLocations.push({
            id: '1',
            name: agentData.funeral_home || 'Main Office',
            street_address: '',
            address: `${agentData.agent_city}, ${agentData.agent_province}`,
            city: agentData.agent_city,
            province: agentData.agent_province,
            postal_code: '',
            latitude: null,
            longitude: null,
          });
        }

        setOfficeLocations(fallbackLocations);
        if (fallbackLocations.length > 0) {
          setSelectedLocationId(fallbackLocations[0].id);
        }
      } catch (err) {
        console.error('Error loading office locations:', err);
      } finally {
        setLoading(false);
      }
    }

    if (agentId) {
      loadOfficeLocations();
    }
  }, [agentId, agentData, decodedSearchLocation]);

  if (loading) {
    return null;
  }

  if (officeLocations.length === 0) {
    return null;
  }

  // Get the selected location
  const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
  const currentSelectedId = selectedLocationId || officeLocations[0].id;

  const getDirectionsUrl = (location: any) => {
    const address = location.postal_code 
      ? `${location.street_address || location.address}, ${location.city}, ${location.province} ${location.postal_code}`
      : location.street_address
      ? `${location.street_address}, ${location.city}, ${location.province}`
      : `${location.city}, ${location.province}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  const fullAddress = selectedLocation.street_address
    ? `${selectedLocation.street_address}, ${selectedLocation.city}, ${selectedLocation.province}${selectedLocation.postal_code ? ` ${selectedLocation.postal_code}` : ''}`
    : `${selectedLocation.city}, ${selectedLocation.province}`;
  
  return (
    <div id="locations" className="mb-12">
      <h2 className="text-3xl font-medium text-gray-900 mb-6">Office locations</h2>
      
      {/* Office City List (only show if multiple locations) */}
      {officeLocations.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {officeLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocationId(location.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSelectedId === location.id
                    ? 'bg-[#1a4d2e] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {location.city}, {location.province}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Single Map Display */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Map Section */}
          <div className="order-2 md:order-1">
            <OfficeLocationMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              city={selectedLocation.city}
              province={selectedLocation.province}
              address={selectedLocation.street_address || undefined}
              postalCode={selectedLocation.postal_code || undefined}
              className="h-full"
            />
          </div>
          
          {/* Info Section */}
          <div className="order-1 md:order-2 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#1a4d2e] mt-0.5 flex-shrink-0" />
                <h3 className="font-semibold text-gray-900 text-lg">{selectedLocation.name}</h3>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                {fullAddress}
              </p>
            </div>
            
            <a
              href={getDirectionsUrl(selectedLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#1a4d2e] hover:text-[#0f291a] font-medium text-sm transition-colors"
            >
              Get directions
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
