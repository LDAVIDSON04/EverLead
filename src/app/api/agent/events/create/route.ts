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

    // Get agent's timezone from metadata or infer from province
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

    // Create appointment record
    // For agent-created events, we need to create a dummy lead since lead_id is NOT NULL
    // Or store in external_events table instead
    // Let's check if we can create in appointments without a lead, or use external_events
    
    // Try to create in appointments first - but we need a lead_id
    // For now, let's create a dummy/placeholder lead entry for agent-created events
    // Actually, better approach: store in external_events with is_soradin_created=true
    // This way it shows in the schedule but doesn't require a lead
    
    // Create appointment data
    // Note: We don't include notes field as it doesn't exist in the appointments table
    // The event information is stored in the lead's full_name field instead
    const appointmentData: any = {
      agent_id: profile.id,
      confirmed_at: startsAt,
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: "confirmed",
    };
    
    // Since lead_id is NOT NULL, we need to create a system/dummy lead
    // For now, we'll create a minimal lead entry for agent-created events
    // Or we could store these in external_events instead
    
    // Actually, let's create a system lead for agent-created events
    // Need to include required fields like lead_price
    const { data: systemLead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        first_name: "System",
        last_name: "Event",
        full_name: title,
        email: `system-${profile.id}@soradin.internal`,
        city: location || "Internal",
        province: "BC",
        service_type: "Internal Event",
        status: "new",
        lead_price: 0, // Required field - set to 0 for system/internal events
        urgency_level: "cold", // Required for pricing calculation
      })
      .select()
      .single();
    
    if (leadError || !systemLead) {
      console.error("Error creating system lead for event:", leadError);
      return NextResponse.json(
        { error: "Failed to create event", details: "Could not create system lead" },
        { status: 500 }
      );
    }
    
    appointmentData.lead_id = systemLead.id;

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

