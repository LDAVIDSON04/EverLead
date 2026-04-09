// API to search for available agents for public booking
// Returns approved agents (not paused); photo and payment method are not required for listing.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  /** First business/firm name (for video/online display). */
  first_business_name?: string | null;
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
  /** From profile.metadata; financial advisors only. no-minimum | 100000 | 250000 | 500000 | 1000000 */
  minimum_portfolio_size?: string | null;
  /** From profile.metadata; financial planners who also sell insurance — show in insurance searches */
  qualified_insurance_products?: boolean;
};

// Agent has set video availability if videoSchedule exists and at least one day is enabled
function hasVideoAvailability(agent: AgentSearchResult): boolean {
  const vs = agent.videoSchedule;
  if (!vs || typeof vs !== "object" || Object.keys(vs).length === 0) return false;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return days.some((day) => vs[day]?.enabled === true);
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
  "estate lawyer / notary public": "lawyer",
  "notary public": "lawyer",
  "estate": "lawyer",
  "wills": "lawyer",
  "insurance": "insurance-broker",
  "life insurance": "insurance-broker",
  "insurance broker": "insurance-broker",
  "insurance agent": "insurance-broker",
  "life insurance broker": "insurance-broker",
  "financial": "financial-advisor",
  "financial advisor": "financial-advisor",
  "financial planner": "financial-advisor",
  "financial advisors": "financial-advisor",
  "financial planners": "financial-advisor",
  "tax accountant": "tax-accountant",
  "tax accountants": "tax-accountant",
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

// Map stored metadata.agent_role values to canonical role (so we only show agents whose registered profession matches)
const STORED_ROLE_TO_CANONICAL: Record<string, string> = {
  "funeral-planner": "funeral-planner",
  "funeral_planner": "funeral-planner",
  "lawyer": "lawyer",
  "estate_lawyer": "lawyer",
  "financial-advisor": "financial-advisor",
  "financial_advisor": "financial-advisor",
  "financial_insurance_agent": "financial-advisor",
  "insurance-broker": "insurance-broker",
  "insurance_broker": "insurance-broker",
  "tax-accountant": "tax-accountant",
  "tax_accountant": "tax-accountant",
};

// Keywords for legacy agents without agent_role (only used when agent_role is missing)
const ROLE_KEYWORDS: Record<string, string[]> = {
  "funeral-planner": ["funeral", "pre need", "pre-need", "pre planner", "funeral director", "funeral planning", "funeral services", "advanced planning"],
  "lawyer": ["lawyer", "estate", "wills", "legal"],
  "insurance-broker": ["insurance", "life insurance", "broker"],
  "financial-advisor": ["financial", "financial advisor", "financial planner"],
  "tax-accountant": ["tax accountant", "tax accountants", "accountant"],
};

function agentMatchesProfession(agent: AgentSearchResult, requiredRole: string): boolean {
  const raw = (agent.agent_role || '').toLowerCase().trim().replace(/\s+/g, '_');
  const storedCanonical = raw ? (STORED_ROLE_TO_CANONICAL[raw] ?? raw.replace(/_/g, '-')) : null;

  // Insurance search: pure insurance brokers + dual financial/insurance signups + financial planners who opted in
  if (requiredRole === 'insurance-broker') {
    if (storedCanonical === 'insurance-broker') return true;
    if (raw === 'financial_insurance_agent') return true;
    if (storedCanonical === 'financial-advisor' && agent.qualified_insurance_products === true) return true;
    if (!storedCanonical) {
      const specialty = (agent.specialty || '').toLowerCase();
      const jobTitle = (agent.job_title || '').toLowerCase();
      const combined = `${specialty} ${jobTitle}`;
      const insKws = ROLE_KEYWORDS['insurance-broker'];
      if (insKws?.some((kw) => combined.includes(kw))) return true;
      if (
        agent.qualified_insurance_products === true &&
        ROLE_KEYWORDS['financial-advisor']?.some((kw) => combined.includes(kw))
      ) {
        return true;
      }
    }
    return false;
  }

  // If agent has a stored role, require exact match – never show e.g. funeral planners for "Financial advisor"
  if (storedCanonical) {
    return storedCanonical === requiredRole;
  }
  // Legacy: no agent_role – allow keyword match only for specialty/job_title
  const specialty = (agent.specialty || '').toLowerCase();
  const jobTitle = (agent.job_title || '').toLowerCase();
  const combined = `${specialty} ${jobTitle}`;
  const keywords = ROLE_KEYWORDS[requiredRole];
  if (!keywords) return false;
  return keywords.some((kw) => combined.includes(kw));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "";
    const service = searchParams.get("service") || "";
    const query = searchParams.get("q") || "";
    const mode = searchParams.get("mode") || "in-person"; // "in-person" | "video"
    const fallback = searchParams.get("fallback") === "1"; // when true (in-person 0 results), return all agents in province same profession, don't require video
    const assets = searchParams.get("assets") ?? ""; // financial planner search: customer's approximate asset value (e.g. 500000) for minimum_portfolio_size filter

    console.log("🔍 [AGENT SEARCH API] Request received:", {
      location,
      service,
      query,
      mode,
      fallback,
      assets,
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Get all agents (we'll filter by approval and availability)
    // Include metadata to check availability.locations
    // Include bio fields and profile picture to check approval status
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province, metadata, approval_status, ai_generated_bio, bio_approval_status")
      .eq("role", "agent");

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
      .select("id, agent_id, name, city, street_address, province, postal_code, associated_firm")
      .in("agent_id", agentIds.length > 0 ? agentIds : ['00000000-0000-0000-0000-000000000000']); // Dummy ID if no agents

    // Filter agents who are approved and not paused (listing does not require photo or payment method)
    const agentsWithAvailability: AgentSearchResult[] = (profiles || [])
      .filter((profile: any) => {
        try {
          // Single unified approval - check only approval_status
          // When admin approves, both profile and bio are approved together
          if (profile.approval_status !== "approved") {
            console.log(`[AGENT SEARCH] Agent ${profile.id} (${profile.full_name || 'unnamed'}) not approved: ${profile.approval_status}`);
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

          // Debug log for the specific agent we're looking for
          if (profile.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] ✅ Agent ${profile.id} passed paused_account check`);
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
          
          // Merge: availability.locations + office cities + availabilityByLocation keys (cities they set schedule for)
          const byLocationCities = Object.keys(availabilityByLocation || {}).filter(Boolean);
          const allLocationCities = Array.from(new Set([...availabilityLocations, ...officeLocationCities, ...byLocationCities]));
          
          // Debug log for the specific agent we're looking for
          if (profile.id === 'f7f6aeca-1059-4ae8-ae93-a059ad583b8f') {
            console.log(`[AGENT SEARCH] 📍 Agent ${profile.id} location data:`, {
              availabilityLocations,
              officeLocationCities,
              allLocationCities,
              availabilityByLocationKeys: Object.keys(availabilityByLocation),
            });
          }
          
          const businessNames = (metadata as any)?.business_names;
          const firstBusinessName = (Array.isArray(businessNames) && businessNames[0]) ? String(businessNames[0]).trim() : (profile.funeral_home || null);

          const hasVideo = hasVideoAvailability({
            videoSchedule: videoSchedule && typeof videoSchedule === "object" ? videoSchedule : null,
          } as AgentSearchResult);
          const hasInPersonSchedule =
            Object.keys(availabilityByLocation || {}).length > 0;
          const hasAvailability = hasVideo || hasInPersonSchedule;

          return {
            id: profile.id,
            full_name: profile.full_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            profile_picture_url: profile.profile_picture_url,
            funeral_home: profile.funeral_home,
            first_business_name: firstBusinessName || profile.funeral_home || null,
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
            hasAvailability,
            // Include availability data for location filtering
            availabilityLocations: allLocationCities, // Include office locations
            availabilityByLocation: availabilityByLocation,
            officeLocationCities: officeLocationCities, // Store separately for reference
            officeLocations: agentOfficeLocations, // Store full office location data (includes associated_firm)
            videoSchedule: videoSchedule && typeof videoSchedule === "object" ? videoSchedule : null,
            agent_role: (metadata as any)?.agent_role || null,
            minimum_portfolio_size: (metadata as any)?.minimum_portfolio_size ?? null,
            qualified_insurance_products:
              (metadata as any)?.qualified_insurance_products === true ||
              (metadata as any)?.qualified_insurance_products === 'true',
          };
        } catch (err) {
          console.error(`[AGENT SEARCH] Error mapping agent ${profile.id}:`, err);
          return null;
        }
      })
      .filter((agent: AgentSearchResult | null): agent is AgentSearchResult => agent !== null);

    console.log(`[AGENT SEARCH] ${agentsWithAvailability.length} agents (approved, not paused) before location/profession filters`);

    let filtered = agentsWithAvailability;

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
        
        // In-person: ONLY agents with an office in the searched city. No province-wide.
        // City matching: agent has office or availability in the searched city
        const normalizedSearch = normalizeCity(searchCity);
        if (!normalizedSearch) return false;
        
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

    // Video mode: show ALL agents in province (that profession) when customer chooses online video call - no video availability required
    if (mode === "video") {
      console.log(`✅ [AGENT SEARCH] Video mode: ${filtered.length} agents in province (all with matching profession)`);
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

    // Filter by profession: only show agents whose role/profession matches the search (agent_role or specialty/job_title)
    if (query) {
      const requiredRole = queryToAgentRole(query);
      const queryLower = query.toLowerCase().trim();
      if (requiredRole) {
        filtered = filtered.filter((agent) => agentMatchesProfession(agent, requiredRole));
        console.log(`[AGENT SEARCH] Filtering by profession: q="${query}" -> ${requiredRole}, ${filtered.length} agents`);
      } else {
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

    // Financial planner filter: when customer selected assets (slider), only show agents whose minimum_portfolio_size <= customer assets
    // Agents with no minimum or "no-minimum" are treated as 0 (show to all). Default for existing agents without the field is no minimum.
    if (assets !== "" && assets != null) {
      const customerAssetsNum = parseInt(String(assets).trim(), 10);
      if (!isNaN(customerAssetsNum)) {
        const beforeAssets = filtered.length;
        filtered = filtered.filter((agent) => {
          const role = agent.agent_role;
          const isFinancial = role === "financial-advisor" || role === "financial_insurance_agent";
          if (!isFinancial) return true;
          const minStr = agent.minimum_portfolio_size ?? "";
          const agentMinNum =
            minStr === "no-minimum" || minStr === ""
              ? 0
              : parseInt(String(minStr), 10);
          const minEffective = isNaN(agentMinNum) ? 0 : agentMinNum;
          const include = customerAssetsNum >= minEffective;
          return include;
        });
        console.log(`[AGENT SEARCH] Assets filter: customer assets ${customerAssetsNum} -> ${filtered.length} agents (was ${beforeAssets})`);
      }
    }

    // Random order within tiers: agents with configured availability (metadata) first, then the rest
    const withConfiguredAvailability = filtered.filter((a) => a.hasAvailability);
    const withoutConfiguredAvailability = filtered.filter((a) => !a.hasAvailability);
    shuffleInPlace(withConfiguredAvailability);
    shuffleInPlace(withoutConfiguredAvailability);
    const shuffled = [...withConfiguredAvailability, ...withoutConfiguredAvailability];
    console.log(
      `[AGENT SEARCH] Order: ${withConfiguredAvailability.length} with schedule in profile (shuffled), then ${withoutConfiguredAvailability.length} without`
    );

    return NextResponse.json({ agents: shuffled });
  } catch (error: any) {
    console.error("Error in /api/agents/search:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
