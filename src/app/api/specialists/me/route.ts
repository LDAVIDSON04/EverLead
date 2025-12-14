// src/app/api/specialists/me/route.ts
// GET: Return current user's specialist record
// POST: Create or update specialist record for current user

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSpecialistSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  location_city: z.string().optional(),
  location_region: z.string().optional(),
  timezone: z.string().default("America/Edmonton"),
  certification_details: z.string().optional(),
});

// GET /api/specialists/me - Get current user's specialist record
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("authorization");
    
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

    const userId = user.id;

    // Fetch specialist record
    const { data: specialist, error: specialistError } = await supabaseServer
      .from("specialists")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (specialistError) {
      console.error("Error fetching specialist:", specialistError);
      return NextResponse.json(
        { error: "Failed to fetch specialist record" },
        { status: 500 }
      );
    }

    return NextResponse.json(specialist || null);
  } catch (error: any) {
    console.error("Error in GET /api/specialists/me:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/specialists/me - Create or update specialist record
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("authorization");
    
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

    const userId = user.id;

    // Parse and validate request body
    const body = await req.json();
    const validation = updateSpecialistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if specialist record already exists
    const { data: existingSpecialist, error: checkError } = await supabaseServer
      .from("specialists")
      .select("id, status")
      .eq("id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing specialist:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing specialist record" },
        { status: 500 }
      );
    }

    // Prepare data for insert/update
    const specialistData = {
      id: userId,
      display_name: data.display_name,
      bio: data.bio || null,
      location_city: data.location_city || null,
      location_region: data.location_region || null,
      timezone: data.timezone || "America/Edmonton",
      certification_details: data.certification_details || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingSpecialist) {
      // Update existing record
      // Only update status to 'pending' if it's not already 'approved' or 'rejected'
      // (Don't overwrite approved/rejected status)
      const updateData: any = {
        ...specialistData,
        updated_at: new Date().toISOString(),
      };

      // If status is not approved/rejected, set to pending and deactivate
      if (existingSpecialist.status !== "approved" && existingSpecialist.status !== "rejected") {
        updateData.status = "pending";
        updateData.is_active = false;
      }

      const { data: updated, error: updateError } = await supabaseServer
        .from("specialists")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating specialist:", updateError);
        return NextResponse.json(
          { error: "Failed to update specialist record" },
          { status: 500 }
        );
      }

      result = updated;
    } else {
      // Create new record with status='pending' and is_active=false
      const { data: created, error: createError } = await supabaseServer
        .from("specialists")
        .insert({
          ...specialistData,
          status: "pending",
          is_active: false,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating specialist:", createError);
        return NextResponse.json(
          { error: "Failed to create specialist record" },
          { status: 500 }
        );
      }

      result = created;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in POST /api/specialists/me:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

