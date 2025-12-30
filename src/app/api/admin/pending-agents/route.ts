// src/app/api/admin/pending-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get all agents with pending approval (either profile or bio)
    // Include bio information for unified approval
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "agent")
      .or("approval_status.is.null,approval_status.eq.pending,bio_approval_status.is.null,bio_approval_status.eq.pending")
      .order("created_at", { ascending: false });
    
    // Filter to only show agents where at least one approval is pending
    // (not both approved)
    const pendingAgents = (agents || []).filter((agent: any) => {
      const profilePending = !agent.approval_status || agent.approval_status === 'pending';
      const bioPending = !agent.bio_approval_status || agent.bio_approval_status === 'pending';
      return profilePending || bioPending;
    });

    if (agentsError) {
      console.error("Error fetching pending agents:", agentsError);
      return NextResponse.json(
        { error: "Failed to fetch pending agents" },
        { status: 500 }
      );
    }

    // Get emails from auth.users
    const agentsWithEmail = await Promise.all(
      pendingAgents.map(async (agent: any) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agent.id);
          return {
            ...agent,
            email: authUser?.user?.email || null,
          };
        } catch (err) {
          console.error(`Error fetching email for agent ${agent.id}:`, err);
          return {
            ...agent,
            email: null,
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
