// API to search for available agents for public booking
// Returns agents who have availability set up and are approved

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
  hasAvailability: boolean;
  availabilityLocations: string[];
  availabilityByLocation: Record<string, any>;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "";
    const service = searchParams.get("service") || "";
    const query = searchParams.get("q") || "";
    
    console.log("🔍 [AGENT SEARCH API] Request received:", {
      location,
      service,
      query,
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Get all agents (we'll filter by approval and availability)
    // Include metadata to check availability.locations
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province, metadata, approval_status")
      .eq("role", "agent");

    if (error) {
      console.error("Error fetching agents:", error);
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: 500 }
      );
    }

    console.log(`[AGENT SEARCH] Found ${profiles?.length || 0} agents total`);

    // Filter agents who are approved and have availability configured
    const agentsWithAvailability: AgentSearchResult[] = (profiles || [])
      .filter((profile: any) => {
        try {
          // Check approval status
          if (profile.approval_status !== "approved") {
            console.log(`[AGENT SEARCH] Agent ${profile.id} not approved: ${profile.approval_status}`);
            return false;
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
            hasAvailability: true,
            // Include availability data for location filtering
            availabilityLocations: availabilityLocations,
            availabilityByLocation: availabilityByLocation,
          };
        } catch (err) {
          console.error(`[AGENT SEARCH] Error mapping agent ${profile.id}:`, err);
          return null;
        }
      })
      .filter((agent: AgentSearchResult | null): agent is AgentSearchResult => agent !== null);

    console.log(`[AGENT SEARCH] ${agentsWithAvailability.length} agents with availability configured`);

    // Apply filters
    let filtered = agentsWithAvailability;

    if (location) {
      const locationLower = location.toLowerCase().trim();
      // Handle "City, Province" format - extract city name (e.g., "Toronto, ON" -> "Toronto", "Penticton, BC" -> "Penticton")
      const locationParts = locationLower.split(',').map(s => s.trim());
      const searchCity = locationParts[0]; // Just the city name, no province
      
      filtered = filtered.filter((agent) => {
        // Normalize function to extract city name from "City, Province" format
        const normalizeCity = (cityStr: string): string => {
          return cityStr.toLowerCase().trim().split(',')[0].trim();
        };
        
        // Check if the agent has this city in their availability.locations array
        // This works for ANY city: Toronto, Penticton, Kelowna, Edmonton, etc.
        const hasLocationInAvailability = agent.availabilityLocations.some((loc: string) => {
          const normalizedLoc = normalizeCity(loc);
          const normalizedSearch = normalizeCity(searchCity);
          // Exact match or the location contains the search city (e.g., "North Toronto" contains "Toronto")
          return normalizedLoc === normalizedSearch || 
                 normalizedLoc.includes(normalizedSearch) ||
                 normalizedSearch.includes(normalizedLoc);
        });
        
        // Also check availabilityByLocation keys (case-insensitive)
        // This checks the keys in the availabilityByLocation object (e.g., { "Toronto": {...}, "Penticton": {...} })
        const hasLocationInByLocation = Object.keys(agent.availabilityByLocation).some((loc: string) => {
          const normalizedLoc = normalizeCity(loc);
          const normalizedSearch = normalizeCity(searchCity);
          return normalizedLoc === normalizedSearch || 
                 normalizedLoc.includes(normalizedSearch) ||
                 normalizedSearch.includes(normalizedLoc);
        });
        
        // Also check if agent's default city matches (fallback for agents who might not have explicit location in availability)
        const agentCityNormalized = agent.agent_city ? normalizeCity(agent.agent_city) : '';
        const normalizedSearch = normalizeCity(searchCity);
        const agentCityMatch = agentCityNormalized === normalizedSearch || 
                              agentCityNormalized.includes(normalizedSearch) ||
                              normalizedSearch.includes(agentCityNormalized);
        
        const matches = hasLocationInAvailability || hasLocationInByLocation || agentCityMatch;
        
        if (matches) {
          console.log(`[AGENT SEARCH] Agent ${agent.id} matches location "${location}" (searchCity: "${searchCity}")`);
        }
        
        return matches;
      });
      
      console.log(`[AGENT SEARCH] After location filter "${location}" (searchCity: "${locationParts[0]}"): ${filtered.length} agents`);
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

    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter((agent) => {
        return (
          agent.full_name?.toLowerCase().includes(queryLower) ||
          agent.funeral_home?.toLowerCase().includes(queryLower) ||
          agent.job_title?.toLowerCase().includes(queryLower) ||
          agent.specialty?.toLowerCase().includes(queryLower)
        );
      });
    }

    return NextResponse.json({ agents: filtered });
  } catch (error: any) {
    console.error("Error in /api/agents/search:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
