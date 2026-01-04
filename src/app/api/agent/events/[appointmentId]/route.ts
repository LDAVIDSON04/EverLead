import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await context.params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointment ID" },
        { status: 400 }
      );
    }

    // Get agent from session
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, metadata, agent_province")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json({ error: "Agent not found", details: profileError.message }, { status: 404 });
    }

    if (!profile || profile.role !== "agent") {
      console.error("Profile not found or not an agent:", { userId: user.id, profile });
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Verify the appointment belongs to this agent
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, lead_id")
      .eq("id", appointmentId)
      .eq("agent_id", profile.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found or access denied" },
        { status: 404 }
      );
    }

    // Verify it's an agent-created event (system lead)
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, email")
      .eq("id", appointment.lead_id)
      .single();

    if (leadError || !lead || !lead.email?.includes("@soradin.internal")) {
      return NextResponse.json(
        { error: "This event cannot be edited" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, startsAt, endsAt, location, description } = body;

    if (!title || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "Missing required fields: title, startsAt, endsAt" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = DateTime.fromISO(startsAt);
    const endDate = DateTime.fromISO(endsAt);

    if (!startDate.isValid || !endDate.isValid) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Get agent's timezone
    let agentTimezone = "America/Vancouver"; // Default fallback
    if (profile.metadata?.timezone) {
      agentTimezone = profile.metadata.timezone;
    } else if (profile.metadata?.availability?.timezone) {
      agentTimezone = profile.metadata.availability.timezone;
    } else if (profile.agent_province) {
      const province = profile.agent_province.toUpperCase();
      if (province === "BC" || province === "BRITISH COLUMBIA") {
        agentTimezone = "America/Vancouver";
      } else if (province === "AB" || province === "ALBERTA") {
        agentTimezone = "America/Edmonton";
      } else if (province === "SK" || province === "SASKATCHEWAN") {
        agentTimezone = "America/Regina";
      } else if (province === "MB" || province === "MANITOBA") {
        agentTimezone = "America/Winnipeg";
      } else if (province === "ON" || province === "ONTARIO") {
        agentTimezone = "America/Toronto";
      } else if (province === "QC" || province === "QUEBEC") {
        agentTimezone = "America/Montreal";
      }
    }

    const localStart = startDate.setZone(agentTimezone);
    const localEnd = endDate.setZone(agentTimezone);

    // Determine requested_date and requested_window
    const requestedDate = localStart.toFormat("yyyy-MM-dd");
    let requestedWindow = "morning";
    const hour = localStart.hour;
    if (hour >= 12 && hour < 17) {
      requestedWindow = "afternoon";
    } else if (hour >= 17) {
      requestedWindow = "evening";
    }

    // Update the lead (title, location, description)
    const { error: updateLeadError } = await supabaseAdmin
      .from("leads")
      .update({
        full_name: title,
        city: location || "Internal",
        additional_notes: description || null,
      })
      .eq("id", appointment.lead_id);

    if (updateLeadError) {
      console.error("Error updating lead:", updateLeadError);
      return NextResponse.json(
        { error: "Failed to update event", details: updateLeadError.message },
        { status: 500 }
      );
    }

    // Update the appointment
    const { error: updateAppointmentError } = await supabaseAdmin
      .from("appointments")
      .update({
        confirmed_at: startsAt,
        requested_date: requestedDate,
        requested_window: requestedWindow,
      })
      .eq("id", appointmentId);

    if (updateAppointmentError) {
      console.error("Error updating appointment:", updateAppointmentError);
      return NextResponse.json(
        { error: "Failed to update event", details: updateAppointmentError.message },
        { status: 500 }
      );
    }

    // Sync to external calendars if connected
    try {
      const { syncAgentAppointmentToGoogleCalendar, syncAgentAppointmentToMicrosoftCalendar } = await import("@/lib/calendarSyncAgent");

      await Promise.all([
        syncAgentAppointmentToGoogleCalendar(appointmentId).catch(err => {
          console.error("Error syncing to Google Calendar (non-fatal):", err);
        }),
        syncAgentAppointmentToMicrosoftCalendar(appointmentId).catch(err => {
          console.error("Error syncing to Microsoft Calendar (non-fatal):", err);
        }),
      ]);
    } catch (syncError) {
      // Log but don't fail - calendar sync is optional
      console.error("Error syncing event to external calendars:", syncError);
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointmentId,
        title,
        startsAt,
        endsAt,
        location,
        description,
      },
    });
  } catch (error: any) {
    console.error("Error in update event API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

