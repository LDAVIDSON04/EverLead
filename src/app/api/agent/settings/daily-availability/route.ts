// API endpoint for daily availability (one-time date-specific availability)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

// GET: Fetch daily availability for a location within a date range
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
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

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    if (!location || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: location, startDate, endDate" },
        { status: 400 }
      );
    }

    // Normalize location to match availability API (remove "Office" suffix and province)
    const normalizeLocation = (loc: string): string => {
      let normalized = loc.split(',').map(s => s.trim())[0];
      normalized = normalized.replace(/\s+office$/i, '').trim();
      return normalized;
    };

    const normalizedLocation = normalizeLocation(location);

    // Fetch daily availability from database
    const { data: dailyAvailability, error } = await supabaseAdmin
      .from("daily_availability")
      .select("*")
      .eq("specialist_id", user.id)
      .eq("location", normalizedLocation)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching daily availability:", error);
      return NextResponse.json(
        { error: "Failed to fetch daily availability" },
        { status: 500 }
      );
    }

    return NextResponse.json(dailyAvailability || []);
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/daily-availability:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Create or update daily availability
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
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

    const body = await request.json();
    const { location, date, startTime, endTime } = body;

    if (!location || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: location, date, startTime, endTime" },
        { status: 400 }
      );
    }

    // Normalize location to match availability API (remove "Office" suffix and province)
    const normalizeLocation = (loc: string): string => {
      let normalized = loc.split(',').map(s => s.trim())[0];
      normalized = normalized.replace(/\s+office$/i, '').trim();
      return normalized;
    };

    const normalizedLocation = normalizeLocation(location);

    // Upsert daily availability (using unique constraint on specialist_id, location, date)
    const { data, error } = await supabaseAdmin
      .from("daily_availability")
      .upsert(
        {
          specialist_id: user.id,
          location: normalizedLocation,
          date,
          start_time: startTime,
          end_time: endTime,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "specialist_id,location,date",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving daily availability:", error);
      return NextResponse.json(
        { error: "Failed to save daily availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/daily-availability:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove daily availability for a specific date
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
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

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const date = searchParams.get("date");

    if (!location || !date) {
      return NextResponse.json(
        { error: "Missing required parameters: location, date" },
        { status: 400 }
      );
    }

    // Normalize location to match availability API (remove "Office" suffix and province)
    const normalizeLocation = (loc: string): string => {
      let normalized = loc.split(',').map(s => s.trim())[0];
      normalized = normalized.replace(/\s+office$/i, '').trim();
      return normalized;
    };

    const normalizedLocation = normalizeLocation(location);

    const { error } = await supabaseAdmin
      .from("daily_availability")
      .delete()
      .eq("specialist_id", user.id)
      .eq("location", normalizedLocation)
      .eq("date", date);

    if (error) {
      console.error("Error deleting daily availability:", error);
      return NextResponse.json(
        { error: "Failed to delete daily availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/agent/settings/daily-availability:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

