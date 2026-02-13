// src/app/api/admin/pending-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    // Get all agents with pending approval (single unified approval)
    // Include bio information for display in approval modal
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "agent")
      .or("approval_status.is.null,approval_status.eq.pending,approval_status.eq.needs-info")
      .order("created_at", { ascending: false });

    if (agentsError) {
      console.error("Error fetching pending agents:", agentsError);
      return NextResponse.json(
        { error: "Failed to fetch pending agents" },
        { status: 500 }
      );
    }

    const agentIds = (agents || []).map((a: any) => a.id);
    const { data: officeLocationsRows } = agentIds.length > 0
      ? await supabaseAdmin
          .from("office_locations")
          .select("agent_id, name, street_address, city, province, postal_code")
          .in("agent_id", agentIds)
          .order("display_order", { ascending: true })
      : { data: [] as any[] };
    const officesByAgentId: Record<string, { name: string; street_address: string | null; city: string; province: string; postal_code: string | null }[]> = {};
    (officeLocationsRows || []).forEach((row: any) => {
      if (!officesByAgentId[row.agent_id]) officesByAgentId[row.agent_id] = [];
      officesByAgentId[row.agent_id].push({
        name: row.name || "",
        street_address: row.street_address ?? null,
        city: row.city || "",
        province: row.province || "",
        postal_code: row.postal_code ?? null,
      });
    });

    const agentsWithEmail = await Promise.all(
      (agents || []).map(async (agent: any) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agent.id);
          return {
            ...agent,
            email: authUser?.user?.email || null,
            office_locations: officesByAgentId[agent.id] || [],
          };
        } catch (err) {
          console.error(`Error fetching email for agent ${agent.id}:`, err);
          return {
            ...agent,
            email: null,
            office_locations: officesByAgentId[agent.id] || [],
          };
        }
      })
    );

    return NextResponse.json(agentsWithEmail);
  } catch (error: any) {
    console.error("Error in GET /api/admin/pending-agents:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
