import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteSingleExternalEvent } from "@/lib/calendarSyncAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DELETE /api/agent/external-events/[externalEventId]
 * Removes an external calendar event from the agent's schedule and from the
 * linked Google/Microsoft calendar so it does not reappear on sync.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ externalEventId: string }> }
) {
  try {
    const { externalEventId: rawId } = await context.params;

    if (!rawId) {
      return NextResponse.json(
        { error: "Missing external event ID" },
        { status: 400 }
      );
    }

    const externalEventId = rawId.startsWith("external-")
      ? rawId.slice("external-".length)
      : rawId;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await deleteSingleExternalEvent(externalEventId, profile.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "External event not found") {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    if (error.message === "Not allowed to delete this event") {
      return NextResponse.json(
        { error: "Not allowed to delete this event" },
        { status: 403 }
      );
    }
    console.error("Error in DELETE external event API:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to delete event",
      },
      { status: 500 }
    );
  }
}
