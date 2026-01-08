import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { geocodeLocation } from "@/lib/geocoding";
import { normalizeCityName } from "@/lib/cityNormalization";

// GET: Fetch all office locations for the current agent
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: locations, error } = await supabaseAdmin
      .from("office_locations")
      .select("*")
      .eq("agent_id", user.id)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching office locations:", error);
      return NextResponse.json({ error: "Failed to fetch office locations" }, { status: 500 });
    }

    return NextResponse.json({ locations: locations || [] });
  } catch (error) {
    console.error("Error in GET /api/agent/settings/office-locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new office location
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { name, street_address, city, province, postal_code } = body;

    if (!city || !province) {
      return NextResponse.json({ error: "City and province are required" }, { status: 400 });
    }

    // Normalize city name to correct spelling (e.g., "Vaughn" -> "Vaughan")
    city = normalizeCityName(city);

    // Geocode the address to get coordinates (use full address for accuracy)
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const geocodeResult = await geocodeLocation(city, province, street_address, postal_code);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }
    } catch (geocodeError) {
      console.warn("Geocoding failed, continuing without coordinates:", geocodeError);
    }

    // Get the current max display_order for this agent
    const { data: existingLocations } = await supabaseAdmin
      .from("office_locations")
      .select("display_order")
      .eq("agent_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    const displayOrder = existingLocations && existingLocations.length > 0
      ? (existingLocations[0].display_order || 0) + 1
      : 0;

    const { data: location, error } = await supabaseAdmin
      .from("office_locations")
      .insert({
        agent_id: user.id,
        name: name || "Main Office",
        street_address: street_address || null,
        city,
        province,
        postal_code: postal_code || null,
        latitude,
        longitude,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating office location:", error);
      return NextResponse.json({ error: "Failed to create office location" }, { status: 500 });
    }

    return NextResponse.json({ location, success: true });
  } catch (error) {
    console.error("Error in POST /api/agent/settings/office-locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update an office location
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { id, name, street_address, city, province, postal_code, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
    }

    // Normalize city name to correct spelling if city is being updated
    if (city !== undefined && city !== null) {
      city = normalizeCityName(city);
    }

    // Verify the location belongs to this agent
    const { data: existingLocation } = await supabaseAdmin
      .from("office_locations")
      .select("agent_id")
      .eq("id", id)
      .single();

    if (!existingLocation || existingLocation.agent_id !== user.id) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Geocode if address changed (use full address for accuracy)
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (city && province) {
      try {
        const geocodeResult = await geocodeLocation(city, province, street_address, postal_code);
        if (geocodeResult) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
        }
      } catch (geocodeError) {
        console.warn("Geocoding failed, continuing without coordinates:", geocodeError);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (street_address !== undefined) updateData.street_address = street_address;
    if (city !== undefined) updateData.city = city;
    if (province !== undefined) updateData.province = province;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (latitude !== null) updateData.latitude = latitude;
    if (longitude !== null) updateData.longitude = longitude;

    const { data: location, error } = await supabaseAdmin
      .from("office_locations")
      .update(updateData)
      .eq("id", id)
      .eq("agent_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating office location:", error);
      return NextResponse.json({ error: "Failed to update office location" }, { status: 500 });
    }

    return NextResponse.json({ location, success: true });
  } catch (error) {
    console.error("Error in PUT /api/agent/settings/office-locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete an office location
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Location ID is required" }, { status: 400 });
    }

    // Verify the location belongs to this agent
    const { data: existingLocation } = await supabaseAdmin
      .from("office_locations")
      .select("agent_id")
      .eq("id", id)
      .single();

    if (!existingLocation || existingLocation.agent_id !== user.id) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("office_locations")
      .delete()
      .eq("id", id)
      .eq("agent_id", user.id);

    if (error) {
      console.error("Error deleting office location:", error);
      return NextResponse.json({ error: "Failed to delete office location" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/agent/settings/office-locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

