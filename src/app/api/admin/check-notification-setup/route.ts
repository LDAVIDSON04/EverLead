// src/app/api/admin/check-notification-setup/route.ts
// Diagnostic endpoint to check notification setup

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error: supabaseAdmin not initialized" },
        { status: 500 }
      );
    }

    const checks: any = {
      resendConfigured: !!process.env.RESEND_API_KEY,
      resendFromEmail: process.env.RESEND_FROM_EMAIL || "Not set",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "Not set",
    };

    // Check agents
    const { data: allAgents, error: agentsError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, approval_status, agent_city, agent_province, agent_latitude, agent_longitude, search_radius_km")
      .eq("role", "agent");

    if (agentsError) {
      checks.agentsError = agentsError.message;
      checks.agents = [];
    } else {
      checks.totalAgents = allAgents?.length || 0;
      checks.approvedAgents = allAgents?.filter((a: any) => a.approval_status === "approved").length || 0;
      checks.agentsWithLocation = allAgents?.filter(
        (a: any) => a.approval_status === "approved" && a.agent_latitude && a.agent_longitude && a.search_radius_km
      ).length || 0;

      // Get emails for agents
      const agentsWithDetails = await Promise.all(
        (allAgents || []).map(async (agent: any) => {
          let email = null;
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agent.id);
            email = authUser?.user?.email || null;
          } catch (e) {
            console.error(`Error fetching email for agent ${agent.id}:`, e);
          }
          return {
            id: agent.id,
            full_name: agent.full_name,
            approval_status: agent.approval_status,
            hasLocation: !!(agent.agent_latitude && agent.agent_longitude),
            location: agent.agent_city && agent.agent_province 
              ? `${agent.agent_city}, ${agent.agent_province}` 
              : "Not set",
            radius: agent.search_radius_km || "Not set",
            email: email || "Not found in auth.users",
          };
        })
      );
      checks.agents = agentsWithDetails;
    }

    // Check recent leads
    const { data: recentLeads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("id, city, province, latitude, longitude, urgency_level, lead_price, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (leadsError) {
      checks.leadsError = leadsError.message;
      checks.recentLeads = [];
    } else {
      checks.recentLeads = (recentLeads || []).map((lead: any) => ({
        id: lead.id,
        city: lead.city,
        province: lead.province,
        hasCoordinates: !!(lead.latitude && lead.longitude),
        coordinates: lead.latitude && lead.longitude 
          ? `${lead.latitude}, ${lead.longitude}` 
          : "Not set",
        urgency: lead.urgency_level,
        price: lead.lead_price,
        created_at: lead.created_at,
      }));
    }

    return NextResponse.json(
      {
        message: "Notification setup diagnostic",
        checks,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in check-notification-setup route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

