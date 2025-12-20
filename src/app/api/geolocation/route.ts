// API route to detect user's location based on IP address
// Uses free IP geolocation service (ip-api.com) - no API key needed for basic usage
// Rate limit: 45 requests/minute (free tier)

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get user's IP address from request headers
    // Check various headers that might contain the real IP (for proxies/load balancers)
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare
    
    // Extract the first IP from x-forwarded-for (can contain multiple IPs)
    const clientIp = forwarded?.split(",")[0]?.trim() || 
                     realIp || 
                     cfConnectingIp ||
                     req.ip ||
                     "unknown";

    // If we can't get an IP, return null
    if (clientIp === "unknown" || !clientIp) {
      return NextResponse.json({ 
        city: null, 
        province: null,
        country: null 
      });
    }

    // Use ip-api.com free service (no API key needed)
    // Returns: city, region (province), country
    // Note: Free tier allows HTTPS but has rate limit of 45 requests/minute
    const response = await fetch(`https://ip-api.com/json/${clientIp}?fields=status,message,city,region,regionName,country,countryCode`);
    
    if (!response.ok) {
      console.error("IP geolocation service error:", response.status);
      return NextResponse.json({ 
        city: null, 
        province: null,
        country: null 
      });
    }

    const data = await response.json();
    
    // Check if the request was successful
    if (data.status === "fail") {
      console.warn("IP geolocation failed:", data.message);
      return NextResponse.json({ 
        city: null, 
        province: null,
        country: null 
      });
    }

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

    const province = provinceMap[data.regionName] || data.region || null;
    const city = data.city || null;
    const country = data.country || null;

    // Format location string (e.g., "Edmonton, AB")
    let locationString: string | null = null;
    if (city && province) {
      locationString = `${city}, ${province}`;
    } else if (city) {
      locationString = city;
    } else if (province) {
      locationString = province;
    }

    return NextResponse.json({
      city,
      province,
      country,
      location: locationString, // Pre-formatted string for the search field
    });
  } catch (error: any) {
    console.error("Error detecting location:", error);
    return NextResponse.json({ 
      city: null, 
      province: null,
      country: null,
      location: null
    });
  }
}
