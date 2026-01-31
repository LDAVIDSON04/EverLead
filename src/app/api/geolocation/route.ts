// API route to detect user's location based on IP address
// Uses free IP geolocation service (ip-api.com) - no API key needed for basic usage
// Rate limit: 45 requests/minute (free tier)

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // First, try to use Vercel's built-in geolocation headers (most reliable)
    // Vercel automatically detects location from IP and provides it in headers
    const vercelCity = req.headers.get("x-vercel-ip-city");
    const vercelRegion = req.headers.get("x-vercel-ip-country-region");
    const vercelCountry = req.headers.get("x-vercel-ip-country");
    
    console.log("🌐 [GEOLOCATION] Checking Vercel headers:", {
      vercelCity,
      vercelRegion,
      vercelCountry
    });

    // If Vercel provides location, use it (most reliable and fast)
    if (vercelCity && vercelRegion) {
      // Map Canadian provinces to standard abbreviations
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

      const province = provinceMap[vercelRegion] || vercelRegion;
      // Decode city in case Vercel sends URL-encoded (e.g. "Santa%20Clara" -> "Santa Clara")
      const city = decodeURIComponent(vercelCity);
      const country = vercelCountry;
      // Always format as "City, Province" (no symbols, clean spacing)
      const locationString = `${city}, ${province}`;

      console.log("✅ [GEOLOCATION] Location detected from Vercel headers:", {
        city,
        province,
        country,
        locationString
      });

      return NextResponse.json({
        city,
        province,
        country,
        location: locationString, // Pre-formatted string for the search field (clean, no symbols)
      });
    }

    // Fallback: Try external IP geolocation service if Vercel headers not available
    console.log("⚠️ [GEOLOCATION] Vercel headers not available, trying external service...");
    
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    const clientIp = forwarded?.split(",")[0]?.trim() || 
                     realIp || 
                     cfConnectingIp ||
                     "unknown";

    if (clientIp === "unknown" || !clientIp) {
      console.warn("⚠️ [GEOLOCATION] Could not determine client IP");
      return NextResponse.json({ 
        city: null, 
        province: null,
        country: null,
        location: null
      });
    }

    // Try external service as fallback
    try {
      const response = await fetch(`https://ip-api.com/json/${clientIp}?fields=status,message,city,region,regionName,country,countryCode`);
      
      if (!response.ok) {
        console.error("IP geolocation service error:", response.status);
        return NextResponse.json({ 
          city: null, 
          province: null,
          country: null,
          location: null
        });
      }

      const data = await response.json();
      
      if (data.status === "fail") {
        console.warn("IP geolocation failed:", data.message);
        return NextResponse.json({ 
          city: null, 
          province: null,
          country: null,
          location: null
        });
      }

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

      const province = provinceMap[data.regionName] || data.region || null;
      // Decode city in case the API returns URL-encoded values
      const city = data.city ? decodeURIComponent(String(data.city)) : null;
      const country = data.country || null;

      let locationString: string | null = null;
      if (city && province) {
        // Always format as "City, Province" (clean, no symbols)
        locationString = `${city}, ${province}`;
      } else if (city) {
        locationString = city;
      } else if (province) {
        locationString = province;
      }

      console.log("✅ [GEOLOCATION] Location detected from external service:", {
        city,
        province,
        country,
        locationString
      });

      return NextResponse.json({
        city,
        province,
        country,
        location: locationString,
      });
    } catch (externalError) {
      console.error("❌ [GEOLOCATION] External service failed:", externalError);
      return NextResponse.json({ 
        city: null, 
        province: null,
        country: null,
        location: null
      });
    }
  } catch (error: any) {
    console.error("❌ [GEOLOCATION] Error detecting location:", error);
    return NextResponse.json({ 
      city: null, 
      province: null,
      country: null,
      location: null
    });
  }
}
