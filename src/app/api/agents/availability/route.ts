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
    // We'll reconstruct exact times from requested_window + created_at timestamp
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("requested_date, requested_window, status, created_at")
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

    // Helper to calculate the exact booked hour from appointment
    // Since we only have requested_window, we need to be smart about matching
    // Strategy: For each appointment, calculate all possible slots in its window
    // Then check if the slot we're generating matches any of those possible slots
    // This ensures we block the right slot even without storing exact time
    const getAppointmentPossibleHours = (apt: any): number[] => {
      const dateStr = apt.requested_date;
      if (!dateStr) return [];

      // Determine the time window based on requested_window
      let windowStartHour = 9; // Default to morning (9 AM)
      let windowEndHour = 12; // Morning ends at 12 PM
      
      if (apt.requested_window === "afternoon") {
        windowStartHour = 13; // 1 PM
        windowEndHour = 17; // Afternoon ends at 5 PM
      } else if (apt.requested_window === "evening") {
        windowStartHour = 17; // 5 PM
        windowEndHour = 21; // Evening ends at 9 PM
      }

      // Generate all possible hours in this window based on appointment length
      const possibleHours: number[] = [];
      const slotLengthHours = appointmentLength / 60;
      
      for (let hour = windowStartHour; hour < windowEndHour; hour += slotLengthHours) {
        possibleHours.push(Math.floor(hour));
      }

      return possibleHours;
    };

    // Helper to check if a time slot conflicts with an appointment
    // Strategy: For appointments in the same window, we need to block slots intelligently
    // If there's only one appointment in a window, we can't know which exact slot, so we block all
    // But we try to use created_at for recent bookings to infer the exact hour
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string, slotHour: number): boolean => {
      if (!appointments || appointments.length === 0) return false;
      
      // Get the slot's hour in agent's timezone for matching
      const slotStartInAgentTZ = DateTime.fromJSDate(slotStart, { zone: "utc" })
        .setZone(agentTimezone);
      const slotHourInAgentTZ = slotStartInAgentTZ.hour;
      
      // Get all appointments for this date
      const dateAppointments = appointments.filter((apt: any) => apt.requested_date === dateStr);
      if (dateAppointments.length === 0) return false;
      
      // Group appointments by window to see if we can determine exact slots
      const appointmentsByWindow: Record<string, any[]> = {};
      dateAppointments.forEach((apt: any) => {
        const window = apt.requested_window;
        if (!appointmentsByWindow[window]) {
          appointmentsByWindow[window] = [];
        }
        appointmentsByWindow[window].push(apt);
      });
      
      // Check each appointment window
      for (const [window, windowAppointments] of Object.entries(appointmentsByWindow)) {
        // Get possible hours for this window
        const windowStartHour = window === "afternoon" ? 13 : window === "evening" ? 17 : 9;
        const windowEndHour = window === "afternoon" ? 17 : window === "evening" ? 21 : 12;
        
        // Check if slot hour is in this window
        if (slotHourInAgentTZ >= windowStartHour && slotHourInAgentTZ < windowEndHour) {
          // For recent appointments (created within last 5 minutes), use created_at to infer exact hour
          const recentAppointments = windowAppointments.filter((apt: any) => {
            if (!apt.created_at) return false;
            const createdDate = new Date(apt.created_at);
            const now = new Date();
            const minutesSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60);
            return minutesSinceCreation <= 5; // Very recent (within 5 minutes)
          });
          
          if (recentAppointments.length > 0) {
            // Check if any recent appointment's created_at hour matches this slot
            const hourMatches = recentAppointments.some((apt: any) => {
              const createdDate = new Date(apt.created_at);
              const createdInAgentTZ = DateTime.fromJSDate(createdDate, { zone: "utc" })
                .setZone(agentTimezone);
              // The created_at hour should be close to the booking hour for very recent bookings
              // But we need to account for the fact that created_at is when the DB record was created
              // which might be slightly after the actual booking time
              const createdHour = createdInAgentTZ.hour;
              // Allow 1 hour tolerance (booking might have happened just before hour change)
              return Math.abs(createdHour - slotHourInAgentTZ) <= 1;
            });
            
            if (hourMatches) {
              // Verify time overlap
              const slotStartTime = slotStart.getTime();
              const slotEndTime = slotEnd.getTime();
              const aptDateStr = dateStr;
              const aptLocalStart = DateTime.fromISO(`${aptDateStr}T${String(slotHourInAgentTZ).padStart(2, '0')}:00:00`, { zone: agentTimezone });
              const aptLocalEnd = aptLocalStart.plus({ hours: appointmentLength / 60 });
              
              if (aptLocalStart.isValid && aptLocalEnd.isValid) {
                const aptStartISO = aptLocalStart.toUTC().toISO();
                const aptEndISO = aptLocalEnd.toUTC().toISO();
                if (aptStartISO && aptEndISO) {
                  const aptStartTime = new Date(aptStartISO).getTime();
                  const aptEndTime = new Date(aptEndISO).getTime();
                  return slotStartTime < aptEndTime && slotEndTime > aptStartTime;
                }
              }
            }
          }
          
          // For older appointments or if no recent match, be conservative:
          // If there's only one appointment in this window, block all slots in the window
          // This prevents double-booking but is less precise
          if (windowAppointments.length === 1) {
            // Block this slot since we can't determine which exact one was booked
            // This is conservative but necessary without exact time storage
            const slotStartTime = slotStart.getTime();
            const slotEndTime = slotEnd.getTime();
            const aptDateStr = dateStr;
            const aptLocalStart = DateTime.fromISO(`${aptDateStr}T${String(slotHourInAgentTZ).padStart(2, '0')}:00:00`, { zone: agentTimezone });
            const aptLocalEnd = aptLocalStart.plus({ hours: appointmentLength / 60 });
            
            if (aptLocalStart.isValid && aptLocalEnd.isValid) {
              const aptStartISO = aptLocalStart.toUTC().toISO();
              const aptEndISO = aptLocalEnd.toUTC().toISO();
              if (aptStartISO && aptEndISO) {
                const aptStartTime = new Date(aptStartISO).getTime();
                const aptEndTime = new Date(aptEndISO).getTime();
                return slotStartTime < aptEndTime && slotEndTime > aptStartTime;
              }
            }
          } else if (windowAppointments.length > 1) {
            // Multiple appointments in same window - block all slots to be safe
            // This is the most conservative approach
            return true;
          }
        }
      }
      
      return false;
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
