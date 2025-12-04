// src/app/api/leads/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
import { checkBotId } from 'botid/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Check for bots
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json(
      { error: 'Bot detected. Access denied.' },
      { status: 403 }
    );
  }

  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables", {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: serviceRoleKey?.length || 0,
      });
      return NextResponse.json(
        {
          error: "Database configuration error. Please contact support.",
          details: `Missing environment variables: ${!supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : ""} ${!serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim(),
        },
        { status: 500 }
      );
    }

    // Create admin client directly here to avoid import-time errors
    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (clientError: any) {
      console.error("Failed to create Supabase admin client", {
        message: clientError?.message,
        stack: clientError?.stack,
        fullError: clientError,
      });
      return NextResponse.json(
        {
          error: "Database configuration error. Please contact support.",
          details: `Failed to create database client: ${clientError?.message || String(clientError)}`,
        },
        { status: 500 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch (err: any) {
      console.error("Failed to parse request body", err);
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: err?.message || String(err),
        },
        { status: 400 }
      );
    }

    console.log("Questionnaire API: Received lead data", {
      hasFirstName: !!body.first_name,
      hasLastName: !!body.last_name,
      hasEmail: !!body.email,
      hasPhone: !!body.phone,
      keys: Object.keys(body),
    });

    // Validate required fields
    // These should mirror the client-side list in `get-started/page.tsx`
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "city",
      "province",
      "timeline_intent",
      "service_type",
      "planning_for",
      "remains_disposition",
      "service_celebration",
      "family_pre_arranged",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = body[field];
      return !value || (typeof value === "string" && value.trim() === "");
    });
    if (missingFields.length > 0) {
      console.error("Missing required fields", missingFields);
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: `Missing: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }
    // Additional notes are now optional but still stored when provided
    const additionalNotes = body.additional_notes
      ? String(body.additional_notes).trim()
      : "";

    // Build insert payload
    // IMPORTANT: Ensure new leads are unsold and available
    const leadData: any = {
      first_name: String(body.first_name).trim(),
      last_name: String(body.last_name).trim(),
      full_name: `${body.first_name} ${body.last_name}`.trim(),
      email: String(body.email).trim(),
      phone: String(body.phone).trim(),
      // Identity/location fields are now optional and may be null
      address_line1: body.address_line1 ? String(body.address_line1).trim() : null,
      city: String(body.city).trim(),
      province: String(body.province).trim(),
      postal_code: body.postal_code ? String(body.postal_code).trim() : null,
      age: body.age ? Number(body.age) : null,
      sex: body.sex ? String(body.sex).trim() : null,
      planning_for: String(body.planning_for).trim(),
      planning_for_name: body.planning_for_name ? String(body.planning_for_name).trim() : null,
      planning_for_age: body.planning_for_age ? Number(body.planning_for_age) : null,
      service_type: String(body.service_type).trim(),
      timeline_intent: String(body.timeline_intent).trim(),
      urgency_level: body.urgency_level || "warm",
      remains_disposition: body.remains_disposition ? String(body.remains_disposition).trim() : null,
      service_celebration: body.service_celebration ? String(body.service_celebration).trim() : null,
      family_pre_arranged: body.family_pre_arranged ? String(body.family_pre_arranged).trim() : null,
      additional_notes: additionalNotes || null,
      // Explicitly set status to "new" and ensure lead is unsold
      status: "new",
      assigned_agent_id: null, // Ensure lead is unsold
      purchased_at: null, // Ensure lead is unsold
      // Buy-now-only: no auctions
      auction_enabled: false,
    };

    // Calculate and store lead price based on urgency
    const urgency = leadData.urgency_level || "warm";
    const leadPrice = getLeadPriceFromUrgency(urgency);
    leadData.lead_price = leadPrice;
    // Also set buy_now_price_cents for backward compatibility with Stripe
    leadData.buy_now_price_cents = leadPrice * 100;

    // Geocode location to get latitude/longitude for distance filtering
    if (leadData.city && leadData.province) {
      console.log(`📍 Attempting to geocode lead location: ${leadData.city}, ${leadData.province}`);
      try {
        const { geocodeLocation } = await import("@/lib/geocoding");
        const geocodeResult = await geocodeLocation(leadData.city, leadData.province);
        if (geocodeResult && geocodeResult.latitude && geocodeResult.longitude) {
          leadData.latitude = geocodeResult.latitude;
          leadData.longitude = geocodeResult.longitude;
          console.log(`✅ Geocoded lead: ${leadData.city}, ${leadData.province} → ${geocodeResult.latitude}, ${geocodeResult.longitude}`);
        } else {
          console.warn(`⚠️ Geocoding returned no coordinates for ${leadData.city}, ${leadData.province}`, {
            geocodeResult,
            hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          });
        }
      } catch (geocodeError: any) {
        console.error("❌ Geocoding error (non-fatal):", {
          error: geocodeError,
          message: geocodeError?.message,
          city: leadData.city,
          province: leadData.province,
          hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        });
        // Continue without coordinates - lead will still be created
      }
    } else {
      console.warn(`⚠️ Cannot geocode lead - missing city or province: city=${leadData.city}, province=${leadData.province}`);
    }

    // Clean payload: remove null/undefined/empty
    const cleanPayload: any = {};
    for (const [key, value] of Object.entries(leadData)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanPayload[key] = value;
      }
    }

    // List of new optional fields that might not exist in database yet
    const optionalNewFields = ['remains_disposition', 'service_celebration', 'family_pre_arranged', 'planning_for_name', 'planning_for_age'];
    
    // Create payload without optional new fields first (in case migration hasn't run)
    const safePayload: any = {};
    for (const [key, value] of Object.entries(cleanPayload)) {
      if (!optionalNewFields.includes(key)) {
        safePayload[key] = value;
      }
    }

    console.log("Questionnaire API: Inserting lead", {
      email: cleanPayload.email,
      city: cleanPayload.city,
      keys: Object.keys(safePayload),
      hasNewFields: optionalNewFields.some(f => cleanPayload[f]),
    });

    // Try inserting with all fields first
    let insertResult = await supabaseAdmin
      .from("leads")
      .insert(cleanPayload)
      .select()
      .single();

    // If insert fails with PGRST204 (missing column), retry without new optional fields
    if (insertResult.error && (insertResult.error.code === 'PGRST204' || insertResult.error.message?.includes("Could not find"))) {
      console.log("Database columns for new fields don't exist yet, retrying without them. Please run migration: supabase/migrations/add_new_questionnaire_fields.sql");
      insertResult = await supabaseAdmin
        .from("leads")
        .insert(safePayload)
        .select()
        .single();
      
      // Log a warning that migration should be run
      if (!insertResult.error) {
        console.warn("Lead created successfully but new fields (remains_disposition, service_celebration, family_pre_arranged, planning_for_name, planning_for_age) were not saved. Please run migration to enable these fields.");
      }
    }

    const { data, error: insertError } = insertResult;

    if (insertError) {
      console.error("Questionnaire DB error", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        leadData: cleanPayload,
        fullError: insertError,
      });

      // Handle specific error codes
      if (insertError.code === "42703" || insertError.message?.includes("column")) {
        const errorDetails = `Missing database column. Error: ${insertError.message || insertError.details || "Unknown column error"}. Please run the migration: supabase/migrations/add_questionnaire_fields.sql`;
        console.error("Database column error:", errorDetails);
        return NextResponse.json(
          {
            error: "Database configuration error. Please contact support.",
            details: errorDetails,
            code: insertError.code,
            hint: insertError.hint,
          },
          { status: 500 }
        );
      }

      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            error: "This email address is already registered. Please use a different email.",
            details: insertError.message,
          },
          { status: 409 }
        );
      }

      // Generic database error
      return NextResponse.json(
        {
          error: "Database configuration error. Please contact support.",
          details: insertError.message || String(insertError),
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.error("No data returned from insert, but no error either");
      return NextResponse.json(
        {
          error: "Database configuration error. Please contact support.",
          details: "Insert succeeded but no data returned",
        },
        { status: 500 }
      );
    }

    console.log("Questionnaire API: Lead created successfully", {
      leadId: data.id,
      email: data.email,
    });

    // Notify agents about the new lead (fire-and-forget to avoid timeouts)
    // Only notify if lead has location coordinates
    // NOTE: We don't await this to avoid blocking the response for large numbers of agents
    // The notification function handles rate limiting and will complete in the background
    console.log("📧 Checking if agent notifications should be sent", {
      leadId: data.id,
      city: data.city,
      province: data.province,
      hasLatitude: !!data.latitude,
      hasLongitude: !!data.longitude,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    
    if (data.latitude && data.longitude) {
      console.log("📧 Triggering agent notifications for new lead (async, non-blocking)", {
        leadId: data.id,
        city: data.city,
        province: data.province,
        latitude: data.latitude,
        longitude: data.longitude,
      });
      
      // Start notifications - wait longer to ensure all emails complete before response
      // Vercel functions can run up to 60 seconds (Pro) or 10 seconds (Hobby) after response
      const { notifyAgentsForLead } = await import("@/lib/notifyAgentsForLead");
      
      // For small batches (3 or fewer), wait for completion to ensure all emails are sent
      // For larger batches, start in background (they'll take longer anyway)
      console.log("📧 Starting agent notifications for lead", data.id);
      
      try {
        // Wait for notification function to complete (with timeout)
        // This ensures all emails are sent before the API response
        const notificationPromise = notifyAgentsForLead(data, supabaseAdmin);
        
        // Set a timeout of 5 seconds - if it takes longer, let it continue in background
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Notification timeout - continuing in background")), 5000)
        );
        
        await Promise.race([notificationPromise, timeoutPromise]).catch((err) => {
          // If timeout or error, log but don't fail
          if (err.message?.includes("timeout")) {
            console.log("📧 Notification function taking longer than 5 seconds, continuing in background");
          } else {
            console.error("❌ Error notifying agents (non-fatal):", err);
          }
        });
        
        console.log("✅ Agent notifications completed for lead", data.id);
      } catch (notifyError: any) {
        // Log errors but don't fail the lead creation
        console.error("❌ Error notifying agents (non-fatal):", notifyError);
        console.error("Error details:", {
          message: notifyError?.message,
          stack: notifyError?.stack,
          name: notifyError?.name,
          code: notifyError?.code,
        });
      }
    } else {
      console.warn("⚠️ Skipping agent notifications - lead has no location coordinates", {
        leadId: data.id,
        city: data.city,
        province: data.province,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }

    return NextResponse.json(
      {
        success: true,
        lead: data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    // Log the full error with all details
    const errorDetails = {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      cause: err?.cause,
      fullError: err,
    };
    console.error("Questionnaire POST error (catch block):", errorDetails);

    // Return detailed error response
    return NextResponse.json(
      {
        error: "Database configuration error. Please contact support.",
        details: err?.message || String(err),
        errorType: err?.name || "UnknownError",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

