// src/app/api/appointments/mine/route.ts
// GET: Return upcoming appointments for the current specialist

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Verify user is an agent (using old schema with agent_id)
    const { data: agent, error: agentError } = await supabaseServer
      .from("profiles")
      .select("id, role, approval_status")
      .eq("id", userId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError) {
      console.error("Error fetching agent:", agentError);
      return NextResponse.json(
        { error: "Failed to verify agent" },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        { error: "Agent record not found" },
        { status: 404 }
      );
    }

    if (agent.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent account not approved" },
        { status: 403 }
      );
    }

    // Fetch appointments for this agent (using old schema: agent_id, lead_id)
    // Fetch appointments from the past 7 days to ensure we get appointments from the current week
    // This allows the schedule view to show all appointments in the week, including past days
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: appointments, error: appointmentsError } = await supabaseServer
      .from("appointments")
      .select(
        `
        id,
        lead_id,
        requested_date,
        requested_window,
        status,
        created_at,
        confirmed_at,
        leads (
          id,
          first_name,
          last_name,
          full_name,
          email,
          city,
          province
        )
      `
      )
      .eq("agent_id", userId)
      .gte("requested_date", sevenDaysAgoStr)
      .in("status", ["pending", "confirmed", "booked"])
      .order("requested_date", { ascending: true })
      .order("created_at", { ascending: true });

    // Also fetch external calendar events (booked by coworkers/front desk)
    // These should appear in the agent's schedule alongside Soradin appointments
    // Try to fetch with title and location columns, but handle gracefully if columns don't exist yet
    let externalEvents: any[] | null = null;
    let externalEventsError: any = null;
    
    try {
      const result = await supabaseServer
        .from("external_events")
        .select("id, starts_at, ends_at, status, provider, is_soradin_created, title, location")
        .eq("specialist_id", userId) // specialist_id in external_events = agent_id (user ID)
        .eq("status", "confirmed") // Only show confirmed events
        .eq("is_soradin_created", false) // Only show external events (not Soradin-created)
        .gte("starts_at", now.toISOString()) // Only future events
        .order("starts_at", { ascending: true });
      
      externalEvents = result.data;
      externalEventsError = result.error;
    } catch (err: any) {
      // If title or location column doesn't exist, try without them
      if (err?.code === '42703' || err?.message?.includes('does not exist')) {
        console.log("Title or location column not found, fetching external events without them");
        const result = await supabaseServer
          .from("external_events")
          .select("id, starts_at, ends_at, status, provider, is_soradin_created")
          .eq("specialist_id", userId)
          .eq("status", "confirmed")
          .eq("is_soradin_created", false)
          .gte("starts_at", now.toISOString())
          .order("starts_at", { ascending: true });
        
        externalEvents = result.data;
        externalEventsError = result.error;
      } else {
        externalEventsError = err;
      }
    }

    if (externalEventsError) {
      console.error("Error fetching external events:", externalEventsError);
      // Don't fail the request if external events fail to load
    }

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    // Get agent's timezone from profile metadata or use default
    const { data: agentProfile } = await supabaseServer
      .from("profiles")
      .select("metadata")
      .eq("id", userId)
      .maybeSingle();
    
    // Get timezone from metadata, or infer from agent_province, or use browser default
    let agentTimezone = "America/Vancouver"; // Default fallback
    if (agentProfile?.metadata?.timezone) {
      agentTimezone = agentProfile.metadata.timezone;
    } else if (agentProfile?.metadata?.availability?.timezone) {
      agentTimezone = agentProfile.metadata.availability.timezone;
    } else {
      // Try to infer from agent_province if available
      const { data: profileWithProvince } = await supabaseServer
        .from("profiles")
        .select("agent_province")
        .eq("id", userId)
        .maybeSingle();
      
      if (profileWithProvince?.agent_province) {
        const province = profileWithProvince.agent_province.toUpperCase();
        // Map common provinces to timezones
        if (province === "BC" || province === "BRITISH COLUMBIA") {
          agentTimezone = "America/Vancouver"; // PST/PDT
        } else if (province === "AB" || province === "ALBERTA") {
          agentTimezone = "America/Edmonton"; // MST/MDT
        } else if (province === "SK" || province === "SASKATCHEWAN") {
          agentTimezone = "America/Regina"; // CST (no DST)
        } else if (province === "MB" || province === "MANITOBA") {
          agentTimezone = "America/Winnipeg"; // CST/CDT
        } else if (province === "ON" || province === "ONTARIO") {
          agentTimezone = "America/Toronto"; // EST/EDT
        } else if (province === "QC" || province === "QUEBEC") {
          agentTimezone = "America/Montreal"; // EST/EDT
        } else if (province === "NB" || province === "NEW BRUNSWICK" || 
                   province === "NS" || province === "NOVA SCOTIA" ||
                   province === "PE" || province === "PRINCE EDWARD ISLAND") {
          agentTimezone = "America/Halifax"; // AST/ADT
        } else if (province === "NL" || province === "NEWFOUNDLAND") {
          agentTimezone = "America/St_Johns"; // NST/NDT
        }
      }
    }

    // Map appointments to format expected by schedule page
    // Use confirmed_at (exact booking time) if available, otherwise infer from requested_window
    const mappedAppointments = (appointments || []).map((apt: any) => {
      let startsAt: string | null = null;
      let endsAt: string | null = null;
      
      // Get appointment length from agent's settings (default to 60 minutes)
      const appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
        ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
        : 60;
      const appointmentLengthMs = appointmentLengthMinutes * 60 * 1000;
      
      // If we have confirmed_at, use it directly (this is the exact booking time)
      if (apt.confirmed_at) {
        const confirmedDate = new Date(apt.confirmed_at);
        const confirmedEnd = new Date(confirmedDate.getTime() + appointmentLengthMs);
        
        startsAt = confirmedDate.toISOString();
        endsAt = confirmedEnd.toISOString();
      } else {
        // Fallback: infer from requested_window (for old appointments without confirmed_at)
        const dateStr = apt.requested_date; // Format: YYYY-MM-DD
        let startHour = 9; // Default to morning (9 AM local time)
        
        if (apt.requested_window === "afternoon") {
          startHour = 13; // 1 PM local time
        } else if (apt.requested_window === "evening") {
          startHour = 17; // 5 PM local time
        }
        
        // Create date in local timezone, then convert to UTC for storage
        // Format: YYYY-MM-DDTHH:MM:SS in local timezone
        const localDateTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`;
        
        // Use DateTime from luxon to properly handle timezone conversion
        const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
        const localEnd = localStart.plus({ minutes: appointmentLengthMinutes }); // Use actual appointment length
        
        // Convert to UTC ISO strings for the API response
        startsAt = localStart.toUTC().toISO();
        endsAt = localEnd.toUTC().toISO();
      }
      
      // Skip if DateTime conversion failed
      if (!startsAt || !endsAt) {
        console.error(`Failed to convert date/time for appointment ${apt.id}`, {
          requested_date: apt.requested_date,
          requested_window: apt.requested_window,
          confirmed_at: apt.confirmed_at,
        });
        return null;
      }
      
      // Get family name and location from lead
      const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
      const familyName = lead?.full_name || 
        (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : null) ||
        "Client";
      
      // Format location: use lead's city and province (the city where the family booked)
      // This ensures it shows the searched city (e.g., Penticton) not the agent's default city
      let location: string | null = null;
      if (lead) {
        const city = (lead.city || '').trim();
        const province = (lead.province || '').trim();
        
        // Build location string, avoiding duplication
        if (city && province) {
          // Check if city already contains province to avoid duplication
          if (city.toLowerCase().includes(province.toLowerCase())) {
            location = city; // City already includes province
          } else {
            location = `${city}, ${province}`;
          }
        } else if (city) {
          location = city;
        } else if (province) {
          location = province;
        }
      }
      
      return {
      id: apt.id,
        lead_id: apt.lead_id || (lead?.id || null),
        starts_at: startsAt,
        ends_at: endsAt,
      status: apt.status,
        family_name: familyName,
        location: location || "N/A",
      };
    });

    // Filter out any null entries from failed date conversions
    const validAppointments = mappedAppointments.filter((apt): apt is NonNullable<typeof apt> => apt !== null);

    // Map external events to the same format as appointments
    // These represent meetings booked by coworkers/front desk in external calendars
    const mappedExternalEvents = (externalEvents || []).map((evt: any) => {
      const providerName = evt.provider === "google" ? "Google Calendar" : 
                          evt.provider === "microsoft" ? "Microsoft Calendar" : 
                          evt.provider === "ics" ? "ICS Calendar" : 
                          "External Calendar";
      
      // Use the actual event title if available, otherwise fall back to provider name
      const eventTitle = evt.title && evt.title.trim() 
        ? evt.title.trim() 
        : `External Meeting (${providerName})`;
      
      // Use the actual location from the event if available, otherwise show provider
      const eventLocation = evt.location && evt.location.trim()
        ? evt.location.trim()
        : providerName;
      
      return {
        id: `external-${evt.id}`, // Prefix to distinguish from Soradin appointments
        lead_id: null, // External events don't have leads
        starts_at: evt.starts_at,
        ends_at: evt.ends_at,
        status: "confirmed", // External events are always confirmed
        family_name: eventTitle, // Use the actual event title from the external calendar
        location: eventLocation, // Use the actual location from the external calendar event
        is_external: true, // Flag to identify external events in the UI
        provider: evt.provider,
      };
    });

    // Combine appointments and external events, sort by start time
    const allEvents = [...validAppointments, ...mappedExternalEvents].sort((a, b) => {
      const aStart = new Date(a.starts_at).getTime();
      const bStart = new Date(b.starts_at).getTime();
      return aStart - bStart;
    });

    return NextResponse.json(allEvents);
  } catch (error: any) {
    console.error("Error in GET /api/appointments/mine:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

