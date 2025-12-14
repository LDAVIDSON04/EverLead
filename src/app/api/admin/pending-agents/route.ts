// src/app/api/admin/pending-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get all agents with pending approval
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "agent")
      .in("approval_status", ["pending", null])
      .order("created_at", { ascending: false });

    if (agentsError) {
      console.error("Error fetching pending agents:", agentsError);
      return NextResponse.json(
        { error: "Failed to fetch pending agents" },
        { status: 500 }
      );
    }

    // Get emails from auth.users
    const agentsWithEmail = await Promise.all(
      (agents || []).map(async (agent: any) => {
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
