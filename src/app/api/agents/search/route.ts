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
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "";
    const service = searchParams.get("service") || "";
    const query = searchParams.get("q") || "";

    // Get all agents (we'll filter by approval and availability)
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
        // Check approval status
        if (profile.approval_status !== "approved") {
          console.log(`[AGENT SEARCH] Agent ${profile.id} not approved: ${profile.approval_status}`);
          return false;
        }

        // Check availability
        const metadata = profile.metadata || {};
        const availability = metadata.availability || {};
        const locations = availability.locations || [];
        
        if (locations.length === 0) {
          console.log(`[AGENT SEARCH] Agent ${profile.id} has no availability configured`);
          return false;
        }

        return true;
      })
      .map((profile: any) => {
        const metadata = profile.metadata || {};
        const availability = metadata.availability || {};
        
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
          regions_served: metadata.regions_served || null,
          specialty: metadata.specialty || null,
          hasAvailability: true,
        };
      });

    console.log(`[AGENT SEARCH] ${agentsWithAvailability.length} agents with availability configured`);

    // Apply filters
    let filtered = agentsWithAvailability;

    if (location) {
      const locationLower = location.toLowerCase().trim();
      // Handle "City, Province" format - extract city and province separately
      const locationParts = locationLower.split(',').map(s => s.trim());
      const searchCity = locationParts[0];
      const searchProvince = locationParts[1] || '';
      
      filtered = filtered.filter((agent) => {
        const cityMatch = agent.agent_city?.toLowerCase().includes(searchCity) || 
                         searchCity.includes(agent.agent_city?.toLowerCase() || '');
        const provinceMatch = agent.agent_province?.toLowerCase().includes(searchProvince) ||
                             (searchProvince && agent.agent_province?.toLowerCase() === searchProvince) ||
                             (!searchProvince && agent.agent_province);
        const regionsMatch = agent.regions_served?.toLowerCase().includes(locationLower);
        
        // Also check if location string contains city or province
        const fullLocationMatch = locationLower.includes(agent.agent_city?.toLowerCase() || '') ||
                                 locationLower.includes(agent.agent_province?.toLowerCase() || '');
        
        return cityMatch || provinceMatch || regionsMatch || fullLocationMatch;
      });
      
      console.log(`[AGENT SEARCH] After location filter "${location}": ${filtered.length} agents`);
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
