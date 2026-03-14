// PATCH: Update agent profile bio (admin only; agent is not notified)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    const { id: agentId } = await params;
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const ai_generated_bio =
      body.ai_generated_bio !== undefined && body.ai_generated_bio !== null
        ? String(body.ai_generated_bio)
        : undefined;

    if (ai_generated_bio === undefined) {
      return NextResponse.json(
        { error: "ai_generated_bio is required in body" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ ai_generated_bio: ai_generated_bio || null })
      .eq("id", agentId)
      .eq("role", "agent");

    if (updateError) {
      console.error("Error updating agent bio:", updateError);
      return NextResponse.json(
        { error: "Failed to update bio" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in PATCH /api/admin/agents/[id]/bio:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
