// API to search for available agents for public booking
// Returns agents who have availability set up, are approved, and have a payment method

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";

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
    // Include bio fields to check bio approval status
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
      // Handle "City, Province" format - extract city name (e.g., "Toronto, ON" -> "Toronto", "Penticton, BC" -> "Penticton")
      const locationParts = locationLower.split(',').map(s => s.trim());
      const searchCity = locationParts[0]; // Just the city name, no province
      
      filtered = filtered.filter((agent) => {
        // Normalize function to extract city name from "City, Province" format
        // Handles case-insensitive matching and extra whitespace
        const normalizeCity = (cityStr: string): string => {
          if (!cityStr) return '';
          return cityStr.toLowerCase().trim().split(',')[0].trim().replace(/\s+/g, ' ');
        };
        
        // Check if the search city matches any of the agent's locations (availability or office locations)
        const normalizedSearch = normalizeCity(searchCity);
        
        if (!normalizedSearch) return false;
        
        // First check if the city is in the agent's location list (availability or office locations)
        const hasLocationInList = agent.availabilityLocations.some((loc: string) => {
          if (!loc) return false;
          const normalizedLoc = normalizeCity(loc);
          // Exact match or one contains the other (for partial matches like "Salmon Arm" vs "Salmon")
          return normalizedLoc === normalizedSearch || 
                 normalizedLoc.includes(normalizedSearch) ||
                 normalizedSearch.includes(normalizedLoc);
        });
        
        if (!hasLocationInList) {
          return false; // City not in agent's locations at all
        }
        
        // If city is in the list, include the agent (even if they have no availability set)
        // Agents will show with "No appointments" for all blocks if they have no availability
        console.log(`[AGENT SEARCH] Agent ${agent.id} matches location "${location}" (searchCity: "${searchCity}") - including agent even if no availability set`);
        return true;
      });
      
      console.log(`✅ [AGENT SEARCH] After location filter "${location}" (searchCity: "${locationParts[0]}"): ${filtered.length} agents matched`);
      
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

    if (query) {
      const queryLower = query.toLowerCase().trim();
      
      // List of funeral-related keywords that should show all funeral agents
      const funeralKeywords = ['funeral', 'funeral director', 'funeral planning', 'funeral services', 'advanced planning director'];
      
      // Check if query contains any funeral-related keywords (case-insensitive)
      const isFuneralRelatedSearch = funeralKeywords.some(keyword => 
        queryLower.includes(keyword.toLowerCase())
      );
      
      if (isFuneralRelatedSearch) {
        // If funeral-related search, don't filter by query - show all agents
        // (location and other filters still apply)
        console.log(`[AGENT SEARCH] Funeral-related search detected: "${query}" - showing all agents`);
      } else {
        // For non-funeral searches, filter agents by matching query in their fields
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
