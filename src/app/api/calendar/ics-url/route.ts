// src/app/api/calendar/ics-url/route.ts
// GET: Return ICS URL for a specialist

import { NextRequest, NextResponse } from "next/server";
import { ensureIcsConnectionForSpecialist } from "@/lib/calendarConnections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");

    if (!specialistId) {
      return NextResponse.json(
        { error: "specialistId parameter is required" },
        { status: 400 }
      );
    }

    const icsUrl = await ensureIcsConnectionForSpecialist(specialistId);

    return NextResponse.json({ url: icsUrl });
  } catch (error: any) {
    console.error("Error in GET /api/calendar/ics-url:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

