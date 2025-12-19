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
      .select("requested_date, requested_window, status, created_at, confirmed_at")
      .eq("agent_id", agentId)
      .in("status", ["pending", "confirmed", "booked"])
      .gte("requested_date", startDate)
      .lte("requested_date", endDate)
      .order("created_at", { ascending: false }); // Most recent first

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
    // Uses confirmed_at (exact booking time) for precise matching
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string, slotHour: number): boolean => {
      if (!appointments || appointments.length === 0) return false;
      
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();
      
      // Check if this slot conflicts with any appointment on this date
      return appointments.some((apt: any) => {
        if (apt.requested_date !== dateStr) return false;
        
        // If we have confirmed_at, it stores the exact booking time (startsAt from booking)
        // This is the most precise way to match - direct timestamp comparison
        if (apt.confirmed_at) {
          const aptStartTime = new Date(apt.confirmed_at).getTime();
          const aptEndTime = aptStartTime + (appointmentLength * 60 * 1000); // appointmentLength is in minutes
          
          // Check for time overlap: slotStart < aptEnd && slotEnd > aptStart
          const hasOverlap = slotStartTime < aptEndTime && slotEndTime > aptStartTime;
          
          if (hasOverlap) {
            console.log("Conflict detected (confirmed_at):", {
              dateStr,
              slotStart: slotStart.toISOString(),
              slotEnd: slotEnd.toISOString(),
              aptConfirmedAt: apt.confirmed_at,
              aptStartTime: new Date(aptStartTime).toISOString(),
              aptEndTime: new Date(aptEndTime).toISOString(),
              appointmentId: apt.id,
            });
            return true; // Exact match - this slot is booked
          }
        } else {
          // Fallback for older appointments without confirmed_at
          // For very recent appointments (within last 10 minutes), use created_at as proxy
          // Otherwise, block all slots in the window (conservative but safe)
          const slotStartInAgentTZ = DateTime.fromJSDate(slotStart, { zone: "utc" })
            .setZone(agentTimezone);
          const slotHourInAgentTZ = slotStartInAgentTZ.hour;
          
          const windowStartHour = apt.requested_window === "afternoon" ? 13 : 
                                 apt.requested_window === "evening" ? 17 : 9;
          const windowEndHour = apt.requested_window === "afternoon" ? 17 :
                              apt.requested_window === "evening" ? 21 : 12;
          
          // Check if slot hour falls within the appointment's window
          if (slotHourInAgentTZ >= windowStartHour && slotHourInAgentTZ < windowEndHour) {
            // For very recent appointments, try to use created_at to infer exact time
            if (apt.created_at) {
              const createdDate = new Date(apt.created_at);
              const now = new Date();
              const minutesSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60);
              
              // If created within last 10 minutes, use created_at hour as proxy
              if (minutesSinceCreation <= 10) {
                const createdInAgentTZ = DateTime.fromJSDate(createdDate, { zone: "utc" })
                  .setZone(agentTimezone);
                const createdHour = createdInAgentTZ.hour;
                
                // If the slot hour matches the created hour (within 1 hour tolerance), block it
                if (Math.abs(createdHour - slotHourInAgentTZ) <= 1) {
                  console.log("Conflict detected (created_at fallback):", {
                    dateStr,
                    slotHour: slotHourInAgentTZ,
                    createdHour,
                    minutesSinceCreation,
                    appointmentId: apt.id,
                  });
                  return true;
                }
              }
            }
            
            // For older appointments or if created_at doesn't match, block all slots in window
            // This is conservative but prevents double-booking
            console.log("Conflict detected (window fallback):", {
              dateStr,
              slotHour: slotHourInAgentTZ,
              window: apt.requested_window,
              windowStartHour,
              windowEndHour,
              appointmentId: apt.id,
            });
            return true;
          }
        }
        
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

        // Check for conflicts with existing appointments - pass the exact hour for precise matching
        if (!hasConflict(slotStart, slotEnd, dateStr, slotHour)) {
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
