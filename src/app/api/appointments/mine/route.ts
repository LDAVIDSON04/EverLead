// src/app/api/appointments/mine/route.ts
// GET: Return upcoming appointments for the current specialist

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    // Verify user is a specialist
    const { data: specialist, error: specialistError } = await supabaseServer
      .from("specialists")
      .select("id, status, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (specialistError) {
      console.error("Error fetching specialist:", specialistError);
      return NextResponse.json(
        { error: "Failed to verify specialist" },
        { status: 500 }
      );
    }

    if (!specialist) {
      return NextResponse.json(
        { error: "Specialist record not found" },
        { status: 404 }
      );
    }

    if (specialist.status !== "approved" || !specialist.is_active) {
      return NextResponse.json(
        { error: "Specialist account not approved or inactive" },
        { status: 403 }
      );
    }

    // Fetch upcoming appointments for this specialist
    const now = new Date().toISOString();
    const { data: appointments, error: appointmentsError } = await supabaseServer
      .from("appointments")
      .select(
        `
        id,
        starts_at,
        ends_at,
        status,
        families (
          full_name
        )
      `
      )
      .eq("specialist_id", userId)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    // Map appointments to handle families as array
    const mappedAppointments = (appointments || []).map((apt: any) => ({
      id: apt.id,
      starts_at: apt.starts_at,
      ends_at: apt.ends_at,
      status: apt.status,
      family_name: Array.isArray(apt.families) && apt.families.length > 0
        ? apt.families[0].full_name
        : apt.families?.full_name || "Client",
    }));

    return NextResponse.json(mappedAppointments);
  } catch (error: any) {
    console.error("Error in GET /api/appointments/mine:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

