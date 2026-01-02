// API route to fetch agent email from auth.users (admin only)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Get email from auth.users (admin client can access this)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(agentId);

    if (authError) {
      console.error("Error fetching user email:", authError);
      return NextResponse.json(
        { error: "Failed to fetch user email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email: authUser?.user?.email || null,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/agents/[id]/email:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

