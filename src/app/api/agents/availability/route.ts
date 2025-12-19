// API to get agent availability slots for public booking
// This converts agent availability settings into bookable time slots

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  agentId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  slots: { startsAt: string; endsAt: string }[]; // ISO timestamps in UTC
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      agentId: searchParams.get("agentId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    // Validate query params
    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { agentId, startDate, endDate } = validation.data;

    // Load agent profile with availability settings
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, metadata, agent_city, agent_province")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const metadata = profile.metadata || {};
    const availabilityData = metadata.availability || {};
    const locations = availabilityData.locations || [];
    const availabilityByLocation = availabilityData.availabilityByLocation || {};
    const appointmentLength = parseInt(availabilityData.appointmentLength || "30", 10);

    if (locations.length === 0) {
      // No availability set up
      return NextResponse.json([]);
    }

    // For now, use the first location's schedule (could be enhanced to filter by location)
    const firstLocation = locations[0];
    const locationSchedule = availabilityByLocation[firstLocation] || {};

    // Load existing appointments for this agent (get actual times if available)
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("requested_date, requested_window, status, created_at")
      .eq("agent_id", agentId)
      .in("status", ["pending", "confirmed", "booked"])
      .gte("requested_date", startDate)
      .lte("requested_date", endDate);

    if (appointmentsError) {
      console.error("Error loading appointments:", appointmentsError);
    }

    // Note: timeToDate helper removed - now using DateTime from luxon directly in slot generation

    // Get agent's timezone for converting appointment times
    let agentTimezone = "America/Vancouver"; // Default fallback
    if (metadata.timezone) {
      agentTimezone = metadata.timezone;
    } else if (availabilityData.timezone) {
      agentTimezone = availabilityData.timezone;
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

    // Helper to convert appointment requested_date + requested_window to actual start/end times
    const getAppointmentTimes = (apt: any): { start: Date; end: Date } | null => {
      const dateStr = apt.requested_date;
      if (!dateStr) return null;

      // Convert requested_window to start hour (same logic as booking API)
      let startHour = 9; // Default to morning (9 AM)
      if (apt.requested_window === "afternoon") {
        startHour = 13; // 1 PM
      } else if (apt.requested_window === "evening") {
        startHour = 17; // 5 PM
      }

      // Create DateTime in agent's timezone, then convert to UTC
      const localDateTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`;
      const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
      const localEnd = localStart.plus({ hours: 1 }); // 1 hour duration

      if (!localStart.isValid || !localEnd.isValid) {
        return null;
      }

      return {
        start: new Date(localStart.toUTC().toISO()),
        end: new Date(localEnd.toUTC().toISO()),
      };
    };

    // Helper to check if a time slot conflicts with an appointment
    // Now checks actual time overlaps instead of blocking entire days
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string): boolean => {
      if (!appointments || appointments.length === 0) return false;
      
      // Check if this slot overlaps with any appointment on this date
      return appointments.some((apt: any) => {
        if (apt.requested_date !== dateStr) return false;
        
        // Get the appointment's actual start/end times
        const aptTimes = getAppointmentTimes(apt);
        if (!aptTimes) return false;
        
        // Check for time overlap: slot overlaps if it starts before appointment ends
        // and ends after appointment starts
        const slotStartTime = slotStart.getTime();
        const slotEndTime = slotEnd.getTime();
        const aptStartTime = aptTimes.start.getTime();
        const aptEndTime = aptTimes.end.getTime();
        
        // Overlap occurs if: slotStart < aptEnd && slotEnd > aptStart
        return slotStartTime < aptEndTime && slotEndTime > aptStartTime;
      });
    };

    // Generate availability days
    const days: AvailabilityDay[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
      const dayName = dayNames[weekday];

      // Get schedule for this day
      const daySchedule = locationSchedule[dayName];
      
      if (!daySchedule || !daySchedule.enabled) {
        days.push({ date: dateStr, slots: [] });
        continue;
      }

      // Generate time slots for this day based on agent's exact schedule
      const slots: { startsAt: string; endsAt: string }[] = [];
      const [startHour, startMin] = daySchedule.start.split(":").map(Number);
      const [endHour, endMin] = daySchedule.end.split(":").map(Number);

      // Convert end time to minutes for easier comparison
      const endTimeMinutes = endHour * 60 + endMin;
      
      // Start from the beginning of the day's availability
      let currentTimeMinutes = startHour * 60 + startMin;

      while (currentTimeMinutes < endTimeMinutes) {
        // Calculate if this slot would extend beyond the end time
        const slotEndMinutes = currentTimeMinutes + appointmentLength;
        
        if (slotEndMinutes > endTimeMinutes) {
          // This slot would extend beyond available hours, stop
          break;
        }

        // Convert current time to hours and minutes
        const currentHour = Math.floor(currentTimeMinutes / 60);
        const currentMin = currentTimeMinutes % 60;
        const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
        
        // Create slot start and end times in agent's timezone, then convert to UTC
        const localDateTimeStr = `${dateStr}T${timeStr}:00`;
        const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
        const localEnd = localStart.plus({ minutes: appointmentLength });
        
        if (!localStart.isValid || !localEnd.isValid) {
          console.error(`Invalid slot time for ${dateStr} ${timeStr}`);
          continue;
        }
        
        // Convert to UTC for API response
        const slotStart = new Date(localStart.toUTC().toISO());
        const slotEnd = new Date(localEnd.toUTC().toISO());

        // Check for conflicts with existing appointments
        if (!hasConflict(slotStart, slotEnd, dateStr)) {
          slots.push({
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
          });
        }

        // Move to next slot (use appointment length as interval)
        currentTimeMinutes += appointmentLength;
      }

      days.push({ date: dateStr, slots });
    }

    return NextResponse.json(days);
  } catch (error: any) {
    console.error("Error in /api/agents/availability:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
