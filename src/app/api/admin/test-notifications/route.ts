// src/app/api/admin/test-notifications/route.ts
// Admin endpoint to test notification system and check agent eligibility

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { isWithinRadius, calculateDistance } from "@/lib/distance";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get all approved agents
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, agent_latitude, agent_longitude, search_radius_km, approval_status")
      .eq("role", "agent");

    if (agentsError) {
      return NextResponse.json(
        { error: "Failed to fetch agents", details: agentsError.message },
        { status: 500 }
      );
    }

    // Get agent emails and location status
    const agentDetails = await Promise.all(
      (agents || []).map(async (agent: any) => {
        let email = null;
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agent.id);
          email = authUser?.user?.email || null;
        } catch (err) {
          console.error(`Error getting email for ${agent.id}:`, err);
        }

        const hasLocation = !!(agent.agent_latitude && agent.agent_longitude);
        const hasRadius = !!agent.search_radius_km;
        const isApproved = agent.approval_status === "approved";

        return {
          id: agent.id,
          full_name: agent.full_name,
          email,
          approval_status: agent.approval_status,
          isApproved,
          hasLocation,
          hasRadius,
          location: hasLocation
            ? {
                lat: agent.agent_latitude,
                lon: agent.agent_longitude,
                radius: agent.search_radius_km || 50,
              }
            : null,
          eligibleForNotifications: isApproved && hasLocation && hasRadius,
        };
      })
    );

    // Get recent leads with location
    const { data: recentLeads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("id, city, province, latitude, longitude, urgency_level, lead_price, created_at")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    // Check which agents would be notified for each recent lead
    const leadNotifications = (recentLeads || []).map((lead: any) => {
      const leadLat = parseFloat(lead.latitude);
      const leadLon = parseFloat(lead.longitude);

      if (isNaN(leadLat) || isNaN(leadLon)) {
        return {
          leadId: lead.id,
          city: lead.city,
          province: lead.province,
          hasValidLocation: false,
          eligibleAgents: [],
        };
      }

      const eligibleAgents = agentDetails
        .filter((agent) => {
          if (!agent.eligibleForNotifications || !agent.location) return false;
          return isWithinRadius(
            agent.location.lat,
            agent.location.lon,
            leadLat,
            leadLon,
            agent.location.radius
          );
        })
        .map((agent) => ({
          id: agent.id,
          name: agent.full_name,
          email: agent.email,
          distance: calculateDistance(
            agent.location!.lat,
            agent.location!.lon,
            leadLat,
            leadLon
          ).toFixed(1),
        }));

      return {
        leadId: lead.id,
        city: lead.city,
        province: lead.province,
        location: { lat: leadLat, lon: leadLon },
        urgency: lead.urgency_level,
        price: lead.lead_price,
        created_at: lead.created_at,
        hasValidLocation: true,
        eligibleAgents,
      };
    });

    return NextResponse.json(
      {
        agents: agentDetails,
        recentLeads: leadNotifications,
        summary: {
          totalAgents: agentDetails.length,
          approvedAgents: agentDetails.filter((a) => a.isApproved).length,
          agentsWithLocation: agentDetails.filter((a) => a.hasLocation).length,
          eligibleForNotifications: agentDetails.filter((a) => a.eligibleForNotifications).length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in test-notifications route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

