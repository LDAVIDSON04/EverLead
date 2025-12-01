// src/app/api/appointments/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkBotId } from 'botid/server';

export async function POST(req: NextRequest) {
  // Check for bots
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json(
      { error: 'Bot detected. Access denied.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const appointmentId = body.appointmentId as string | undefined;
    const acknowledgedTimeWindow = body.acknowledgedTimeWindow as boolean | undefined;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 }
      );
    }

    if (!acknowledgedTimeWindow) {
      return NextResponse.json(
        { error: "You must acknowledge the time-window policy before claiming." },
        { status: 400 }
      );
    }

    // 1) Get agentId from request body (client sends it)
    // Note: For better security, we could use server-side auth, but keeping current pattern for now
    const agentId = body.agentId as string | undefined;

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // 2) Load agent profile + approval + region
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status, agent_province")
      .eq("id", agentId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Could not load agent profile" },
        { status: 403 }
      );
    }

    if (profile.role !== "agent" || profile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Your account is not approved to claim appointments yet" },
        { status: 403 }
      );
    }

    // 3) Fetch appointment + lead summary (for email + region guard)
    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        status,
        agent_id,
        lead_id,
        requested_date,
        requested_window,
        price_cents,
        leads (
          id,
          full_name,
          city,
          province,
          service_type
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Extra safety: make sure this appointment is in the agent's region
    const lead = Array.isArray((appt as any).leads) 
      ? (appt as any).leads[0] 
      : (appt as any).leads;

    if (lead?.province && profile.agent_province) {
      const leadProvinceUpper = (lead.province || '').toUpperCase().trim();
      const agentProvinceUpper = (profile.agent_province || '').toUpperCase().trim();
      
      if (leadProvinceUpper !== agentProvinceUpper) {
        return NextResponse.json(
          { error: `You are not licensed/assigned for this region. This appointment is in ${lead.province}, but you are licensed for ${profile.agent_province}.` },
          { status: 403 }
        );
      }
    }

    if (appt.status !== "pending" || appt.agent_id !== null) {
      return NextResponse.json(
        { error: "Appointment is no longer available" },
        { status: 409 }
      );
    }

    // 4) Get lead info for Stripe description
    const leadLocation = lead
      ? `${lead.city || ""}${lead.city && lead.province ? ", " : ""}${lead.province || ""}`
      : "your area";

    // Directly assign the appointment to the agent (no Stripe - claim now flow)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        agent_id: agentId,
        status: "booked",
        price_cents: 0, // Free claim
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .eq("status", "pending")
      .is("agent_id", null)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("Appointment claim error:", updateError);
      return NextResponse.json(
        { error: "Could not claim appointment. It may have been claimed by another agent." },
        { status: 500 }
      );
    }

    // Also assign the lead to this agent so it shows in "My Pipeline"
    if (updated.lead_id) {
      const { error: leadUpdateError } = await supabaseAdmin
        .from("leads")
        .update({
          assigned_agent_id: agentId,
          status: "purchased_by_agent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", updated.lead_id)
        .is("assigned_agent_id", null); // Only update if not already assigned

      if (leadUpdateError) {
        console.error("⚠️ Failed to assign lead to agent (non-fatal):", leadUpdateError);
        // Don't fail the whole request - appointment is already assigned
      } else {
        console.log("✅ Lead also assigned to agent:", {
          lead_id: updated.lead_id,
          agentId,
        });
      }
    }

    console.log("✅ Appointment successfully claimed:", {
      appointmentId,
      agentId,
      status: updated.status,
      lead_id: updated.lead_id,
    });

    // Return success - no redirect needed, client will handle
    return NextResponse.json({ 
      success: true,
      appointment: updated,
      message: "Appointment claimed successfully"
    });
  } catch (err: any) {
    console.error("Appointment buy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

