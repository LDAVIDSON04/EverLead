// API to search for available agents for public booking
// Returns agents who have availability set up, are approved, and have a payment method

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";
import { cityToProvince } from "@/lib/cities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AgentSearchResult = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  funeral_home: string | null;
  job_title: string | null;
  agent_city: string | null;
  agent_province: string | null;
  regions_served: string | null;
  specialty: string | null;
  business_address: string | null;
  business_street: string | null;
  business_city: string | null;
  business_province: string | null;
  business_zip: string | null;
  hasAvailability: boolean;
  availabilityLocations: string[];
  availabilityByLocation: Record<string, any>;
  officeLocationCities?: string[];
  videoSchedule?: Record<string, { enabled: boolean; start: string; end: string }> | null;
  agent_role?: string | null;
};

// Agent has set video availability if videoSchedule exists and at least one day is enabled
function hasVideoAvailability(agent: AgentSearchResult): boolean {
  const vs = agent.videoSchedule;
  if (!vs || typeof vs !== "object" || Object.keys(vs).length === 0) return false;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return days.some((day) => vs[day]?.enabled === true);
}

// Map search query (q) to agent_role so we only show agents whose registered profession matches
const QUERY_TO_AGENT_ROLE: Record<string, string> = {
  "funeral": "funeral-planner",
  "funeral planner": "funeral-planner",
  "funeral pre planner": "funeral-planner",
  "funeral planning": "funeral-planner",
  "funeral services": "funeral-planner",
  "funeral director": "funeral-planner",
  "advanced planning director": "funeral-planner",
  "pre need": "funeral-planner",
  "pre-need": "funeral-planner",
  "lawyer": "lawyer",
  "estate lawyer": "lawyer",
  "estate lawyers": "lawyer",
  "estate": "lawyer",
  "wills": "lawyer",
  "insurance": "insurance-broker",
  "life insurance": "insurance-broker",
  "insurance broker": "insurance-broker",
  "life insurance broker": "insurance-broker",
  "financial": "financial-advisor",
  "financial advisor": "financial-advisor",
  "financial planner": "financial-advisor",
  "financial advisors": "financial-advisor",
  "financial planners": "financial-advisor",
};

