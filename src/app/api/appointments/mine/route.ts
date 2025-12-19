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
          email
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

    // Map appointments to format expected by schedule page
    // Convert requested_date + requested_window to starts_at/ends_at
    // Use agent's timezone (America/Vancouver or America/Edmonton) for local times
    const agentTimezone = "America/Vancouver"; // Default to Vancouver timezone
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
      
      // Get family name from lead
      const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
      const familyName = lead?.full_name || 
        (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : null) ||
        "Client";
      
      return {
        id: apt.id,
        starts_at: startsAt,
        ends_at: endsAt,
        status: apt.status,
        family_name: familyName,
      };
    });

    return NextResponse.json(mappedAppointments);
  } catch (error: any) {
    console.error("Error in GET /api/appointments/mine:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

