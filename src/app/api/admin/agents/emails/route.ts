// API route to fetch agent emails from auth.users (admin only, batch)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentIds } = body;

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: "Agent IDs array is required" },
        { status: 400 }
      );
    }

    // Fetch emails from auth.users for all agents
    const emailMap: Record<string, string | null> = {};
    
    // Fetch emails one by one (Supabase doesn't have batch getUserById)
    for (const agentId of agentIds) {
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(agentId);
        
        if (!authError && authUser?.user?.email) {
          emailMap[agentId] = authUser.user.email;
        } else {
          emailMap[agentId] = null;
        }
      } catch (err) {
        console.error(`Error fetching email for agent ${agentId}:`, err);
        emailMap[agentId] = null;
      }
    }

    return NextResponse.json({ emails: emailMap });
  } catch (error: any) {
    console.error("Error in /api/admin/agents/emails:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

