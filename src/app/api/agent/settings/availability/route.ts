import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

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

    // Include availability data for all valid locations (both office locations and manually added)
    // Also check case-insensitive matches to handle variations in city names
    const validAvailabilityByLocation: Record<string, any> = {};
    validLocations.forEach((city: string) => {
      // Try exact match first
      if (existingAvailabilityByLocation[city]) {
        validAvailabilityByLocation[city] = existingAvailabilityByLocation[city];
      } else {
        // Try case-insensitive match
        const matchingKey = Object.keys(existingAvailabilityByLocation).find(
          key => key.toLowerCase() === city.toLowerCase()
        );
        if (matchingKey) {
          validAvailabilityByLocation[city] = existingAvailabilityByLocation[matchingKey];
        }
      }
    });

    // Get availability type per location (which type is active: "recurring" or "daily")
    const availabilityTypeByLocation = availabilityData.availabilityTypeByLocation || {};

    return NextResponse.json({
      locations: validLocations,
      availabilityByLocation: validAvailabilityByLocation,
      appointmentLength: availabilityData.appointmentLength || "30",
      availabilityTypeByLocation, // e.g., { "Kelowna": "recurring", "Penticton": "daily" }
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
    const { locations, availabilityByLocation, appointmentLength, availabilityTypeByLocation } = body;
    
    // CRITICAL: Log incoming availability data to track what's being saved
    console.log("💾 [AVAILABILITY SAVE] Incoming availability data:", {
      userId: user.id,
      locations,
      availabilityByLocation: JSON.stringify(availabilityByLocation, null, 2),
      appointmentLength,
      availabilityTypeByLocation,
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
    
    // Validate: ALL locations in availabilityByLocation must match office location cities
    // This prevents typos like "pentction" instead of "Penticton"
    const invalidLocations: string[] = [];
    const invalidTimes: string[] = [];
    
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

    // CRITICAL: Only include cities from office locations
    // This ensures no typos are saved
    const allCitiesSet = new Set<string>();
    
    // Only add office location cities (agents can't add arbitrary locations)
    officeLocationCities.forEach(city => allCitiesSet.add(city));

    const validLocations = Array.from(allCitiesSet);

    // Include ALL availability data (filter by valid locations for safety)
    // Also validate time ranges to catch obvious errors
    const filteredAvailabilityByLocation: Record<string, any> = {};
    const validLocationsSet = new Set(validLocations);
    const invalidTimeWarnings: string[] = [];
    
    Object.keys(availabilityByLocation || {}).forEach((city) => {
      if (validLocationsSet.has(city)) {
        const citySchedule = availabilityByLocation[city];
        const validatedSchedule: Record<string, any> = {};
        
        // Validate each day's schedule
        Object.keys(citySchedule).forEach((dayName) => {
          const daySchedule = citySchedule[dayName];
          if (daySchedule && daySchedule.enabled) {
            // Parse start and end times
            const [startHour, startMin] = (daySchedule.start || "09:00").split(":").map(Number);
            const [endHour, endMin] = (daySchedule.end || "17:00").split(":").map(Number);
            
            // Validate times are reasonable (start between 5 AM and 11 PM, end after start)
            if (!isNaN(startHour) && !isNaN(startMin) && !isNaN(endHour) && !isNaN(endMin)) {
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              
              // Check for obviously wrong times (e.g., start time before 5 AM or after 11 PM)
              if (startHour < 5 || startHour >= 23) {
                invalidTimeWarnings.push(`${city} ${dayName}: Start time ${daySchedule.start} seems unusual (before 5 AM or after 11 PM). Please verify this is correct.`);
              }
              
              // Check that end is after start
              if (endMinutes <= startMinutes) {
                invalidTimeWarnings.push(`${city} ${dayName}: End time (${daySchedule.end}) must be after start time (${daySchedule.start})`);
              }
              
              // Check for very long hours (> 14 hours is likely wrong)
              if (endMinutes - startMinutes > 14 * 60) {
                invalidTimeWarnings.push(`${city} ${dayName}: Availability window is over 14 hours (${daySchedule.start} - ${daySchedule.end}). Please verify this is correct.`);
              }
            }
          }
          validatedSchedule[dayName] = daySchedule;
        });
        
        filteredAvailabilityByLocation[city] = validatedSchedule;
      }
    });
    
    // Log warnings but don't block saving (agents might have valid reasons for unusual hours)
    if (invalidTimeWarnings.length > 0) {
      console.warn("⚠️ [AVAILABILITY VALIDATION] Potential time validation issues:", invalidTimeWarnings);
    }

    // Store availability in agent's profile metadata or a separate table
    // For now, we'll store it in a JSONB field
    // Get existing metadata
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const existingMetadata = existingProfile?.metadata || {};

    // Store availability type per location (which type is active)
    const availabilityTypeToStore = availabilityTypeByLocation || {};

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        metadata: {
          ...existingMetadata,
          availability: {
            locations: validLocations,
            availabilityByLocation: filteredAvailabilityByLocation,
            appointmentLength,
            availabilityTypeByLocation: availabilityTypeToStore, // Store which type is active per location
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
