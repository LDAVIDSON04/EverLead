// API route to geocode existing leads that don't have coordinates
// This should be run by admin to backfill coordinates for existing leads
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { geocodeLocation } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  try {
    // Get all leads without coordinates
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("id, city, province, latitude, longitude")
      .or("latitude.is.null,longitude.is.null")
      .limit(100); // Process 100 at a time to avoid rate limits

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All leads already have coordinates",
        geocoded: 0,
      });
    }

    let geocoded = 0;
    let failed = 0;
    const errors: string[] = [];

    // Geocode each lead
    for (const lead of leads) {
      if (!lead.city || !lead.province) {
        failed++;
        continue;
      }

      try {
        const result = await geocodeLocation(lead.city, lead.province);
        
        if (result) {
          const { error: updateError } = await supabaseAdmin
            .from("leads")
            .update({
              latitude: result.latitude,
              longitude: result.longitude,
            })
            .eq("id", lead.id);

          if (updateError) {
            console.error(`Failed to update lead ${lead.id}:`, updateError);
            failed++;
            errors.push(`Lead ${lead.id}: ${updateError.message}`);
          } else {
            geocoded++;
          }
        } else {
          failed++;
          errors.push(`Lead ${lead.id}: Geocoding failed for ${lead.city}, ${lead.province}`);
        }

        // Small delay to avoid rate limits (Google allows 50 requests/second)
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        console.error(`Error geocoding lead ${lead.id}:`, error);
        failed++;
        errors.push(`Lead ${lead.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Geocoded ${geocoded} leads, ${failed} failed`,
      geocoded,
      failed,
      total: leads.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error: any) {
    console.error("Geocode leads error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

