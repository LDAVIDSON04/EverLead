// src/app/api/appointments/[appointmentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    console.log("🔍 [APPOINTMENTS API] Fetching appointment:", appointmentId);

    if (!appointmentId) {
      console.error("❌ [APPOINTMENTS API] Missing appointment ID");
      return NextResponse.json(
        { error: "Missing appointment ID" },
        { status: 400 }
      );
    }

    // Try to fetch with starts_at/ends_at first, fallback if columns don't exist
    let appointment: any = null;
    let error: any = null;
    
    const result = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        agent_id,
        status,
        requested_date,
        requested_window,
        confirmed_at,
        starts_at,
        ends_at,
        lead_id,
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
      `)
      .eq("id", appointmentId)
      .maybeSingle();
    
    appointment = result.data;
    error = result.error;
    
    console.log("📋 [APPOINTMENTS API] Appointment fetch result:", { 
      found: !!appointment, 
      error: error?.message,
      appointmentId 
    });
    
    // If error is due to missing columns, retry without them
    if (error && error.code === '42703' && (error.message?.includes('starts_at') || error.message?.includes('ends_at'))) {
      const resultWithoutTimes = await supabaseAdmin
        .from("appointments")
        .select(`
          id,
          agent_id,
          status,
          requested_date,
          requested_window,
          confirmed_at,
          lead_id,
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
        `)
        .eq("id", appointmentId)
        .maybeSingle();
      
      appointment = resultWithoutTimes.data;
      error = resultWithoutTimes.error;
    }

    if (error) {
      console.error("Error fetching appointment:", error);
      return NextResponse.json(
        { error: "Error fetching appointment", details: error.message },
        { status: 500 }
      );
    }

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Fetch agent profile information
    let agentInfo = null;
    if (appointment.agent_id) {
      const { data: agentProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
        .eq("id", appointment.agent_id)
        .maybeSingle();

      if (agentProfile) {
        const metadata = agentProfile.metadata || {};
        agentInfo = {
          id: agentProfile.id,
          full_name: agentProfile.full_name,
          profile_picture_url: agentProfile.profile_picture_url,
          job_title: agentProfile.job_title,
          funeral_home: agentProfile.funeral_home,
          agent_city: agentProfile.agent_city,
          agent_province: agentProfile.agent_province,
          business_address: (metadata as any)?.business_address || null,
        };
      }
    }

    // Get agent's timezone for proper time conversion
    let agentTimezone = "America/Vancouver"; // Default
    if (agentInfo?.agent_province) {
      const province = agentInfo.agent_province.toUpperCase();
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

    // Format date and time using agent's timezone
    let formattedDate = '';
    let exactTime = null;
    let timeDisplay = 'Not specified';
    
    if (appointment.confirmed_at) {
      // Use confirmed_at (exact booking time) and convert to agent's timezone
      const confirmedAtUTC = DateTime.fromISO(appointment.confirmed_at, { zone: "utc" });
      const confirmedAtLocal = confirmedAtUTC.setZone(agentTimezone);
      
      // Format date with day of week in agent's timezone
      formattedDate = confirmedAtLocal.toLocaleString({ 
        weekday: "long", 
        year: "numeric",
        month: "long", 
        day: "numeric" 
      });
      
      // Format exact time in agent's timezone (e.g., "10:00 AM")
      const hours = confirmedAtLocal.hour;
      const minutes = confirmedAtLocal.minute;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      timeDisplay = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
      exactTime = appointment.confirmed_at;
    } else {
      // Fallback: use requested_date and requested_window
      const [year, month, day] = appointment.requested_date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (appointment.requested_window) {
        timeDisplay = appointment.requested_window.charAt(0).toUpperCase() + appointment.requested_window.slice(1);
      }
    }

    const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;

    // Calculate starts_at and ends_at from confirmed_at if not already set
    // For agent-created events, confirmed_at is the start time
    let calculatedStartsAt = appointment.starts_at || appointment.confirmed_at;
    let calculatedEndsAt = appointment.ends_at || null;
    
    if (calculatedStartsAt && !calculatedEndsAt) {
      // Try to get duration from lead's additional_notes
      let durationMinutes = 60; // Default 60 minutes
      if (lead?.additional_notes) {
        const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
        if (durationMatch) {
          durationMinutes = parseInt(durationMatch[1], 10);
        }
      }
      
      // Calculate end time using the stored duration
      const startDate = DateTime.fromISO(calculatedStartsAt, { zone: "utc" });
      const endDate = startDate.plus({ minutes: durationMinutes });
      calculatedEndsAt = endDate.toISO();
    }

    // Fetch office location directly using office_location_id if available
    let officeLocation = null;
    if (appointment.office_location_id) {
      // Use the stored office_location_id for direct lookup
      const { data: location } = await supabaseAdmin
        .from('office_locations')
        .select('id, name, city, street_address, province, postal_code')
        .eq('id', appointment.office_location_id)
        .maybeSingle();
      
      if (location) {
        officeLocation = location;
      }
    }
    
    // Fallback: if no office_location_id, try to match by lead's city (for backwards compatibility with old appointments)
    if (!officeLocation && lead?.city && appointment.agent_id) {
      const normalizeLocation = (loc: string | null | undefined): string => {
        if (!loc) return '';
        let normalized = loc.split(',').map(s => s.trim())[0];
        normalized = normalized.replace(/\s+office$/i, '').trim();
        return normalized.toLowerCase();
      };

      const { data: officeLocations } = await supabaseAdmin
        .from('office_locations')
        .select('id, name, city, street_address, province, postal_code')
        .eq('agent_id', appointment.agent_id)
        .order('city', { ascending: true });

      if (officeLocations && officeLocations.length > 0) {
        const normalizedLeadCity = normalizeLocation(lead.city);
        const matchingLocation = officeLocations.find((loc: any) => 
          normalizeLocation(loc.city) === normalizedLeadCity
        );
        if (matchingLocation) {
          officeLocation = matchingLocation;
        } else {
          // Fallback to first location if no match
          officeLocation = officeLocations[0];
        }
      }
    }

    return NextResponse.json({
      id: appointment.id,
      agent_id: appointment.agent_id,
      status: appointment.status,
      requested_date: appointment.requested_date,
      requested_window: appointment.requested_window,
      confirmed_at: appointment.confirmed_at,
      starts_at: calculatedStartsAt,
      ends_at: calculatedEndsAt,
      formatted_date: formattedDate,
      time_display: timeDisplay,
      exact_time: exactTime,
      agent: agentInfo,
      lead: lead,
      lead_id: appointment.lead_id,
      office_location: officeLocation,
    });
  } catch (error: any) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

