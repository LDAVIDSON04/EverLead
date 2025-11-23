// API route for geocoding (server-side to protect API key)
import { NextRequest, NextResponse } from "next/server";
import { geocodeLocation, reverseGeocode } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, city, province, latitude, longitude } = body;

    if (type === "geocode" && city && province) {
      const result = await geocodeLocation(city, province);
      if (!result) {
        return NextResponse.json(
          { error: "Geocoding failed" },
          { status: 400 }
        );
      }
      return NextResponse.json(result);
    }

    if (type === "reverse" && latitude && longitude) {
      const result = await reverseGeocode(latitude, longitude);
      if (!result) {
        return NextResponse.json(
          { error: "Reverse geocoding failed" },
          { status: 400 }
        );
      }
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

