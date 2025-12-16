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

    // Load existing appointments for this agent
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("requested_date, requested_window, status")
      .eq("agent_id", agentId)
      .neq("status", "cancelled")
      .gte("requested_date", startDate)
      .lte("requested_date", endDate);

    if (appointmentsError) {
      console.error("Error loading appointments:", appointmentsError);
    }

    // Helper to convert time string (HH:MM) to Date for a given date
    const timeToDate = (dateStr: string, timeStr: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    };

    // Helper to check if a time slot conflicts with an appointment
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string): boolean => {
      if (!appointments) return false;
      
      return appointments.some((apt: any) => {
        if (apt.requested_date !== dateStr) return false;
        if (apt.status === "cancelled") return false;
        
        // For now, if there's any appointment on this date, block the slot
        // Could be enhanced to check specific time windows
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

      // Generate time slots for this day
      const slots: { startsAt: string; endsAt: string }[] = [];
      const [startHour, startMin] = daySchedule.start.split(":").map(Number);
      const [endHour, endMin] = daySchedule.end.split(":").map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin < endMin)
      ) {
        const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
        const slotStart = timeToDate(dateStr, timeStr);
        const slotEnd = new Date(slotStart.getTime() + appointmentLength * 60 * 1000);

        // Check if slot extends beyond end time
        const slotEndHour = slotEnd.getUTCHours();
        const slotEndMin = slotEnd.getUTCMinutes();
        if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMin > endMin)) {
          break; // Stop if slot would extend beyond available hours
        }

        // Check for conflicts
        if (!hasConflict(slotStart, slotEnd, dateStr)) {
          slots.push({
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
          });
        }

        // Move to next slot (use appointment length as interval)
        currentMin += appointmentLength;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
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
