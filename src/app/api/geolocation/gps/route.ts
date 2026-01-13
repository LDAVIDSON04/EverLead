// API route to reverse geocode GPS coordinates to city/province
// Used by client-side browser geolocation API

import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocoding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    console.log("📍 [GPS GEOLOCATION] Reverse geocoding coordinates:", { lat, lng });

    const result = await reverseGeocode(lat, lng);

    if (!result) {
      console.warn("⚠️ [GPS GEOLOCATION] Reverse geocoding failed");
      return NextResponse.json({
        city: null,
        province: null,
        country: null,
        location: null,
      });
    }

    // Map Canadian provinces to standard abbreviations (some reverse geocoding returns full names)
    const provinceMap: Record<string, string> = {
      "Alberta": "AB",
      "British Columbia": "BC",
      "Manitoba": "MB",
      "New Brunswick": "NB",
      "Newfoundland and Labrador": "NL",
      "Northwest Territories": "NT",
      "Nova Scotia": "NS",
      "Nunavut": "NU",
      "Ontario": "ON",
      "Prince Edward Island": "PE",
      "Quebec": "QC",
      "Saskatchewan": "SK",
      "Yukon": "YT",
    };

    const province = provinceMap[result.province] || result.province;
    const locationString = `${result.city}, ${province}`;

    console.log("✅ [GPS GEOLOCATION] Location detected:", {
      city: result.city,
      province,
      locationString,
    });

    return NextResponse.json({
      city: result.city,
      province,
      country: "Canada",
      location: locationString,
    });
  } catch (error: any) {
    console.error("❌ [GPS GEOLOCATION] Error reverse geocoding:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
