// src/app/api/ics/[specialistId]/route.ts
// ICS feed endpoint for calendar subscriptions (Apple Calendar, etc.)
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildIcsFeed } from "@/lib/ics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { specialistId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const { specialistId } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Token parameter is required" },
        { status: 400 }
      );
    }

    // Validate calendar connection
    const { data: connection, error: connectionError } = await supabaseServer
      .from("calendar_connections")
      .select("*")
      .eq("specialist_id", specialistId)
      .eq("provider", "ics")
      .eq("ics_secret", token)
      .eq("sync_enabled", true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Invalid or inactive calendar connection" },
        { status: 403 }
      );
    }

    // Load upcoming confirmed appointments (next 6 months)
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

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
      .eq("specialist_id", specialistId)
      .eq("status", "confirmed")
      .gte("starts_at", now.toISOString())
      .lte("starts_at", sixMonthsLater.toISOString())
      .order("starts_at", { ascending: true });

    if (appointmentsError) {
      console.error("Error loading appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to load appointments" },
        { status: 500 }
      );
    }

    // Generate ICS feed
    const icsContent = buildIcsFeed(specialistId, appointments || []);

    // Return as text/calendar
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="soradin-appointments-${specialistId}.ics"`,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/ics/[specialistId]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

