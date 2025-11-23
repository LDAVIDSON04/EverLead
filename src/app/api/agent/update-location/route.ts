// API route to update agent location
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city, province, latitude, longitude, search_radius_km, userId } = body;

    // Validate required fields
    if (!city || !province || latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "City, province, latitude, and longitude are required." },
        { status: 400 }
      );
    }

    // Get user ID from request (sent by frontend after verifying auth)
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Verify user exists and is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "agent") {
      return NextResponse.json(
        { error: "Unauthorized - Agent access required" },
        { status: 401 }
      );
    }

    // Update profile with location
    const updateData: any = {
      agent_city: city,
      agent_province: province,
      agent_latitude: latitude,
      agent_longitude: longitude,
    };

    if (search_radius_km !== undefined) {
      updateData.search_radius_km = search_radius_km;
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Location update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update location." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location updated successfully.",
    });
  } catch (error: any) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

