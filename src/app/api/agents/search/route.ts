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

    // Filter agents who are approved (both profile AND bio) and have availability configured
    const agentsWithAvailability: AgentSearchResult[] = (profiles || [])
      .filter((profile: any) => {
        try {
          // Single unified approval - check only approval_status
          // When admin approves, both profile and bio are approved together
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
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
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
            console.log(`[AGENT SEARCH] Agent ${agent.id} has no payment method - excluding from results`);
            return null;
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
        const normalizeCity = (cityStr: string): string => {
          return cityStr.toLowerCase().trim().split(',')[0].trim();
        };
        
        // Check availabilityByLocation keys (case-insensitive)
        // Only match if the city has actual availability set with time slots (at least one day enabled)
        const normalizedSearch = normalizeCity(searchCity);
        const hasLocationInByLocation = Object.keys(agent.availabilityByLocation).some((loc: string) => {
          const normalizedLoc = normalizeCity(loc);
          const cityMatches = normalizedLoc === normalizedSearch || 
                 normalizedLoc.includes(normalizedSearch) ||
                 normalizedSearch.includes(normalizedLoc);
          
          if (!cityMatches) return false;
          
          // Check if this city has actual availability set (at least one day enabled)
          const cityAvailability = agent.availabilityByLocation[loc];
          if (!cityAvailability) return false;
          
          // Check if at least one day has enabled: true
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const hasEnabledDay = days.some((day: string) => {
            const dayData = cityAvailability[day];
            return dayData && dayData.enabled === true;
          });
          
          return hasEnabledDay;
        });
        
        const matches = hasLocationInByLocation;
        
        if (matches) {
          console.log(`[AGENT SEARCH] Agent ${agent.id} matches location "${location}" (searchCity: "${searchCity}")`);
        }
        
        return matches;
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
