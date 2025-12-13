// src/app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  specialistId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type AvailabilityDay = {
  date: string; // YYYY-MM-DD in specialist's timezone
  slots: { startsAt: string; endsAt: string }[]; // ISO timestamps in UTC
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      specialistId: searchParams.get("specialistId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    };

    // Validate query params
    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { specialistId, startDate, endDate } = validation.data;

    // Load specialist with timezone
    const { data: specialist, error: specialistError } = await supabaseServer
      .from("specialists")
      .select("id, timezone, is_active")
      .eq("id", specialistId)
      .single();

    if (specialistError || !specialist) {
      return NextResponse.json(
        { error: "Specialist not found" },
        { status: 404 }
      );
    }

    if (!specialist.is_active) {
      return NextResponse.json(
        { error: "Specialist is not active" },
        { status: 400 }
      );
    }

    const timezone = specialist.timezone || "America/Edmonton";

    // Load specialist availability
    const { data: availability, error: availabilityError } = await supabaseServer
      .from("specialist_availability")
      .select("*")
      .eq("specialist_id", specialistId);

    if (availabilityError) {
      console.error("Error loading availability:", availabilityError);
      return NextResponse.json(
        { error: "Failed to load availability" },
        { status: 500 }
      );
    }

    // Load time off ranges
    const { data: timeOff, error: timeOffError } = await supabaseServer
      .from("specialist_time_off")
      .select("start_at, end_at")
      .eq("specialist_id", specialistId)
      .gte("end_at", new Date(startDate).toISOString())
      .lte("start_at", new Date(endDate + "T23:59:59").toISOString());

    if (timeOffError) {
      console.error("Error loading time off:", timeOffError);
    }

    // Load existing appointments (not cancelled)
    const { data: appointments, error: appointmentsError } = await supabaseServer
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("specialist_id", specialistId)
      .neq("status", "cancelled")
      .gte("ends_at", new Date(startDate).toISOString())
      .lte("starts_at", new Date(endDate + "T23:59:59").toISOString());

    if (appointmentsError) {
      console.error("Error loading appointments:", appointmentsError);
    }

    // Load external events (not cancelled) for busy-time blocking
    // This includes both Soradin-created events and external busy blocks
    const { data: externalEvents, error: eventsError } = await supabaseServer
      .from("external_events")
      .select("starts_at, ends_at, status, is_all_day")
      .eq("specialist_id", specialistId)
      .neq("status", "cancelled")
      .gte("ends_at", new Date(startDate).toISOString())
      .lte("starts_at", new Date(endDate + "T23:59:59").toISOString());

    if (eventsError) {
      console.error("Error loading external events:", eventsError);
    }

    // Helper to check if two time ranges overlap
    const overlaps = (
      start1: Date,
      end1: Date,
      start2: Date,
      end2: Date
    ): boolean => {
      return start1 < end2 && start2 < end1;
    };

    // Helper to convert local time to UTC
    // This creates a date in the specialist's timezone and converts to UTC
    const localToUTC = (dateStr: string, timeStr: string, tz: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes, seconds = 0] = timeStr.split(":").map(Number);

      // Create a date string in ISO format (local time, no timezone)
      const localISO = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Use a trick: create a date in UTC that represents the same "wall clock time"
      // Then calculate the offset between UTC and the target timezone at that moment
      // Create a temporary UTC date
      const tempUTC = new Date(`${localISO}Z`);
      
      // Get what this UTC time represents in the target timezone
      const tzFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      
      // Format the UTC time as if it were in the target timezone
      const tzParts = tzFormatter.formatToParts(tempUTC);
      const tzYear = parseInt(tzParts.find(p => p.type === "year")!.value);
      const tzMonth = parseInt(tzParts.find(p => p.type === "month")!.value);
      const tzDay = parseInt(tzParts.find(p => p.type === "day")!.value);
      const tzHour = parseInt(tzParts.find(p => p.type === "hour")!.value);
      const tzMinute = parseInt(tzParts.find(p => p.type === "minute")!.value);
      
      // Create a UTC date from the timezone-formatted parts
      const tzAsUTC = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute));
      
      // Calculate offset: difference between what UTC thinks and what timezone thinks
      const offset = tempUTC.getTime() - tzAsUTC.getTime();
      
      // Now create the actual local time we want as UTC, then subtract the offset
      const desiredLocalAsUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
      return new Date(desiredLocalAsUTC.getTime() - offset);
    };

    // Generate availability days
    const days: AvailabilityDay[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Find availability for this weekday
      const dayAvailability = availability?.find((a) => a.weekday === weekday);

      if (!dayAvailability) {
        days.push({ date: dateStr, slots: [] });
        continue;
      }

      // Generate time slots for this day
      const slots: { startsAt: string; endsAt: string }[] = [];
      const interval = dayAvailability.slot_interval_minutes || 30;

      // Parse start and end times
      const [startHour, startMin] = dayAvailability.start_time
        .split(":")
        .map(Number);
      const [endHour, endMin] = dayAvailability.end_time.split(":").map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin < endMin)
      ) {
        const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}:00`;
        const slotStart = localToUTC(dateStr, timeStr, timezone);

        // Add interval minutes
        const slotEnd = new Date(
          slotStart.getTime() + interval * 60 * 1000
        );

        // Check for conflicts
        let hasConflict = false;

        // Check time off
        if (timeOff) {
          for (const to of timeOff) {
            if (
              overlaps(
                slotStart,
                slotEnd,
                new Date(to.start_at),
                new Date(to.end_at)
              )
            ) {
              hasConflict = true;
              break;
            }
          }
        }

        // Check appointments
        if (!hasConflict && appointments) {
          for (const apt of appointments) {
            if (
              overlaps(
                slotStart,
                slotEnd,
                new Date(apt.starts_at),
                new Date(apt.ends_at)
              )
            ) {
              hasConflict = true;
              break;
            }
          }
        }

        // Check external events (busy-time blocking)
        // This prevents double-booking when specialist has events in their external calendar
        if (!hasConflict && externalEvents) {
          for (const event of externalEvents) {
            // For all-day events, block the entire day
            if (event.is_all_day) {
              const eventDate = new Date(event.starts_at).toISOString().split("T")[0];
              if (dateStr === eventDate) {
                hasConflict = true;
                break;
              }
            } else {
              // For timed events, check for overlap
              if (
                overlaps(
                  slotStart,
                  slotEnd,
                  new Date(event.starts_at),
                  new Date(event.ends_at)
                )
              ) {
                hasConflict = true;
                break;
              }
            }
          }
        }

        if (!hasConflict) {
          slots.push({
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
          });
        }

        // Move to next slot
        currentMin += interval;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }

      days.push({ date: dateStr, slots });
    }

    return NextResponse.json(days);
  } catch (error: any) {
    console.error("Error in /api/availability:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

