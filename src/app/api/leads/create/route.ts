// src/app/api/leads/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateAuctionTiming } from "@/lib/auctions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
      hasAge: !!body.age,
      keys: Object.keys(body),
    });

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "address_line1",
      "city",
      "province",
      "postal_code",
      "age",
      "sex",
      "timeline_intent",
      "service_type",
      "planning_for",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
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

    // Validate age
    const age = Number(body.age);
    if (isNaN(age) || age < 18 || age > 120) {
      return NextResponse.json(
        {
          error: "Invalid age",
          details: "Age must be between 18 and 120",
        },
        { status: 400 }
      );
    }

    // Build insert payload
    // IMPORTANT: Ensure new leads are unsold and available
    const leadData: any = {
      first_name: String(body.first_name).trim(),
      last_name: String(body.last_name).trim(),
      full_name: `${body.first_name} ${body.last_name}`.trim(),
      email: String(body.email).trim(),
      phone: String(body.phone).trim(),
      address_line1: String(body.address_line1).trim(),
      city: String(body.city).trim(),
      province: String(body.province).trim(),
      postal_code: String(body.postal_code).trim(),
      age: age,
      sex: String(body.sex).trim(),
      planning_for: String(body.planning_for).trim(),
      service_type: String(body.service_type).trim(),
      timeline_intent: String(body.timeline_intent).trim(),
      urgency_level: body.urgency_level || "warm",
      additional_notes: body.additional_notes ? String(body.additional_notes).trim() : null,
      // Explicitly set status to "new" and ensure lead is unsold
      status: "new",
      assigned_agent_id: null, // Ensure lead is unsold
      purchased_at: null, // Ensure lead is unsold
      // Enable auction on every lead by default
      auction_enabled: body.auction_enabled !== undefined ? body.auction_enabled : true,
    };

    // Calculate auction timing if auction is enabled
    if (leadData.auction_enabled) {
      const auctionTiming = calculateAuctionTiming(new Date());
      
      leadData.auction_status = auctionTiming.auction_status;
      leadData.auction_start_time = auctionTiming.auction_start_time;
      leadData.auction_end_time = auctionTiming.auction_end_time;
      leadData.after_hours_release_time = auctionTiming.after_hours_release_time;
      
      // Set default auction values
      leadData.starting_bid = 10;
      leadData.min_increment = 5;
      leadData.buy_now_price = 50;
      // Also set buy_now_price_cents for backward compatibility
      leadData.buy_now_price_cents = 5000; // $50
    }

    // Clean payload: remove null/undefined/empty
    const cleanPayload: any = {};
    for (const [key, value] of Object.entries(leadData)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanPayload[key] = value;
      }
    }

    console.log("Questionnaire API: Inserting lead", {
      email: cleanPayload.email,
      city: cleanPayload.city,
      keys: Object.keys(cleanPayload),
    });

    // Insert into database using admin client (bypasses RLS)
    const { data, error: insertError } = await supabaseAdmin
      .from("leads")
      .insert(cleanPayload)
      .select()
      .single();

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

