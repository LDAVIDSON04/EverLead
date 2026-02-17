import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { PROVINCE_TO_TIMEZONE } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch office locations to get cities
    const { data: officeLocations, error: officeLocationsError } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", user.id)
      .order("display_order", { ascending: true });

    // Extract unique cities from office locations
    const citiesFromOfficeLocations: string[] = Array.from(
      new Set(
        (officeLocations || [])
          .map((loc: any) => loc.city)
          .filter((city: any) => city && typeof city === 'string')
      )
    ) as string[];

    const metadata = profile?.metadata || {};
    const availabilityData = metadata.availability || {};
    const existingLocations = (availabilityData.locations || []) as string[];
    const existingAvailabilityByLocation = availabilityData.availabilityByLocation || {};

    // Merge: combine cities from office locations with manually added cities
    // Office location cities are always included, plus any manually added cities from existing data
    const allLocationsSet = new Set<string>();
    citiesFromOfficeLocations.forEach(city => allLocationsSet.add(city));
    existingLocations.forEach(city => allLocationsSet.add(city)); // Include manually added cities
    
    const validLocations = Array.from(allLocationsSet);

    // Normalize city for matching: primary name (before comma), trimmed, lowercase
    const normalizeCityForMatch = (name: string): string => {
      if (!name || typeof name !== "string") return "";
      const primary = name.split(",").map((s) => s.trim())[0] || name.trim();
      return primary.toLowerCase();
    };

    // Include availability data for all valid locations (both office locations and manually added)
    // Match by exact key, then case-insensitive, then primary name (e.g. "Penticton, BC" matches stored "Penticton")
    const validAvailabilityByLocation: Record<string, any> = {};
    validLocations.forEach((city: string) => {
      if (existingAvailabilityByLocation[city]) {
        validAvailabilityByLocation[city] = existingAvailabilityByLocation[city];
        return;
      }
      const cityNorm = normalizeCityForMatch(city);
      const matchingKey = Object.keys(existingAvailabilityByLocation).find((key) => {
        if (key.toLowerCase() === city.toLowerCase()) return true;
        if (normalizeCityForMatch(key) === cityNorm) return true;
        return false;
      });
      if (matchingKey) {
        validAvailabilityByLocation[city] = existingAvailabilityByLocation[matchingKey];
      }
    });

    // Get availability type per location (which type is active: "recurring" or "daily")
    const availabilityTypeByLocation = availabilityData.availabilityTypeByLocation || {};
    // Video call availability (province-wide) - same schedule format as one location
    const videoSchedule = availabilityData.videoSchedule || null;

    return NextResponse.json({
      locations: validLocations,
      availabilityByLocation: validAvailabilityByLocation,
      appointmentLength: availabilityData.appointmentLength || "30",
      availabilityTypeByLocation, // e.g., { "Kelowna": "recurring", "Penticton": "daily" }
      videoSchedule,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/availability:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { locations, availabilityByLocation, appointmentLength, availabilityTypeByLocation, videoSchedule: videoSchedulePayload } = body;
    
    // CRITICAL: Log incoming availability data to track what's being saved
    console.log("💾 [AVAILABILITY SAVE] Incoming availability data:", {
      userId: user.id,
      locations,
      availabilityByLocation: JSON.stringify(availabilityByLocation, null, 2),
      appointmentLength,
      availabilityTypeByLocation,
      hasVideoSchedule: !!videoSchedulePayload,
    });

    // Get cities from office locations
    const { data: officeLocations } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", user.id);

    const officeLocationCities: string[] = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );

    // Normalize location names for comparison (remove province, "Office" suffix, lowercase)
    const normalizeLocation = (loc: string): string => {
      if (!loc) return '';
      let normalized = loc.split(',').map(s => s.trim())[0]; // Remove province
      normalized = normalized.replace(/\s+office$/i, '').trim(); // Remove "Office" suffix
      return normalized.toLowerCase();
    };

    // CRITICAL: Import timezone validation utilities
    const { validateBusinessHours, isValidTimeFormat } = await import("@/lib/timezone");
    
    const invalidTimes: string[] = [];
    // Validate video schedule if provided (same format as location schedule: day -> { enabled, start, end })
    const validDayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    if (videoSchedulePayload && typeof videoSchedulePayload === "object") {
      for (const dayName of validDayNames) {
        const daySchedule = videoSchedulePayload[dayName];
        if (daySchedule && daySchedule.enabled) {
          const startTime = daySchedule.start;
          const endTime = daySchedule.end;
          if (!isValidTimeFormat(startTime)) {
            invalidTimes.push(`Video ${dayName}: Invalid start time format "${startTime}"`);
          }
          if (!isValidTimeFormat(endTime)) {
            invalidTimes.push(`Video ${dayName}: Invalid end time format "${endTime}"`);
          }
          if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
            const validation = validateBusinessHours(startTime, endTime);
            if (!validation.isValid) {
              invalidTimes.push(`Video ${dayName}: ${validation.error}`);
            }
          }
        }
      }
    }

    // Validate: ALL locations in availabilityByLocation must match office location cities
    const invalidLocations: string[] = [];
    Object.keys(availabilityByLocation || {}).forEach((city: string) => {
      if (!city || !city.trim()) return;
      const normalizedCity = normalizeLocation(city);
      const normalizedOfficeCities = officeLocationCities.map(normalizeLocation);
      
      // Check if this city matches any office location (case-insensitive, normalized)
      const isValid = normalizedOfficeCities.some(officeCity => 
        normalizedCity === officeCity
      );
      
      if (!isValid) {
        invalidLocations.push(city);
      }
      
      // CRITICAL: Validate all time values for this location
      const locationSchedule = availabilityByLocation[city];
      if (locationSchedule && typeof locationSchedule === 'object') {
        Object.keys(locationSchedule).forEach((dayName: string) => {
          const daySchedule = locationSchedule[dayName];
          if (daySchedule && daySchedule.enabled) {
            const startTime = daySchedule.start;
            const endTime = daySchedule.end;
            
            // Validate time format
            if (!isValidTimeFormat(startTime)) {
              invalidTimes.push(`${city} ${dayName}: Invalid start time format "${startTime}"`);
            }
            if (!isValidTimeFormat(endTime)) {
              invalidTimes.push(`${city} ${dayName}: Invalid end time format "${endTime}"`);
            }
            
            // Validate business hours (this will catch the 1 AM issue)
            if (isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
              const validation = validateBusinessHours(startTime, endTime);
              if (!validation.isValid) {
                invalidTimes.push(`${city} ${dayName}: ${validation.error}`);
              }
            }
          }
        });
      }
    });

    // CRITICAL: Block saving if there are invalid times (this prevents 1 AM bugs)
    if (invalidTimes.length > 0) {
      console.error("❌ [AVAILABILITY SAVE] Invalid times detected - BLOCKING SAVE:", invalidTimes);
      return NextResponse.json(
        {
          error: "Invalid availability times detected. Please fix the following issues:",
          invalidTimes,
          details: invalidTimes.join("; "),
        },
        { status: 400 }
      );
    }
    
    if (invalidLocations.length > 0) {
      return NextResponse.json(
        { 
          error: "Invalid location names found. Please check your spelling. Locations must match your office location cities.",
          invalidLocations,
          validLocations: officeLocationCities,
          details: `The following locations are invalid: ${invalidLocations.join(', ')}. Valid locations are: ${officeLocationCities.join(', ')}`
        },
        { status: 400 }
      );
    }

    // CRITICAL: Only include cities from office locations; normalize keys so "Penticton" matches "Penticton, BC"
    const allCitiesSet = new Set<string>();
    officeLocationCities.forEach((city) => allCitiesSet.add(city));
    const validLocations = Array.from(allCitiesSet);
    const validLocationsSet = new Set(validLocations);

    const normalizeCityForMatch = (name: string): string => {
      if (!name || typeof name !== "string") return "";
      const primary = name.split(",").map((s) => s.trim())[0] || name.trim();
      return primary.toLowerCase();
    };

    // For each requested city key, find canonical office city (exact, case-insensitive, or primary name) so save/load keys align
    const getCanonicalCity = (requestedCity: string): string | null => {
      if (validLocationsSet.has(requestedCity)) return requestedCity;
      const requestedNorm = normalizeCityForMatch(requestedCity);
      const canonical = validLocations.find(
        (c) => c.toLowerCase() === requestedCity.toLowerCase() || normalizeCityForMatch(c) === requestedNorm
      );
      return canonical ?? null;
    };

    const filteredAvailabilityByLocation: Record<string, any> = {};
    const invalidTimeWarnings: string[] = [];

    Object.keys(availabilityByLocation || {}).forEach((requestedCity) => {
      const canonicalCity = getCanonicalCity(requestedCity);
      if (!canonicalCity) return;

      const citySchedule = availabilityByLocation[requestedCity];
      if (!citySchedule || typeof citySchedule !== "object") return;

      const validatedSchedule: Record<string, any> = {};
      Object.keys(citySchedule).forEach((dayName) => {
        const daySchedule = citySchedule[dayName];
        if (daySchedule && daySchedule.enabled) {
          const [startHour, startMin] = (daySchedule.start || "09:00").split(":").map(Number);
          const [endHour, endMin] = (daySchedule.end || "17:00").split(":").map(Number);
          if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            if (startHour < 5 || startHour >= 23) {
              invalidTimeWarnings.push(`${canonicalCity} ${dayName}: Start time ${daySchedule.start} seems unusual.`);
            }
            if (endMinutes <= startMinutes) {
              invalidTimeWarnings.push(`${canonicalCity} ${dayName}: End time must be after start time`);
            }
            if (endMinutes - startMinutes > 14 * 60) {
              invalidTimeWarnings.push(`${canonicalCity} ${dayName}: Availability window over 14 hours`);
            }
          }
        }
        validatedSchedule[dayName] = daySchedule;
      });

      // Store under canonical key so GET (which returns office cities) always finds it
      filteredAvailabilityByLocation[canonicalCity] = validatedSchedule;
    });
    
    // Log warnings but don't block saving (agents might have valid reasons for unusual hours)
    if (invalidTimeWarnings.length > 0) {
      console.warn("⚠️ [AVAILABILITY VALIDATION] Potential time validation issues:", invalidTimeWarnings);
    }

    // Store availability in agent's profile metadata or a separate table
    // For now, we'll store it in a JSONB field
    // Get existing metadata and province
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("metadata, agent_province")
      .eq("id", user.id)
      .maybeSingle();

    const existingMetadata = existingProfile?.metadata || {};
    const existingAvailability = existingMetadata.availability || {};

    // When saving only video (videoSchedule in payload, no in-person data in request), preserve existing in-person availability
    const isVideoOnlyUpdate = videoSchedulePayload && typeof videoSchedulePayload === "object" && Object.keys(videoSchedulePayload).length > 0 &&
      (!locations || locations.length === 0) &&
      (!availabilityByLocation || Object.keys(availabilityByLocation).length === 0);

    // Automatically store timezone based on province (if not already stored)
    let timezoneToStore = existingMetadata.timezone;
    if (!timezoneToStore && existingProfile?.agent_province) {
      const province = existingProfile.agent_province.toUpperCase().trim();
      const inferredTimezone = PROVINCE_TO_TIMEZONE[province];
      if (inferredTimezone) {
        timezoneToStore = inferredTimezone;
        console.log(`✅ [AVAILABILITY SAVE] Storing timezone ${timezoneToStore} for province ${province}`);
      }
    }

    // Store availability type per location (which type is active)
    const availabilityTypeToStore = availabilityTypeByLocation || {};

    // Normalize and validate video schedule for storage (same day keys as location schedule)
    let videoScheduleToStore: Record<string, { enabled: boolean; start: string; end: string }> | undefined;
    if (videoSchedulePayload && typeof videoSchedulePayload === "object" && Object.keys(videoSchedulePayload).length > 0) {
      videoScheduleToStore = {};
      for (const dayName of validDayNames) {
        const daySchedule = videoSchedulePayload[dayName];
        if (daySchedule && typeof daySchedule === "object" && daySchedule.enabled) {
          const start = typeof daySchedule.start === "string" ? daySchedule.start : "09:00";
          const end = typeof daySchedule.end === "string" ? daySchedule.end : "17:00";
          if (isValidTimeFormat(start) && isValidTimeFormat(end)) {
            const validation = validateBusinessHours(start, end);
            if (validation.isValid) {
              videoScheduleToStore[dayName] = { enabled: true, start, end };
            }
          }
        } else {
          videoScheduleToStore[dayName] = { enabled: false, start: "09:00", end: "17:00" };
        }
      }
    }

    const finalLocations = isVideoOnlyUpdate ? (existingAvailability.locations || validLocations) : validLocations;
    const finalAvailabilityByLocation = isVideoOnlyUpdate ? (existingAvailability.availabilityByLocation || filteredAvailabilityByLocation) : filteredAvailabilityByLocation;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        metadata: {
          ...existingMetadata,
          ...(timezoneToStore && { timezone: timezoneToStore }), // Store timezone if we have it
          availability: {
            locations: finalLocations,
            availabilityByLocation: finalAvailabilityByLocation,
            appointmentLength: appointmentLength || existingAvailability.appointmentLength || "30",
            availabilityTypeByLocation: availabilityTypeToStore,
            ...(videoScheduleToStore && { videoSchedule: videoScheduleToStore }),
          },
        },
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving availability:", error);
      return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/availability:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
