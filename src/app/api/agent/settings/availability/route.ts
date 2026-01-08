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

    // Normalize locations array before returning
    const normalizedLocations = validLocations.map(city => normalizeCityName(city));
    
    // Normalize availabilityTypeByLocation keys
    const normalizedAvailabilityTypeByLocation: Record<string, string> = {};
    Object.keys(availabilityTypeByLocation || {}).forEach(key => {
      const normalizedKey = normalizeCityName(key);
      normalizedAvailabilityTypeByLocation[normalizedKey] = availabilityTypeByLocation[key];
    });
    
    return NextResponse.json({
      locations: normalizedLocations,
      availabilityByLocation: validAvailabilityByLocation,
      appointmentLength: availabilityData.appointmentLength || "30",
      availabilityTypeByLocation: normalizedAvailabilityTypeByLocation, // e.g., { "Kelowna": "recurring", "Penticton": "daily" }
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

    // Validate: ALL locations in availabilityByLocation must match office location cities
    // This prevents typos like "pentction" instead of "Penticton"
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
    });

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
    const filteredAvailabilityByLocation: Record<string, any> = {};
    const validLocationsSet = new Set(validLocations);
    Object.keys(availabilityByLocation || {}).forEach((city) => {
      if (validLocationsSet.has(city)) {
        filteredAvailabilityByLocation[city] = availabilityByLocation[city];
      }
    });

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
