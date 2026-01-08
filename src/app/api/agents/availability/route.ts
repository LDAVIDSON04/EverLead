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

    // Log the incoming request immediately
    console.log("🚀 [AVAILABILITY API] Incoming request:", {
      agentId,
      startDate,
      endDate,
      location,
      locationParam: locationParam,
      url: req.url,
    });

    // Load agent profile with availability settings
    // Check approval_status (bios are auto-approved on creation)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, metadata, agent_city, agent_province, approval_status, ai_generated_bio")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Single unified approval - check only approval_status
    if (profile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent not approved" },
        { status: 403 }
      );
    }

    const metadata = profile.metadata || {};
    const availabilityData = metadata.availability || {};
    const locations = availabilityData.locations || [];
    const availabilityByLocation = availabilityData.availabilityByLocation || {};
    const availabilityTypeByLocation = availabilityData.availabilityTypeByLocation || {}; // "recurring" or "daily"
    const appointmentLength = parseInt(availabilityData.appointmentLength || "30", 10);
    
    // Log the raw metadata to see what's actually stored
    console.log("Raw profile metadata.availability:", JSON.stringify(availabilityData, null, 2));

    if (locations.length === 0) {
      // No availability set up
      return NextResponse.json([]);
    }

    // Helper to strip province/state suffix (e.g., "Vaughan, ON" -> "Vaughan")
    const stripProvinceSuffix = (loc: string): string => {
      // Remove common province/state suffixes like ", BC", ", AB", ", ON", etc.
      const trimmed = loc.trim();
      const commaIndex = trimmed.lastIndexOf(',');
      if (commaIndex > 0) {
        // Check if the part after comma looks like a province/state code (2-3 letters)
        const afterComma = trimmed.substring(commaIndex + 1).trim();
        if (afterComma.length >= 2 && afterComma.length <= 3 && /^[A-Z]{2,3}$/i.test(afterComma)) {
          return trimmed.substring(0, commaIndex).trim();
        }
      }
      return trimmed;
    };
    
    // Use the specified location, or fall back to first location, or agent's default city
    let selectedLocation = location ? stripProvinceSuffix(location) : undefined;
    if (!selectedLocation && locations.length > 0) {
      selectedLocation = stripProvinceSuffix(locations[0]);
    }
    if (!selectedLocation && profile.agent_city) {
      selectedLocation = stripProvinceSuffix(profile.agent_city);
    }
    if (!selectedLocation && locations.length > 0) {
      selectedLocation = stripProvinceSuffix(locations[0]);
    }
    
    // Ensure selectedLocation is trimmed
    if (selectedLocation) {
      selectedLocation = selectedLocation.trim();
    }
    
    console.log("🔍 Location selection:", {
      originalLocation: location,
      selectedLocation,
      availableLocations: locations,
    });
    
    // Determine which type is active for this location
    // CRITICAL: availabilityTypeByLocation keys are normalized (no "Office" suffix, no province)
    // So we must use normalized location name for lookup
    let locationType: "recurring" | "daily" = "recurring"; // Default to recurring
    if (selectedLocation && availabilityTypeByLocation[selectedLocation]) {
      locationType = availabilityTypeByLocation[selectedLocation] as "recurring" | "daily";
    } else if (selectedLocation) {
      // Try case-insensitive match for type
      const normalizedSelected = selectedLocation.toLowerCase().trim();
      const matchingLocationKey = Object.keys(availabilityTypeByLocation).find(
        loc => loc.toLowerCase().trim() === normalizedSelected
      );
      if (matchingLocationKey) {
        locationType = availabilityTypeByLocation[matchingLocationKey] as "recurring" | "daily";
      }
    }

    // Get the schedule for the selected location (for recurring mode)
    let locationSchedule: Record<string, any> = {};
    
    if (selectedLocation && locationType === "recurring") {
      // Try exact match first (case-sensitive)
      if (availabilityByLocation[selectedLocation]) {
        locationSchedule = availabilityByLocation[selectedLocation];
      } else {
        // Try case-insensitive match
        const normalizedSelected = selectedLocation.toLowerCase().trim();
        const matchingLocation = Object.keys(availabilityByLocation).find(
          loc => loc.toLowerCase().trim() === normalizedSelected
        );
        
        if (matchingLocation) {
          locationSchedule = availabilityByLocation[matchingLocation];
          selectedLocation = matchingLocation;
        }
      }
    }
    
    // Only use fallback if no location was specified in the request
    // If a location was specified but doesn't match, return empty schedule
    if (locationType === "recurring" && Object.keys(locationSchedule).length === 0) {
      if (!location) {
        // No location specified - use first available location as fallback
        if (locations.length > 0) {
          locationSchedule = availabilityByLocation[locations[0]] || {};
          selectedLocation = locations[0];
        }
      } else {
        // Location was specified but didn't match - log warning but don't use fallback
        console.warn("⚠️ Specified location not found in availability:", {
          requestedLocation: location,
          selectedLocation,
          availableLocations: locations,
          availabilityByLocationKeys: Object.keys(availabilityByLocation),
        });
        // Return empty schedule instead of falling back
        return NextResponse.json([]);
      }
    }
    
    // Debug logging - comprehensive
    console.log("🔍 [AVAILABILITY API] Location matching result:", {
      agentId,
      requestedLocation: location,
      selectedLocation,
      locationType,
      allLocations: locations,
      availabilityByLocationKeys: Object.keys(availabilityByLocation),
      locationScheduleKeys: Object.keys(locationSchedule),
      hasSchedule: Object.keys(locationSchedule).length > 0,
      appointmentLength,
      availabilityTypeByLocation: availabilityTypeByLocation,
      scheduleDayNames: locationSchedule ? Object.keys(locationSchedule) : [],
    });
    
    // CRITICAL: If location was specified but we didn't find a match, log and return empty
    if (location && locationType === "recurring" && Object.keys(locationSchedule).length === 0) {
      console.error("❌ [AVAILABILITY API] Location specified but no schedule found:", {
        requestedLocation: location,
        selectedLocation,
        allLocations: locations,
        availabilityByLocationKeys: Object.keys(availabilityByLocation),
      });
      return NextResponse.json([]);
    }
    
    // Validate that we have a valid schedule
    if (Object.keys(locationSchedule).length === 0) {
      console.warn("⚠️ No schedule found for location:", {
        selectedLocation,
        availableLocations: locations,
        availabilityByLocationKeys: Object.keys(availabilityByLocation),
      });
    }

    // Load existing appointments for this agent
    // Include confirmed_at to get exact booking time for precise conflict detection
    // IMPORTANT: Agent-created events are stored as appointments with status="confirmed" and confirmed_at set
    // They will automatically block availability slots via the conflict detection below
    // Also fetch leads to get duration for agent-created events
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id, 
        requested_date, 
        requested_window, 
        status, 
        created_at, 
        confirmed_at,
        lead_id,
        leads (
          id,
          additional_notes,
          email
        )
      `)
      .eq("agent_id", agentId)
      .in("status", ["pending", "confirmed", "booked"])
      .gte("requested_date", startDate)
      .lte("requested_date", endDate)
      .order("created_at", { ascending: false }); // Most recent first

    // Load external calendar events (from Google/Microsoft) that block time slots
    // These are events created by the front desk or other external sources
    // Note: external_events uses specialist_id which matches the agent's user ID
    // IMPORTANT: Query for events that overlap with the date range
    // An event overlaps if: starts_at <= endDate AND ends_at >= startDate
    // We'll fetch a wider range and filter in code to ensure we catch all overlapping events
    const rangeStart = `${startDate}T00:00:00Z`;
    const rangeEnd = `${endDate}T23:59:59Z`;
    
    // Fetch events that start before the range ends (could overlap)
    // IMPORTANT: Only select location if the column exists (graceful degradation)
    // We'll try to select location, but if it doesn't exist, we'll select without it
    let externalEventsQuery = supabaseAdmin
      .from("external_events")
      .select("id, starts_at, ends_at, status, is_soradin_created")
      .eq("specialist_id", agentId) // specialist_id in external_events = agent_id (user ID)
      .eq("status", "confirmed") // Only block confirmed events
      .eq("is_soradin_created", false) // Only block external events (not Soradin-created)
      .lte("starts_at", rangeEnd) // Event starts before or at range end
      .gte("ends_at", rangeStart); // Event ends after or at range start
    
    const { data: externalEventsRaw, error: externalEventsError } = await externalEventsQuery;
    
    // If location column exists, try to fetch it separately or handle gracefully
    // For now, we'll work without location filtering until migration is run
    
    // Filter to only events that actually overlap (safety check)
    // Also normalize the time strings to ensure proper Date parsing
    const externalEvents = externalEventsRaw?.map((evt: any) => {
      // Normalize time strings - handle Microsoft's .0000000 format and ensure proper ISO format
      let startsAt = evt.starts_at;
      let endsAt = evt.ends_at;
      
      // If time has more than 3 decimal places, truncate to milliseconds
      if (startsAt && startsAt.includes('.')) {
        const match = startsAt.match(/^(.+?\.\d{3})(\d*)(.*)$/);
        if (match) {
          startsAt = match[1] + (match[3] || '');
        }
      }
      if (endsAt && endsAt.includes('.')) {
        const match = endsAt.match(/^(.+?\.\d{3})(\d*)(.*)$/);
        if (match) {
          endsAt = match[1] + (match[3] || '');
        }
      }
      
      return {
        ...evt,
        starts_at: startsAt,
        ends_at: endsAt,
        location: evt.location || null, // Will be null if column doesn't exist
      };
    }).filter((evt: any) => {
      const evtStart = new Date(evt.starts_at);
      const evtEnd = new Date(evt.ends_at);
      const rangeStartDate = new Date(rangeStart);
      const rangeEndDate = new Date(rangeEnd);
      // Overlap: evtStart <= rangeEnd AND evtEnd >= rangeStart
      return evtStart <= rangeEndDate && evtEnd >= rangeStartDate;
    }) || [];

    // Debug: Log appointments and external events
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

    console.log("📅 Loaded external events for conflict detection:", {
      agentId,
      startDate,
      endDate,
      rangeStart,
      rangeEnd,
      count: externalEvents?.length || 0,
      rawCount: externalEventsRaw?.length || 0,
      externalEvents: externalEvents?.map((evt: any) => ({
        id: evt.id,
        startsAt: evt.starts_at,
        endsAt: evt.ends_at,
        status: evt.status,
        isSoradinCreated: evt.is_soradin_created,
      })),
      queryDetails: {
        specialistId: agentId,
        status: "confirmed",
        isSoradinCreated: false,
        startsAtLte: rangeEnd,
        endsAtGte: rangeStart,
      },
    });

    if (appointmentsError) {
      console.error("Error loading appointments:", appointmentsError);
    }

    if (externalEventsError) {
      console.error("Error loading external events:", externalEventsError);
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

    // Helper to check if a time slot conflicts with an appointment or external event
    // SIMPLE LOGIC: Only block if we have confirmed_at and it matches the slot time
    // Compare ISO strings directly for exact matching
    const hasConflict = (slotStart: Date, slotEnd: Date, dateStr: string, slotHour: number): boolean => {
      const slotStartISO = slotStart.toISOString();
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();
      
      // Check if this slot conflicts with any appointment
      if (appointments && appointments.length > 0) {
        const appointmentConflict = appointments.some((apt: any) => {
          // ONLY block if we have confirmed_at - this is the exact booking time
          if (!apt.confirmed_at) {
            return false;
          }
          
          // Get duration from lead's additional_notes if it's an agent-created event
          let durationMinutes = appointmentLength; // Default to standard appointment length
          const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
          if (lead?.additional_notes) {
            const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
            if (durationMatch) {
              durationMinutes = parseInt(durationMatch[1], 10);
            }
          }
          
          // Convert confirmed_at to Date
          const aptStartDate = new Date(apt.confirmed_at);
          const aptStartTime = aptStartDate.getTime();
          const aptEndTime = aptStartTime + (durationMinutes * 60 * 1000);
          
          // Check if the slot overlaps with the appointment's time range
          // Slot overlaps if: slotStart < aptEnd AND slotEnd > aptStart
          const slotOverlaps = slotStartTime < aptEndTime && slotEndTime > aptStartTime;
          
          if (slotOverlaps) {
            // Verify the date also matches (safety check)
            const aptDateStr = aptStartDate.toISOString().split("T")[0];
            if (aptDateStr !== dateStr) {
              return false;
            }
            
            console.log("✅ CONFLICT FOUND (Appointment) - BLOCKING SLOT:", {
              dateStr,
              slotStartISO,
              aptStartISO: aptStartDate.toISOString(),
              aptEndISO: new Date(aptEndTime).toISOString(),
              durationMinutes,
              appointmentId: apt.id,
            });
            return true;
          }
          
          return false;
        });
        
        if (appointmentConflict) return true;
      }
      
      // Check if this slot conflicts with any external calendar event
      // IMPORTANT: Only block if the external event location matches the requested location
      // This allows location-aware blocking (e.g., Penticton event only blocks Penticton slots)
      if (externalEvents && externalEvents.length > 0) {
        const externalEventConflict = externalEvents.some((evt: any) => {
          // Skip if this is a Soradin-created event (shouldn't block)
          if (evt.is_soradin_created) {
            return false;
          }
          
          // Skip if event is cancelled
          if (evt.status !== "confirmed") {
            return false;
          }
          
          // LOCATION-AWARE BLOCKING: Only block if locations match
          // If external event has a location, it must match the requested location
          // If external event has no location (null), it blocks all locations (backward compatibility)
          if (evt.location) {
            // Normalize both locations for comparison (case-insensitive, remove province, trim whitespace)
            const normalizeForComparison = (loc: string) => {
              if (!loc) return null;
              return loc.toLowerCase().split(',').map(s => s.trim())[0].toLowerCase();
            };
            const evtLocationNormalized = normalizeForComparison(evt.location);
            const requestedLocationNormalized = selectedLocation ? normalizeForComparison(selectedLocation) : null;
            
            // If locations don't match, don't block this slot
            if (requestedLocationNormalized && evtLocationNormalized && evtLocationNormalized !== requestedLocationNormalized) {
              // Debug: Log when location doesn't match (for troubleshooting)
              if (dateStr === "2026-01-01" || dateStr === "2026-01-02") {
                console.log(`📍 Location mismatch - NOT blocking:`, {
                  evtLocation: evt.location,
                  evtLocationNormalized,
                  requestedLocation: selectedLocation,
                  requestedLocationNormalized,
                  match: false,
                });
              }
              return false; // Event is for a different location, don't block
            }
          }
          // If evt.location is null, block all locations (backward compatibility for events without location)
          
          const evtStart = new Date(evt.starts_at);
          const evtEnd = new Date(evt.ends_at);
          const evtStartTime = evtStart.getTime();
          const evtEndTime = evtEnd.getTime();
          
          // Check if slot overlaps with external event
          // Slot overlaps if: slotStart < evtEnd AND slotEnd > evtStart
          const overlaps = slotStartTime < evtEndTime && slotEndTime > evtStartTime;
          
          if (overlaps) {
            console.log("✅ CONFLICT FOUND (External Event) - BLOCKING SLOT:", {
              dateStr,
              slotStartISO,
              slotStartTime,
              slotEndTime,
              evtStartsAt: evt.starts_at,
              evtEndsAt: evt.ends_at,
              evtStartTime,
              evtEndTime,
              externalEventId: evt.id,
              isSoradinCreated: evt.is_soradin_created,
              status: evt.status,
              evtLocation: evt.location,
              requestedLocation: selectedLocation,
              locationMatch: evt.location ? (evt.location.toLowerCase().includes(selectedLocation?.toLowerCase() || '')) : 'no location (blocks all)',
              overlap: overlaps,
            });
            return true;
          }
          
          return false;
        });
        
        if (externalEventConflict) return true;
      } else {
        // Log when no external events found (for debugging)
        if (externalEventsRaw && externalEventsRaw.length === 0) {
          console.log("ℹ️ No external events found for date range:", {
            agentId,
            startDate,
            endDate,
            rangeStart,
            rangeEnd,
            requestedLocation: selectedLocation,
          });
        }
      }
      
      // No conflicts - slot is available
      return false;
    };

    // Generate availability days
    const days: AvailabilityDay[] = [];
    
    // If daily mode, fetch daily availability from database
    if (locationType === "daily" && selectedLocation) {
      console.log("📅 [DAILY AVAILABILITY] Fetching daily availability:", {
        agentId,
        selectedLocation,
        startDate,
        endDate,
      });

      // Fetch all daily availability entries for this agent in the date range
      // We'll filter by location in code to handle normalization properly
      const { data: allDailyAvailability, error: dailyAvailabilityError } = await supabaseAdmin
        .from("daily_availability")
        .select("date, start_time, end_time, location")
        .eq("specialist_id", agentId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (dailyAvailabilityError) {
        console.error("Error loading daily availability:", dailyAvailabilityError);
        return NextResponse.json(
          { error: "Failed to load daily availability" },
          { status: 500 }
        );
      }

      // Filter by normalized location (case-insensitive, handle "Office" suffix)
      const normalizedSelectedLocation = selectedLocation.toLowerCase().trim();
      const dailyAvailabilityData = (allDailyAvailability || []).filter((entry: any) => {
        if (!entry.location) return false;
        const normalizedEntryLocation = entry.location?.toLowerCase().trim();
        return normalizedEntryLocation === normalizedSelectedLocation;
      });

      console.log("📅 [DAILY AVAILABILITY] Filtered entries for location:", {
        selectedLocation,
        normalizedSelectedLocation,
        allEntriesCount: allDailyAvailability?.length || 0,
        filteredCount: dailyAvailabilityData?.length || 0,
        entries: dailyAvailabilityData || [],
      });

      // Create a map of date -> daily availability entry
      const dailyAvailabilityMap = new Map<string, { start_time: string; end_time: string }>();
      (dailyAvailabilityData || []).forEach((entry: any) => {
        dailyAvailabilityMap.set(entry.date, {
          start_time: entry.start_time,
          end_time: entry.end_time,
        });
      });

      // Parse start and end dates
      const startParts = startDate.split("-").map(Number);
      const endParts = endDate.split("-").map(Number);
      const startDateObj = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
      const endDateObj = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));

      // Generate days ONLY for dates that have daily availability entries
      // Do NOT generate empty days - only return days with actual availability
      for (
        let date = new Date(startDateObj);
        date <= endDateObj;
        date.setUTCDate(date.getUTCDate() + 1)
      ) {
        const dateStr = date.toISOString().split("T")[0];
        const dailyEntry = dailyAvailabilityMap.get(dateStr);

        // Only process days that have daily availability entries
        if (!dailyEntry) {
          // Skip days without daily availability - do NOT add empty days
          continue;
        }

        // Generate slots for this day
        const slots: { startsAt: string; endsAt: string }[] = [];
        const [startHour, startMin] = dailyEntry.start_time.split(":").map(Number);
        const [endHour, endMin] = dailyEntry.end_time.split(":").map(Number);

        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
          days.push({ date: dateStr, slots: [] });
          continue;
        }

        const endTimeMinutes = endHour * 60 + endMin;
        let currentTimeMinutes = startHour * 60 + startMin;

        while (currentTimeMinutes < endTimeMinutes) {
          const slotEndMinutes = currentTimeMinutes + appointmentLength;
          
          if (slotEndMinutes > endTimeMinutes) {
            break;
          }

          const currentHour = Math.floor(currentTimeMinutes / 60);
          const currentMin = currentTimeMinutes % 60;
          const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
          
          const localDateTimeStr = `${dateStr}T${timeStr}:00`;
          const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
          const localEnd = localStart.plus({ minutes: appointmentLength });
          
          if (!localStart.isValid || !localEnd.isValid) {
            currentTimeMinutes += appointmentLength;
            continue;
          }
          
          const slotStart = new Date(localStart.toUTC().toISO());
          const slotEnd = new Date(localEnd.toUTC().toISO());
          const slotHour = localStart.hour;

          const hasConflictResult = hasConflict(slotStart, slotEnd, dateStr, slotHour);
          
          if (!hasConflictResult) {
            slots.push({
              startsAt: slotStart.toISOString(),
              endsAt: slotEnd.toISOString(),
            });
          }

          currentTimeMinutes += appointmentLength;
        }

        days.push({ date: dateStr, slots });
      }

      console.log("📅 [DAILY AVAILABILITY] Returning days:", {
        selectedLocation,
        totalDays: days.length,
        dates: days.map(d => d.date),
        daysWithSlots: days.filter(d => d.slots.length > 0).length,
      });

      return NextResponse.json(days);
    }

    // Recurring mode: Use existing logic
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    // Parse start and end dates properly to avoid timezone issues
    // Use UTC to ensure correct day-of-week calculation
    const startParts = startDate.split("-").map(Number);
    const endParts = endDate.split("-").map(Number);
    const startDateObj = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
    const endDateObj = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
    
    for (
      let date = new Date(startDateObj);
      date <= endDateObj;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      // Use getUTCDay() to get day of week in UTC, avoiding timezone shifts
      // CRITICAL: Must use getUTCDay() not getDay() to avoid timezone issues
      const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
      const dayName = dayNames[weekday];
      
      // Debug: Verify day calculation is correct
      if (dateStr === "2026-01-01" || dateStr === "2026-01-02") {
        console.log(`📅 Day calculation for ${dateStr}:`, {
          dateStr,
          weekday,
          dayName,
          expectedDay: dateStr === "2026-01-01" ? "thursday" : "friday",
          matches: dateStr === "2026-01-01" ? dayName === "thursday" : dayName === "friday"
        });
      }

      // Get schedule for this day - try multiple variations to handle different formats
      let daySchedule = locationSchedule[dayName]; // Try lowercase first (e.g., "thursday")
      if (!daySchedule) {
        // Try capitalized version (e.g., "Thursday")
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        daySchedule = locationSchedule[capitalizedDay];
      }
      if (!daySchedule) {
        // Try all lowercase with first letter capitalized (e.g., "Thursday")
        daySchedule = locationSchedule[dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase()];
      }
      if (!daySchedule) {
        // Try all uppercase (e.g., "THURSDAY")
        daySchedule = locationSchedule[dayName.toUpperCase()];
      }
      
      // Debug: Log what we're looking for and what we found
      if (dateStr === "2026-01-01" || dateStr === "2026-01-02") {
        console.log(`🔍 Looking for schedule for ${dayName} (${dateStr}):`, {
          dayName,
          locationScheduleKeys: Object.keys(locationSchedule),
          found: !!daySchedule,
          schedule: daySchedule,
        });
      }
      
      if (!daySchedule || !daySchedule.enabled) {
        console.log(`No schedule for ${dayName} (${dateStr}):`, {
          dayName,
          availableKeys: Object.keys(locationSchedule),
          daySchedule,
          enabled: daySchedule?.enabled,
        });
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
