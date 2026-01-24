// POST /api/appointments/mark-video
// Retroactively mark an appointment as a video call (sets office_location_id = null).
// Used to fix old appointments that were stored incorrectly. Only the owning agent can update.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointmentId = body.appointmentId as string | undefined;
    const agentId = body.agentId as string | undefined;

    if (!appointmentId || !agentId) {
      return NextResponse.json(
        { error: "Missing appointmentId or agentId" },
        { status: 400 }
      );
    }

    const { data: agentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !agentProfile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    if (agentProfile.role !== "agent" || agentProfile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent account not approved" },
        { status: 403 }
      );
    }

    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, office_location_id")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appt.agent_id !== agentId) {
      return NextResponse.json(
        { error: "You do not own this appointment" },
        { status: 403 }
      );
    }

    if (appt.office_location_id == null) {
      return NextResponse.json(
        { ok: true, message: "Already marked as video" },
        { status: 200 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        office_location_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("mark-video update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update appointment", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("mark-video error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
