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
  location: z.string().optional(), // Optional location to filter schedule
});

type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  slots: { startsAt: string; endsAt: string }[]; // ISO timestamps in UTC
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationParam = searchParams.get("location");
    const params = {
      agentId: searchParams.get("agentId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      location: locationParam || undefined, // Convert null to undefined for zod optional
    };

    // Validate query params
    const validation = querySchema.safeParse(params);
    if (!validation.success) {
      console.error("Validation error:", validation.error.issues);
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { agentId, startDate, endDate, location } = validation.data;

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
    
    // Log the raw metadata to see what's actually stored
    console.log("Raw profile metadata.availability:", JSON.stringify(availabilityData, null, 2));

    if (locations.length === 0) {
      // No availability set up
      return NextResponse.json([]);
    }

    // Normalize location by removing province suffix (e.g., "Kelowna, BC" -> "Kelowna")
    const normalizeLocation = (loc: string | undefined): string | undefined => {
      if (!loc) return undefined;
      // Remove common province suffixes like ", BC", ", AB", etc.
      return loc.split(',').map(s => s.trim())[0];
    };
    
    // Use the specified location, or fall back to first location, or agent's default city
    let selectedLocation = normalizeLocation(location);
    if (!selectedLocation && locations.length > 0) {
      selectedLocation = locations[0];
    }
    if (!selectedLocation && profile.agent_city) {
      selectedLocation = normalizeLocation(profile.agent_city);
    }
    if (!selectedLocation && locations.length > 0) {
      selectedLocation = locations[0];
    }
    
    // Get the schedule for the selected location
    let locationSchedule: Record<string, any> = {};
    
    if (selectedLocation) {
      // Try exact match first
      if (availabilityByLocation[selectedLocation]) {
        locationSchedule = availabilityByLocation[selectedLocation];
      } else {
        // Try case-insensitive match
        const matchingLocation = Object.keys(availabilityByLocation).find(
          loc => loc.toLowerCase() === selectedLocation!.toLowerCase()
        );
        if (matchingLocation) {
          locationSchedule = availabilityByLocation[matchingLocation];
        }
      }
    }
    
    // Final fallback: use first available location's schedule
    if (Object.keys(locationSchedule).length === 0 && locations.length > 0) {
      locationSchedule = availabilityByLocation[locations[0]] || {};
    }
    
    // Debug logging - comprehensive
    console.log("Availability API Debug:", {
      agentId,
      requestedLocation: location,
      selectedLocation,
      allLocations: locations,
      availabilityByLocationKeys: Object.keys(availabilityByLocation),
      locationScheduleKeys: Object.keys(locationSchedule),
      fullLocationSchedule: locationSchedule,
      appointmentLength,
      metadataAvailability: availabilityData,
    });

    // Load existing appointments for this agent
    // Include confirmed_at to get exact booking time for precise conflict detection
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("id, requested_date, requested_window, status, created_at, confirmed_at")
      .eq("agent_id", agentId)
      .in("status", ["pending", "confirmed", "booked"])
      .gte("requested_date", startDate)
      .lte("requested_date", endDate)
      .order("created_at", { ascending: false }); // Most recent first

    // Debug: Log appointments to see what we're working with
    console.log("📋 Loaded appointments for conflict detection:", {
      agentId,
      startDate,
      endDate,
      count: appointments?.length || 0,
      appointments: appointments?.map((apt: any) => ({
        id: apt.id,
        date: apt.requested_date,
        window: apt.requested_window,
        status: apt.status,
        hasConfirmedAt: !!apt.confirmed_at,
        confirmedAt: apt.confirmed_at,
        confirmedAtISO: apt.confirmed_at ? new Date(apt.confirmed_at).toISOString() : null,
        createdAt: apt.created_at,
      })),
    });

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

    // Helper to check if a time slot conflicts with an appointment
    // SIMPLE LOGIC: Only block if we have confirmed_at and it matches the slot time
    // Compare ISO strings directly for exact matching
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string, slotHour: number): boolean => {
      if (!appointments || appointments.length === 0) return false;
      
      const slotStartISO = slotStart.toISOString();
      const slotStartTime = slotStart.getTime();
      
      // Check if this slot conflicts with any appointment
      // CRITICAL: Only check appointments that have confirmed_at and match the exact slot time
      // We do NOT check by date first - we check by exact time match only
      return appointments.some((apt: any) => {
        // ONLY block if we have confirmed_at - this is the exact booking time
        if (!apt.confirmed_at) {
          // No confirmed_at means we can't be precise - don't block
          return false;
        }
        
        // Convert confirmed_at to Date and get ISO string
        const aptConfirmedDate = new Date(apt.confirmed_at);
        const aptConfirmedISO = aptConfirmedDate.toISOString();
        
        // Compare ISO strings directly (most reliable - exact match)
        const isoMatch = slotStartISO === aptConfirmedISO;
        
        // Also compare timestamps with tolerance (1 minute) as backup
        const aptStartTime = aptConfirmedDate.getTime();
        const tolerance = 60 * 1000; // 1 minute in milliseconds
        const timeDifference = Math.abs(slotStartTime - aptStartTime);
        const timeMatch = timeDifference <= tolerance;
        
        // Only log if there's a potential match (to reduce log noise)
        if (isoMatch || timeMatch) {
          // Verify the date also matches (safety check)
          const aptDateStr = aptConfirmedDate.toISOString().split("T")[0];
          if (aptDateStr !== dateStr) {
            // Date doesn't match - this shouldn't happen but log it
            console.log("⚠️ Time matches but date doesn't:", {
              slotDate: dateStr,
              aptDate: aptDateStr,
              slotStartISO,
              aptConfirmedISO,
            });
            return false; // Don't block if dates don't match
          }
          
          console.log("✅✅✅ CONFLICT FOUND - BLOCKING EXACT SLOT:", {
            dateStr,
            slotStartISO,
            aptConfirmedISO,
            isoMatch,
            timeDifferenceMs: timeDifference,
            appointmentId: apt.id,
            appointmentStatus: apt.status,
          });
          return true; // This exact slot is booked - block ONLY this slot
        }
        
        // No match - this slot is available
        return false;
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

      // Get schedule for this day - try both lowercase and capitalized versions
      let daySchedule = locationSchedule[dayName];
      if (!daySchedule) {
        // Try capitalized version (e.g., "Friday" instead of "friday")
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        daySchedule = locationSchedule[capitalizedDay];
      }
      
      if (!daySchedule || !daySchedule.enabled) {
        console.log(`No schedule for ${dayName} (${dateStr}):`, daySchedule);
        days.push({ date: dateStr, slots: [] });
        continue;
      }

      // Generate time slots for this day based on agent's exact schedule
      const slots: { startsAt: string; endsAt: string }[] = [];
      
      // Parse start and end times (format: "HH:MM" or "HH:mm")
      const startTime = daySchedule.start || "09:00";
      const endTime = daySchedule.end || "17:00";
      
      console.log(`Generating slots for ${dayName} (${dateStr}): ${startTime} - ${endTime}`);
      
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      
      // Validate parsed times
      if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
        console.error(`Invalid time format for ${dayName}: start=${startTime}, end=${endTime}, daySchedule=`, daySchedule);
        days.push({ date: dateStr, slots: [] });
        continue;
      }

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
        
        // Get the hour in agent's timezone for conflict checking
        const slotHour = localStart.hour;

        // Check for conflicts with existing appointments - this MUST block booked slots immediately
        const slotStartsAtISO = slotStart.toISOString();
        const hasConflictResult = hasConflict(slotStart, slotEnd, dateStr, slotHour);
        
        if (!hasConflictResult) {
          slots.push({
            startsAt: slotStartsAtISO,
            endsAt: slotEnd.toISOString(),
          });
        } else {
          // Log when a slot is blocked so we can verify it's working
          console.log(`🚫 BLOCKED SLOT - Not adding to available slots:`, {
            slotStartsAt: slotStartsAtISO,
            date: dateStr,
            slotHour,
          });
        }

        // Move to next slot (use appointment length as interval)
        currentTimeMinutes += appointmentLength;
      }

      // CRITICAL: Always add the day, even if all slots are blocked
      // This ensures the day still appears in the calendar, just with fewer available slots
      days.push({ date: dateStr, slots });
      
      // Log summary for this day
      if (slots.length > 0) {
        console.log(`✅ Generated ${slots.length} slots for ${dayName} (${dateStr})`);
      } else if (daySchedule && daySchedule.enabled) {
        // Only warn if the day was enabled but has no slots (might indicate all slots are booked)
        console.log(`⚠️ Day enabled but no available slots for ${dayName} (${dateStr}) - all slots may be booked or schedule issue`);
      } else {
        console.log(`ℹ️ No slots for ${dayName} (${dateStr}) - day not enabled`);
      }
    }

    // Log final summary
    const totalSlots = days.reduce((sum, day) => sum + day.slots.length, 0);
    const daysWithSlots = days.filter(day => day.slots.length > 0).length;
    console.log(`📊 Availability API Summary: ${days.length} days processed, ${daysWithSlots} days with slots, ${totalSlots} total slots`);

    return NextResponse.json(days);
  } catch (error: any) {
    console.error("Error in /api/agents/availability:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
