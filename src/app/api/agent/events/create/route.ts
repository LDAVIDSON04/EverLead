import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
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
      .select("id, role, agent_timezone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
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
    const agentTimezone = profile.agent_timezone || "America/Vancouver";
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

    // Create appointment record
    // For agent-created events, we'll use a special lead_id or null
    // and mark it as an internal event
    const appointmentData = {
      agent_id: profile.id,
      lead_id: null, // Agent-created events don't have a lead
      confirmed_at: startsAt, // Store the actual start time
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: "confirmed",
      notes: `Internal event: ${title}${location ? ` | Location: ${location}` : ""}${description ? ` | ${description}` : ""}`,
      // Store location in notes or we could add a location field if needed
    };

    const { data: appointment, error: insertError } = await supabaseAdmin
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating event:", insertError);
      return NextResponse.json(
        { error: "Failed to create event", details: insertError.message },
        { status: 500 }
      );
    }

    // Sync to external calendars if connected
    try {
      const { syncAgentAppointmentToGoogleCalendar, syncAgentAppointmentToMicrosoftCalendar } = await import("@/lib/calendarSyncAgent");
      
      // Sync using the appointment ID (the functions will fetch the appointment details)
      await Promise.all([
        syncAgentAppointmentToGoogleCalendar(appointment.id).catch(err => {
          console.error("Error syncing to Google Calendar (non-fatal):", err);
        }),
        syncAgentAppointmentToMicrosoftCalendar(appointment.id).catch(err => {
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
        id: appointment.id,
        title,
        startsAt,
        endsAt,
        location,
        description,
      },
    });
  } catch (error: any) {
    console.error("Error in create event API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

