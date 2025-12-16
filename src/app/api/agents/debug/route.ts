// Debug endpoint to check agent status and availability
// This helps diagnose why agents aren't showing up in search

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get all agents
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, first_name, last_name, agent_city, agent_province, approval_status, metadata")
      .eq("role", "agent");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch agents", details: error },
        { status: 500 }
      );
    }

    const agentsInfo = (profiles || []).map((profile: any) => {
      const metadata = profile.metadata || {};
      const availability = metadata.availability || {};
      const locations = availability.locations || [];
      
      return {
        id: profile.id,
        name: profile.full_name || `${profile.first_name} ${profile.last_name}`,
        city: profile.agent_city,
        province: profile.agent_province,
        approval_status: profile.approval_status,
        hasAvailability: locations.length > 0,
        availabilityLocations: locations,
        metadataKeys: Object.keys(metadata),
      };
    });

    return NextResponse.json({
      totalAgents: profiles?.length || 0,
      agents: agentsInfo,
      summary: {
        approved: agentsInfo.filter((a: any) => a.approval_status === "approved").length,
        withAvailability: agentsInfo.filter((a: any) => a.hasAvailability).length,
        approvedWithAvailability: agentsInfo.filter((a: any) => 
          a.approval_status === "approved" && a.hasAvailability
        ).length,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/agents/debug:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
