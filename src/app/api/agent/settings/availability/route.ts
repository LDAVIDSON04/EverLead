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
    const validAvailabilityByLocation: Record<string, any> = {};
    validLocations.forEach((city: string) => {
      if (existingAvailabilityByLocation[city]) {
        validAvailabilityByLocation[city] = existingAvailabilityByLocation[city];
      }
    });

    return NextResponse.json({
      locations: validLocations,
      availabilityByLocation: validAvailabilityByLocation,
      appointmentLength: availabilityData.appointmentLength || "30",
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
    const { locations, availabilityByLocation, appointmentLength } = body;

    // Get cities from office locations for reference
    const { data: officeLocations } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", user.id);

    const officeLocationCities = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );

    // Allow both office location cities and manually added cities
    // Filter availabilityByLocation to only include cities in the locations array
    const filteredAvailabilityByLocation: Record<string, any> = {};
    const validLocationsSet = new Set(locations || []);
    Object.keys(availabilityByLocation || {}).forEach((city) => {
      if (validLocationsSet.has(city)) {
        filteredAvailabilityByLocation[city] = availabilityByLocation[city];
      }
    });

    // Use the locations array provided (includes both office location cities and manually added ones)
    const validLocations = locations || [];

    // Store availability in agent's profile metadata or a separate table
    // For now, we'll store it in a JSONB field
    // Get existing metadata
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const existingMetadata = existingProfile?.metadata || {};

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        metadata: {
          ...existingMetadata,
          availability: {
            locations: validLocations,
            availabilityByLocation: filteredAvailabilityByLocation,
            appointmentLength,
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
