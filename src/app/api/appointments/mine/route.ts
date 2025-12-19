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

    // Fetch upcoming appointments for this agent (using old schema: agent_id, lead_id)
    // Convert requested_date and requested_window to starts_at/ends_at for display
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: appointments, error: appointmentsError } = await supabaseServer
      .from("appointments")
      .select(
        `
        id,
        requested_date,
        requested_window,
        status,
        created_at,
        leads (
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
      .gte("requested_date", today)
      .in("status", ["pending", "confirmed", "booked"])
      .order("requested_date", { ascending: true })
      .order("created_at", { ascending: true });

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
    // Convert requested_date + requested_window to starts_at/ends_at
    // Use agent's timezone for local times
    const mappedAppointments = (appointments || []).map((apt: any) => {
      // Parse the requested date
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
      const localEnd = localStart.plus({ hours: 1 }); // 1 hour duration
      
      // Convert to UTC ISO strings for the API response
      const startsAt = localStart.toUTC().toISO();
      const endsAt = localEnd.toUTC().toISO();
      
      // Skip if DateTime conversion failed
      if (!startsAt || !endsAt) {
        console.error(`Failed to convert date/time for appointment ${apt.id}`, {
          requested_date: apt.requested_date,
          requested_window: apt.requested_window,
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
        starts_at: startsAt,
        ends_at: endsAt,
        status: apt.status,
        family_name: familyName,
        location: location || "N/A",
      };
    });

    // Filter out any null entries from failed date conversions
    const validAppointments = mappedAppointments.filter((apt): apt is NonNullable<typeof apt> => apt !== null);
    
    return NextResponse.json(validAppointments);
  } catch (error: any) {
    console.error("Error in GET /api/appointments/mine:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