function queryToAgentRole(query: string): string | null {
  if (!query || !query.trim()) return null;
  const normalized = query.toLowerCase().trim();
  // Exact key match first
  if (QUERY_TO_AGENT_ROLE[normalized]) return QUERY_TO_AGENT_ROLE[normalized];
  // Contains match: find first key that the query contains or that contains the query
  for (const [key, role] of Object.entries(QUERY_TO_AGENT_ROLE)) {
    if (normalized.includes(key) || key.includes(normalized)) return role;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "";
    const service = searchParams.get("service") || "";
    const query = searchParams.get("q") || "";
    const mode = searchParams.get("mode") || "in-person"; // "in-person" | "video"

    console.log("🔍 [AGENT SEARCH API] Request received:", {
      location,
      service,
      query,
      mode,
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Get all agents (we'll filter by approval and availability)
    // Include metadata to check availability.locations
    // Include bio fields and profile picture to check approval status
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province, metadata, approval_status, ai_generated_bio, bio_approval_status")
      .eq("role", "agent")
      .not("profile_picture_url", "is", null); // Require profile picture

    if (error) {
      console.error("Error fetching agents:", error);
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: 500 }
      );
    }

    console.log(`[AGENT SEARCH] Found ${profiles?.length || 0} agents total`);

    // Also fetch office locations for all agents to merge with availability
    const agentIds = (profiles || []).map((p: any) => p.id);
    const { data: allOfficeLocations } = await supabaseAdmin
      .from("office_locations")
      .select("id, agent_id, name, city, street_address, province, postal_code")
      .in("agent_id", agentIds.length > 0 ? agentIds : ['00000000-0000-0000-0000-000000000000']); // Dummy ID if no agents

    // Filter agents who are approved (both profile AND bio) and have availability configured
    const agentsWithAvailability: AgentSearchResult[] = (profiles || [])
      .filter((profile: any) => {
        try {
          // Single unified approval - check only approval_status
          // When admin approves, both profile and bio are approved together
          if (profile.approval_status !== "approved") {
            console.log(`[AGENT SEARCH] Agent ${profile.id} (${profile.full_name || 'unnamed'}) not approved: ${profile.approval_status}`);
            return false;
          }
          
          // Require profile picture
          if (!profile.profile_picture_url) {
            console.log(`[AGENT SEARCH] Agent ${profile.id} (${profile.full_name || 'unnamed'}) missing profile picture`);
            return false;
          }
          
          // Debug log for the specific agent we're looking for
          if (profile.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] ✅ Agent ${profile.id} passed approval check`);
          }

          // Check availability - handle different metadata structures
          let metadata = {};
          try {
            if (typeof profile.metadata === 'string') {
              metadata = JSON.parse(profile.metadata);
            } else if (profile.metadata && typeof profile.metadata === 'object') {
              metadata = profile.metadata;
            }
          } catch (e) {
            console.log(`[AGENT SEARCH] Agent ${profile.id} has invalid metadata format`);
            // Continue anyway - might still have availability
          }

          // Filter out paused agents (agents with paused_account flag set to true)
          if ((metadata as any)?.paused_account === true) {
            console.log(`[AGENT SEARCH] Agent ${profile.id} (${profile.full_name || 'unnamed'}) is paused - excluding from results`);
            return false;
          }
          
          // Check if onboarding is completed - agents must complete all 3 steps before appearing in marketplace
          const onboardingCompleted = (metadata as any)?.onboarding_completed === true;
          if (!onboardingCompleted) {
            console.log(`[AGENT SEARCH] Agent ${profile.id} (${profile.full_name || 'unnamed'}) has not completed onboarding - excluding from results`);
            return false;
          }
          
          // Debug log for the specific agent we're looking for
          if (profile.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] ✅ Agent ${profile.id} passed paused_account and onboarding checks`);
          }

          const availability = (metadata as any)?.availability || {};
          const locations = availability.locations || [];
          
          // If no locations in availability, still include agent (they might have availability set up differently)
          // We'll check actual availability via the availability API instead
          return true;
        } catch (err) {
          console.error(`[AGENT SEARCH] Error processing agent ${profile.id}:`, err);
          return false;
        }
      })
      .map((profile: any) => {
        try {
          let metadata = {};
          try {
            if (typeof profile.metadata === 'string') {
              metadata = JSON.parse(profile.metadata);
            } else if (profile.metadata && typeof profile.metadata === 'object') {
              metadata = profile.metadata;
            }
          } catch (e) {
            // Use empty object if metadata is invalid
            metadata = {};
          }
          
          const availability = (metadata as any)?.availability || {};
          const availabilityLocations = availability.locations || [];
          const availabilityByLocation = availability.availabilityByLocation || {};
          const videoSchedule = availability.videoSchedule || null;
          
          // Get office locations for this agent
          const agentOfficeLocations = (allOfficeLocations || []).filter((loc: any) => loc.agent_id === profile.id);
          const officeLocationCities = Array.from(new Set(agentOfficeLocations.map((loc: any) => loc.city).filter(Boolean)));
          
          // Merge availability locations with office location cities
          // This ensures agents show up for all cities where they have offices OR have set availability
          const allLocationCities = Array.from(new Set([...availabilityLocations, ...officeLocationCities]));
          
          // Debug log for the specific agent we're looking for
          if (profile.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] 📍 Agent ${profile.id} location data:`, {
              availabilityLocations,
              officeLocationCities,
              allLocationCities,
              availabilityByLocationKeys: Object.keys(availabilityByLocation),
            });
          }
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            profile_picture_url: profile.profile_picture_url,
            funeral_home: profile.funeral_home,
            job_title: profile.job_title,
            agent_city: profile.agent_city,
            agent_province: profile.agent_province,
            regions_served: (metadata as any)?.regions_served || null,
            specialty: (metadata as any)?.specialty || null,
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
            hasAvailability: true,
            // Include availability data for location filtering
            availabilityLocations: allLocationCities, // Include office locations
            availabilityByLocation: availabilityByLocation,
            officeLocationCities: officeLocationCities, // Store separately for reference
            officeLocations: agentOfficeLocations, // Store full office location data
            videoSchedule: videoSchedule && typeof videoSchedule === "object" ? videoSchedule : null,
            agent_role: (metadata as any)?.agent_role || null,
          };
        } catch (err) {
          console.error(`[AGENT SEARCH] Error mapping agent ${profile.id}:`, err);
          return null;
        }
      })
      .filter((agent: AgentSearchResult | null): agent is AgentSearchResult => agent !== null);

    console.log(`[AGENT SEARCH] ${agentsWithAvailability.length} agents with availability configured`);

    // Filter out agents without payment methods
    // Agents must have a valid payment method to appear in search results
    const agentsWithPaymentMethods = await Promise.all(
      agentsWithAvailability.map(async (agent) => {
        try {
          // Get agent's email from auth.users to check Stripe customer
          let agentEmail: string | null = null;
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agent.id);
            agentEmail = authUser?.user?.email || null;
          } catch (authError) {
            console.error(`[AGENT SEARCH] Error fetching email for agent ${agent.id}:`, authError);
            return null;
          }

          if (!agentEmail) {
            console.log(`[AGENT SEARCH] Agent ${agent.id} has no email - excluding from results`);
            return null;
          }

          // Check if agent has a payment method via Stripe
          let hasPaymentMethod = false;
          try {
            const customers = await stripe.customers.list({
              email: agentEmail,
              limit: 1,
            });

            if (customers.data.length > 0) {
              const customer = customers.data[0];
              // Check if customer has payment methods
              const paymentMethods = await stripe.paymentMethods.list({
                customer: customer.id,
                type: 'card',
              });

              hasPaymentMethod = paymentMethods.data.length > 0;
            }
          } catch (stripeError: any) {
            console.error(`[AGENT SEARCH] Error checking Stripe payment methods for agent ${agent.id}:`, stripeError);
            // If Stripe check fails, exclude agent (safer default)
            hasPaymentMethod = false;
          }

          if (!hasPaymentMethod) {
            console.log(`[AGENT SEARCH] Agent ${agent.id} (${agent.full_name || 'unnamed'}) has no payment method - excluding from results`);
            return null;
          }
          
          // Debug log for the specific agent we're looking for
          if (agent.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] ✅ Agent ${agent.id} passed payment method check`);
          }

          return agent;
        } catch (error: any) {
          console.error(`[AGENT SEARCH] Error processing payment method check for agent ${agent.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const agentsWithPayment = agentsWithPaymentMethods.filter(
      (agent): agent is AgentSearchResult => agent !== null
    );

    console.log(`[AGENT SEARCH] ${agentsWithPayment.length} agents with payment methods`);

    // Apply filters
    let filtered = agentsWithPayment;

    if (location) {
      const locationLower = location.toLowerCase().trim();
      const locationParts = locationLower.split(',').map(s => s.trim());
      const searchCity = locationParts[0];
      const searchProvince = locationParts.length > 1 ? locationParts[1] : null;
      const isPostalCode = /^[a-z]\d[a-z]\s?\d[a-z]\d$/i.test(locationLower.replace(/\s+/g, ''));

      const provinceMap: Record<string, string[]> = {
        'alberta': ['ab', 'alberta'],
        'british columbia': ['bc', 'british columbia'],
        'manitoba': ['mb', 'manitoba'],
        'new brunswick': ['nb', 'new brunswick'],
        'newfoundland': ['nl', 'nf', 'newfoundland', 'newfoundland and labrador'],
        'northwest territories': ['nt', 'nwt', 'northwest territories'],
        'nova scotia': ['ns', 'nova scotia'],
        'nunavut': ['nu', 'nunavut'],
        'ontario': ['on', 'ontario'],
        'prince edward island': ['pe', 'pei', 'prince edward island'],
        'quebec': ['qc', 'pq', 'quebec'],
        'saskatchewan': ['sk', 'saskatchewan'],
        'yukon': ['yt', 'yukon', 'yukon territory']
      };

      const normalizeProvince = (provinceStr: string): string | null => {
        if (!provinceStr) return null;
        const normalized = provinceStr.toLowerCase().trim();
        for (const [provinceName, abbreviations] of Object.entries(provinceMap)) {
          if (abbreviations.some(abbr => abbr.toLowerCase() === normalized) ||
              provinceName.toLowerCase() === normalized) {
            return provinceName;
          }
        }
        return normalized;
      };

      // VIDEO MODE: filter by province only (all agents in province; show for any BC city when searching BC)
      if (mode === 'video') {
        let matchedProvince: string | null = null;
        if (searchProvince) {
          matchedProvince = normalizeProvince(searchProvince);
        } else if (searchCity.length <= 3) {
          // Location is just province (e.g. "BC", "ON") – treat as province
          matchedProvince = normalizeProvince(searchCity);
        } else {
          const provAbbr = cityToProvince[searchCity];
          if (provAbbr) matchedProvince = normalizeProvince(provAbbr);
        }
        if (matchedProvince) {
          filtered = filtered.filter((agent) => {
            const agentProv = normalizeProvince((agent.agent_province || '').trim());
            const officeProvinces = ((agent as any).officeLocations || []).map((loc: any) =>
              normalizeProvince((loc.province || '').trim())
            );
            const inProvince = agentProv === matchedProvince || officeProvinces.includes(matchedProvince!);
            return inProvince;
          });
          console.log(`✅ [AGENT SEARCH] Video mode: ${filtered.length} agents in province "${matchedProvince}"`);
        } else {
          console.warn(`⚠️ [AGENT SEARCH] Video mode: could not derive province from "${location}"`);
        }
      } else {
        // IN-PERSON MODE (all 4 professions: funeral, lawyer, insurance, financial):
        // Only show agents who have an office or availability in the searched city.
        // e.g. Prince George in-person → only agents in Prince George; no province-wide in-person.
        let isProvinceSearch = false;
        let matchedProvince: string | null = null;

        if (!searchCity.includes(' ') && searchCity.length <= 5) {
          for (const [provinceName, abbreviations] of Object.entries(provinceMap)) {
            if (abbreviations.some(abbr => abbr.toLowerCase() === searchCity.toLowerCase())) {
              isProvinceSearch = true;
              matchedProvince = provinceName;
              break;
            }
          }
        } else {
          for (const [provinceName, abbreviations] of Object.entries(provinceMap)) {
            if (provinceName.toLowerCase() === searchCity.toLowerCase() ||
                abbreviations.some(abbr => abbr.toLowerCase() === searchCity.toLowerCase())) {
              isProvinceSearch = true;
              matchedProvince = provinceName;
              break;
            }
          }
        }

        filtered = filtered.filter((agent) => {
        // Normalize function to extract city name from "City, Province" format
        // Also handles province abbreviations without comma (e.g., "Vaughn On" -> "vaughn")
        const normalizeCity = (cityStr: string): string => {
          if (!cityStr) return '';
          let normalized = cityStr.toLowerCase().trim().split(',')[0].trim();
          // Remove province abbreviations at the end without comma (e.g., "Vaughn On" -> "vaughn")
          const provinceAbbrevs = /\s+(on|bc|ab|sk|mb|qc|nb|ns|pe|nl|yt|nt|nu)$/i;
          normalized = normalized.replace(provinceAbbrevs, '').trim();
          // Remove " Office" suffix if present
          normalized = normalized.replace(/\s+office$/i, '').trim();
          return normalized.replace(/\s+/g, ' ');
        };
        
        // Helper function for fuzzy city name matching
        // Handles common spelling variations (e.g., "Vaughan" vs "Vaughn")
        const fuzzyCityMatch = (city1: string, city2: string): boolean => {
          const norm1 = normalizeCity(city1);
          const norm2 = normalizeCity(city2);
          
          // Exact match
          if (norm1 === norm2) return true;
          
          // One contains the other
          if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
          
          // Handle common spelling variations
          // "Vaughan" vs "Vaughn" - check if they're very similar (edit distance 1)
          if (Math.abs(norm1.length - norm2.length) <= 1) {
            // Check if they start with the same letters (at least 4 chars)
            const minLen = Math.min(norm1.length, norm2.length);
            if (minLen >= 4) {
              const prefix1 = norm1.substring(0, Math.min(6, norm1.length));
              const prefix2 = norm2.substring(0, Math.min(6, norm2.length));
              // If first 4+ characters match, likely the same city
              if (prefix1.substring(0, 4) === prefix2.substring(0, 4) && 
                  Math.abs(prefix1.length - prefix2.length) <= 1) {
                return true;
              }
            }
          }
          
          // Specific known variations mapping (multi-word cities, spelling)
          const variations: Record<string, string[]> = {
            'vaughan': ['vaughn'],
            'vaughn': ['vaughan'],
            'prince george': ['princegeorge'],
            'princegeorge': ['prince george'],
          };
          
          if (variations[norm1]?.includes(norm2) || variations[norm2]?.includes(norm1)) {
            return true;
          }
          
          return false;
        };
        
        // Normalize province names
        const normalizeProvince = (provinceStr: string): string | null => {
          if (!provinceStr) return null;
          const normalized = provinceStr.toLowerCase().trim();
          for (const [provinceName, abbreviations] of Object.entries(provinceMap)) {
            if (abbreviations.some(abbr => abbr.toLowerCase() === normalized) || 
                provinceName.toLowerCase() === normalized) {
              return provinceName;
            }
          }
          return normalized; // Return as-is if not found in map
        };
        
        // If searching by province only
        if (isProvinceSearch && matchedProvince) {
          // Match agents by their agent_province or office location provinces
          const agentProvinceNormalized = normalizeProvince(agent.agent_province || '');
          const officeLocations = (agent as any).officeLocations || [];
          const officeProvinces = officeLocations.map((loc: any) => normalizeProvince(loc.province || ''));
          
          if (agentProvinceNormalized === matchedProvince || 
              officeProvinces.includes(matchedProvince)) {
            console.log(`[AGENT SEARCH] Agent ${agent.id} matches province "${matchedProvince}"`);
            return true;
          }
          return false;
        }
        
        // If searching by postal code, try to match by office location postal codes
        if (isPostalCode) {
          const officeLocations = (agent as any).officeLocations || [];
          const normalizedPostalCode = locationLower.replace(/\s+/g, '').toUpperCase();
          
          const matchesPostalCode = officeLocations.some((loc: any) => {
            if (!loc.postal_code) return false;
            const locPostalCode = loc.postal_code.replace(/\s+/g, '').toUpperCase();
            // Exact match or first 3 characters match (forward sortation area)
            return locPostalCode === normalizedPostalCode || 
                   locPostalCode.substring(0, 3) === normalizedPostalCode.substring(0, 3);
          });
          
          if (matchesPostalCode) {
            console.log(`[AGENT SEARCH] Agent ${agent.id} matches postal code "${location}"`);
            return true;
          }
          // If no postal code match, fall through to city matching
        }
        
        // In-person: only show agents who have an office or availability in the searched city
        // (No province-wide in-person: e.g. Victoria search must not show agents from Penticton/Kelowna)
        // City matching (existing logic)
        const normalizedSearch = normalizeCity(searchCity);
        if (!normalizedSearch) return false;
        
        // Check if the city matches any of the agent's locations (availability or office locations)
        const hasLocationInList = agent.availabilityLocations.some((loc: string) => {
          if (!loc) return false;
          return fuzzyCityMatch(loc, searchCity);
        });
        
        // Also check office locations for city match
        const officeLocations = (agent as any).officeLocations || [];
        const matchesOfficeCity = officeLocations.some((loc: any) => {
          if (!loc.city) return false;
          return fuzzyCityMatch(loc.city, searchCity);
        });
        
        // If province was specified in search, also check province match
        if (searchProvince) {
          const searchProvinceNormalized = normalizeProvince(searchProvince);
          const agentProvinceNormalized = normalizeProvince(agent.agent_province || '');
          const officeLocations = (agent as any).officeLocations || [];
          const officeProvinces = officeLocations.map((loc: any) => normalizeProvince(loc.province || ''));
          
          const provinceMatches = agentProvinceNormalized === searchProvinceNormalized || 
                                  officeProvinces.includes(searchProvinceNormalized || '');
          
          if ((hasLocationInList || matchesOfficeCity) && provinceMatches) {
            console.log(`[AGENT SEARCH] Agent ${agent.id} matches city "${searchCity}" and province "${searchProvince}"`);
            return true;
          }
          return false;
        }
        
        if (hasLocationInList || matchesOfficeCity) {
          console.log(`[AGENT SEARCH] Agent ${agent.id} matches location "${location}" (searchCity: "${searchCity}")`);
          return true;
        }
        
        return false;
      });
      }

      console.log(`✅ [AGENT SEARCH] After location filter "${location}" (mode=${mode}): ${filtered.length} agents matched`);
    }

    // Video mode: only show agents who have set video availability (even when no location)
    if (mode === "video") {
      const before = filtered.length;
      filtered = filtered.filter((agent) => hasVideoAvailability(agent));
      console.log(`✅ [AGENT SEARCH] Video mode: ${filtered.length} agents with video availability (${before} before filter)`);
    }

    if (location) {
      if (filtered.length === 0) {
        console.warn(`⚠️ [AGENT SEARCH] No agents found for location "${location}". Available locations in system:`,
          agentsWithAvailability.map(a => ({
            id: a.id,
            name: a.full_name,
            locations: a.availabilityLocations,
            byLocation: Object.keys(a.availabilityByLocation)
          }))
        );
      }
    }

    if (service) {
      const serviceLower = service.toLowerCase();
      filtered = filtered.filter((agent) => {
        return (
          agent.specialty?.toLowerCase().includes(serviceLower) ||
          agent.job_title?.toLowerCase().includes(serviceLower) ||
          agent.funeral_home?.toLowerCase().includes(serviceLower)
        );
      });
    }

    // Filter by profession: agent only shows when search query matches their registered agent_role (create-account choice)
    // Applies to both in-person and video so e.g. "Life Insurance Broker" only shows insurance brokers
    if (query) {
      const requiredRole = queryToAgentRole(query);
      if (requiredRole) {
        filtered = filtered.filter((agent) => (agent.agent_role || '').toLowerCase().trim() === requiredRole);
        console.log(`[AGENT SEARCH] Filtering by profession: q="${query}" -> agent_role=${requiredRole}, ${filtered.length} agents`);
      } else {
        // No mapping: fallback to text match on name/specialty/job_title so odd queries still get results
        const queryLower = query.toLowerCase().trim();
        filtered = filtered.filter((agent) => {
          return (
            agent.full_name?.toLowerCase().includes(queryLower) ||
            agent.funeral_home?.toLowerCase().includes(queryLower) ||
            agent.job_title?.toLowerCase().includes(queryLower) ||
            agent.specialty?.toLowerCase().includes(queryLower)
          );
        });
      }
    }

    // Fetch review counts for all agents and sort by review count (highest first)
    const filteredAgentIds = filtered.map(a => a.id);
    let reviewCountsMap: Record<string, number> = {};
    
    if (filteredAgentIds.length > 0) {
      const { data: reviews } = await supabaseAdmin
        .from("reviews")
        .select("agent_id")
        .in("agent_id", filteredAgentIds);
      
      // Count reviews per agent
      (reviews || []).forEach((review: any) => {
        reviewCountsMap[review.agent_id] = (reviewCountsMap[review.agent_id] || 0) + 1;
      });
    }
    
    // Sort by review count (highest first), then by name
    const sorted = filtered.sort((a, b) => {
      const aReviews = reviewCountsMap[a.id] || 0;
      const bReviews = reviewCountsMap[b.id] || 0;
      
      // First sort by review count (descending)
      if (bReviews !== aReviews) {
        return bReviews - aReviews;
      }
      
      // If same review count, sort alphabetically by name
      const aName = a.full_name || '';
      const bName = b.full_name || '';
      return aName.localeCompare(bName);
    });

    return NextResponse.json({ agents: sorted });
  } catch (error: any) {
    console.error("Error in /api/agents/search:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
