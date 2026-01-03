// src/app/api/appointments/[appointmentId]/reschedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";
import { deleteExternalEventsForAgentAppointment, syncAgentAppointmentToGoogleCalendar, syncAgentAppointmentToMicrosoftCalendar } from "@/lib/calendarSyncAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rescheduleAppointmentSchema = z.object({
  startsAt: z.string(), // ISO timestamp in UTC
  endsAt: z.string().optional(), // ISO timestamp in UTC
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await context.params;
    const body = await req.json();
    const validation = rescheduleAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { startsAt, endsAt } = validation.data;

    // Validate appointment exists and is not cancelled
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, lead_id, status, requested_date")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot reschedule a cancelled appointment" },
        { status: 400 }
      );
    }

    // Parse the new time
    const newStartTime = new Date(startsAt);
    if (isNaN(newStartTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid startsAt timestamp" },
        { status: 400 }
      );
    }

    // Get agent's timezone to determine requested_window
    const { data: agentProfile } = await supabaseAdmin
      .from("profiles")
      .select("agent_province, metadata")
      .eq("id", appointment.agent_id)
      .maybeSingle();

    let agentTimezone = "America/Vancouver"; // Default
    if (agentProfile?.metadata?.timezone) {
      agentTimezone = agentProfile.metadata.timezone;
    } else if (agentProfile?.agent_province) {
      const province = agentProfile.agent_province.toUpperCase();
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

    // Convert to agent's timezone to determine window
    const slotStartUTC = DateTime.fromISO(startsAt, { zone: "utc" });
    const slotStartLocal = slotStartUTC.setZone(agentTimezone);
    const hour = slotStartLocal.hour;

    let requestedWindow: "morning" | "afternoon" | "evening";
    if (hour < 12) {
      requestedWindow = "morning";
    } else if (hour < 17) {
      requestedWindow = "afternoon";
    } else {
      requestedWindow = "evening";
    }

    // Get the date string for requested_date
    const requestedDate = slotStartLocal.toFormat("yyyy-MM-dd");

    // Update appointment with new time
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        confirmed_at: startsAt, // Store the exact UTC time
        requested_date: requestedDate,
        requested_window: requestedWindow,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError || !updatedAppointment) {
      console.error("Error rescheduling appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to reschedule appointment" },
        { status: 500 }
      );
    }

    // Sync to external calendars (non-blocking)
    // Delete old events and create new ones with updated time
    try {
      // First, delete the old calendar events
      await deleteExternalEventsForAgentAppointment(appointmentId);
      
      // Then, create new events with the updated time
      // Sync to Google Calendar
      try {
        await syncAgentAppointmentToGoogleCalendar(appointmentId);
      } catch (googleError: any) {
        console.error("Error syncing to Google Calendar (non-fatal):", googleError);
      }
      
      // Sync to Microsoft Calendar
      try {
        await syncAgentAppointmentToMicrosoftCalendar(appointmentId);
      } catch (microsoftError: any) {
        console.error("Error syncing to Microsoft Calendar (non-fatal):", microsoftError);
      }
    } catch (syncError: any) {
      console.error("Error syncing appointment to calendars (non-fatal):", syncError);
      // Don't fail the reschedule if calendar sync fails
    }

    return NextResponse.json({
      appointment: updatedAppointment,
      message: "Appointment rescheduled successfully",
    });
  } catch (error: any) {
    console.error("Error in /api/appointments/[appointmentId]/reschedule:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

