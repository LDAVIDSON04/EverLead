// API to get agent availability slots for public booking
// This converts agent availability settings into bookable time slots

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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

    // Helper to convert time string (HH:MM) in agent's local timezone to UTC Date
    // We'll assume the agent's timezone is their system timezone or use a default
    // For now, we'll treat the times as if they're in the agent's local timezone
    const timeToDate = (dateStr: string, timeStr: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      
      // Create date in local timezone (agent's timezone)
      // Then convert to UTC for storage
      const localDate = new Date(year, month - 1, day, hours, minutes);
      
      // For API responses, we want UTC ISO strings
      // The time provided is in the agent's local timezone, so we need to account for that
      // For simplicity, we'll create a UTC date that represents the same "wall clock time"
      // This assumes the agent's schedule times are in their local timezone
      return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    };

    // Helper to check if a time slot conflicts with an appointment
    // Since appointments table doesn't store exact start/end times, we'll block
    // any slot if there's an appointment on that date to prevent double-booking
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string): boolean => {
      if (!appointments || appointments.length === 0) return false;
      
      // Check if there's any appointment on this date
      // This is conservative but ensures no double-booking
      // In the future, if we store exact start/end times in appointments,
      // we can check for actual time overlaps
      return appointments.some((apt: any) => {
        if (apt.requested_date !== dateStr) return false;
        // Any active appointment on this date blocks the slot
        return true;
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
        
        // Create slot start and end times
        const slotStart = timeToDate(dateStr, timeStr);
        const slotEnd = new Date(slotStart.getTime() + appointmentLength * 60 * 1000);

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
