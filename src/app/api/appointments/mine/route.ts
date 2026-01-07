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
    // Fetch appointments without date filtering - we'll filter by actual appointment date after mapping
    // This ensures we get all appointments for the current week view, including past days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // Fetch appointments - try with notes first, fallback without if column doesn't exist
    let appointments: any[] | null = null;
    let appointmentsError: any = null;
    let hasNotesColumn = true;
    
    // Fetch all confirmed/booked appointments - we'll filter by actual appointment date (confirmed_at or requested_date) after mapping
    const result = await supabaseServer
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
        office_location_id,
        notes,
        leads (
          id,
          first_name,
          last_name,
          full_name,
          email,
          city,
          province,
          additional_notes
        )
      `
      )
      .eq("agent_id", userId)
      .neq("status", "cancelled") // Include all appointments except cancelled ones
      .order("requested_date", { ascending: true })
      .order("created_at", { ascending: true });
    
    if (result.error) {
      // Check if error is due to missing notes column
      if (result.error.code === '42703' && result.error.message?.includes('notes')) {
        // Notes column doesn't exist - this is fine, we'll continue without it
        hasNotesColumn = false;
        const resultWithoutNotes = await supabaseServer
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
            office_location_id,
            leads (
              id,
              first_name,
              last_name,
              full_name,
              email,
              city,
              province,
              additional_notes
            )
          `
          )
          .eq("agent_id", userId)
          .neq("status", "cancelled") // Include all appointments except cancelled ones
          .order("requested_date", { ascending: true })
          .order("created_at", { ascending: true });
        
        appointments = resultWithoutNotes.data;
        appointmentsError = resultWithoutNotes.error;
      } else {
        appointments = result.data;
        appointmentsError = result.error;
      }
    } else {
      appointments = result.data;
    }

    // Also fetch external calendar events (booked by coworkers/front desk)
    // These should appear in the agent's schedule alongside Soradin appointments
    // Fetch events from the past 30 days to show all events in the current week view
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
        .gte("starts_at", thirtyDaysAgo.toISOString()) // Include past events from the past 30 days
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
          .gte("starts_at", thirtyDaysAgo.toISOString())
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

    // Fetch all office locations for appointments that have office_location_id
    const officeLocationIds = (appointments || [])
      .map((apt: any) => apt.office_location_id)
      .filter((id: any): id is string => !!id);
    
    let officeLocationsMap: Record<string, { city: string | null; province: string | null }> = {};
    if (officeLocationIds.length > 0) {
      const uniqueOfficeLocationIds = Array.from(new Set(officeLocationIds)); // Remove duplicates
      const { data: officeLocations, error: officeLocError } = await supabaseServer
        .from('office_locations')
        .select('id, city, province')
        .in('id', uniqueOfficeLocationIds);
      
      if (officeLocError) {
        console.error('❌ Error fetching office locations:', officeLocError);
      }
      
      if (officeLocations) {
        officeLocationsMap = officeLocations.reduce((acc: any, loc: any) => {
          acc[loc.id] = { city: loc.city, province: loc.province };
          return acc;
        }, {});
        
        console.log(`📍 Fetched ${officeLocations.length} office locations for ${uniqueOfficeLocationIds.length} unique IDs:`, 
          officeLocations.map((loc: any) => ({ id: loc.id, city: loc.city, province: loc.province }))
        );
      }
    }

    // Map appointments to format expected by schedule page
    // Use confirmed_at (exact booking time) if available, otherwise infer from requested_window
    const mappedAppointments = (appointments || []).map((apt: any) => {
      let startsAt: string | null = null;
      let endsAt: string | null = null;
      
      // Try to get duration from lead's additional_notes for agent-created events
      let appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
        ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
        : 60; // Default to 60 minutes
      
      const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
      const isAgentEvent = lead?.email?.includes('@soradin.internal');
      
      if (lead?.additional_notes) {
        console.log(`🔍 Parsing duration from additional_notes:`, {
          appointmentId: apt.id,
          title: lead.full_name,
          additional_notes: lead.additional_notes,
          notesLength: lead.additional_notes?.length,
        });
        const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
        if (durationMatch) {
          appointmentLengthMinutes = parseInt(durationMatch[1], 10);
          console.log(`✅ Found duration in notes: ${appointmentLengthMinutes} minutes`);
        } else {
          console.log(`❌ No duration match found. Regex pattern: /^EVENT_DURATION:(\\d+)\\|/`);
        }
      } else if (isAgentEvent) {
        // Only warn if this is an agent-created event that should have additional_notes
        console.log(`⚠️ No additional_notes found for agent-created event:`, {
          appointmentId: apt.id,
          hasLead: !!lead,
          leadEmail: lead?.email,
        });
      }
      // Regular appointments don't need additional_notes, so no warning needed
      
      const appointmentLengthMs = appointmentLengthMinutes * 60 * 1000;
      
      // If we have confirmed_at, use it directly (this is the exact booking time)
      if (apt.confirmed_at) {
        const confirmedDate = new Date(apt.confirmed_at);
        const confirmedEnd = new Date(confirmedDate.getTime() + appointmentLengthMs);
        
        startsAt = confirmedDate.toISOString();
        endsAt = confirmedEnd.toISOString();
        
        // Debug log for agent-created events with duration
        if (lead?.email?.includes('@soradin.internal')) {
          console.log(`📅 Agent event duration calculation:`, {
            title: lead.full_name,
            confirmed_at: apt.confirmed_at,
            appointmentLengthMinutes,
            startsAt,
            endsAt,
            durationMs: appointmentLengthMs,
          });
        }
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
      
      // Get family name and location from lead (lead already defined above)
      // Get family name
      // Check if this is an agent-created event by looking for system lead pattern
      let familyName: string;
      if (lead?.email?.includes('@soradin.internal') && lead?.first_name === 'System' && lead?.last_name === 'Event') {
        // This is an agent-created event - use full_name which contains the title
        familyName = lead?.full_name || "Event";
      } else if (apt.notes && apt.notes.includes('Internal event:')) {
        // Fallback: try to extract from notes if available
        const notesMatch = apt.notes.match(/^Internal event:\s*(.+?)(?:\s*\||$)/i);
        familyName = notesMatch ? notesMatch[1].trim() : apt.notes.split('|')[0].trim() || "Event";
      } else {
        familyName = lead?.full_name || 
          (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : null) ||
          "Client";
      }
      
      // Get location from office_location_id or from notes (for agent-created events)
      let location: string | null = null;
      
      if (apt.office_location_id) {
        const officeLocation = officeLocationsMap[apt.office_location_id];
        if (officeLocation) {
          const city = (officeLocation.city || '').trim();
          const province = (officeLocation.province || '').trim();
          
          if (city && province) {
            location = `${city}, ${province}`;
          } else if (city) {
            location = city;
          } else if (province) {
            location = province;
          }
        }
      }
      
      // Try to extract location from notes for agent-created events if no office_location_id
      if (!location && apt.notes && apt.notes.includes('Location:')) {
        const locationMatch = apt.notes.match(/Location:\s*(.+?)(?:\s*\||$)/i);
        if (locationMatch) {
          location = locationMatch[1].trim();
        }
      }
      
      // If still no location, try to get from lead city (for system events)
      if (!location && lead?.email?.includes('@soradin.internal') && lead?.city) {
        location = lead.city;
      }
      
      // If no location found, it will be null and will display as "N/A"
      
      const result = {
        id: apt.id,
        lead_id: apt.lead_id || (lead?.id || null),
        starts_at: startsAt,
        ends_at: endsAt,
        status: apt.status,
        family_name: familyName,
        location: location || "N/A",
      };
      
      // Debug logging for location assignment
      if (!location || location === "N/A") {
        console.log(`⚠️ Appointment ${apt.id} has no location:`, {
          office_location_id: apt.office_location_id,
          hasOfficeLocationInMap: apt.office_location_id ? !!officeLocationsMap[apt.office_location_id] : false,
          leadCity: lead?.city,
          leadProvince: lead?.province,
        });
      }
      
      return result;
    });

    // Filter out any null entries from failed date conversions
    // Don't filter by date here - let the client-side filtering handle showing only the week being viewed
    // This ensures all appointments are available, including those from past days in the current week
    const validAppointments = mappedAppointments.filter((apt): apt is NonNullable<typeof apt> => apt !== null);
    
    // Log appointments for debugging
    console.log(`📅 [APPOINTMENTS API] Returning ${validAppointments.length} appointments:`, 
      validAppointments.map(apt => ({
        id: apt.id,
        family_name: apt.family_name,
        starts_at: apt.starts_at,
        status: apt.status
      }))
    );

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

