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
    const citiesFromOfficeLocations = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );

    const metadata = profile?.metadata || {};
    const availabilityData = metadata.availability || {};
    const existingLocations = availabilityData.locations || [];
    const existingAvailabilityByLocation = availabilityData.availabilityByLocation || {};

    // Merge: use cities from office locations, but preserve existing availability data
    // Only include cities that exist in office locations
    const validLocations = citiesFromOfficeLocations.length > 0 
      ? citiesFromOfficeLocations 
      : existingLocations; // Fallback if no office locations yet

    // Ensure availabilityByLocation only contains valid locations
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

    // Verify that all locations in availabilityByLocation exist in office_locations
    const { data: officeLocations, error: officeLocationsError } = await supabaseAdmin
      .from("office_locations")
      .select("city")
      .eq("agent_id", user.id);

    const validCities = Array.from(
      new Set((officeLocations || []).map((loc: any) => loc.city).filter(Boolean))
    );

    // Filter availabilityByLocation to only include cities from office locations
    const filteredAvailabilityByLocation: Record<string, any> = {};
    Object.keys(availabilityByLocation || {}).forEach((city) => {
      if (validCities.includes(city)) {
        filteredAvailabilityByLocation[city] = availabilityByLocation[city];
      }
    });

    // Use validCities as the locations array (cities from office locations)
    const validLocations = validCities;

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
