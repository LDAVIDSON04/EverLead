import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const metadata = (profile?.metadata || {}) as Record<string, unknown>;
    const dates = (metadata.outOfOfficeDates as string[]) || [];
    const validDates = dates.filter((d) => typeof d === "string" && DATE_REGEX.test(d));
    return NextResponse.json({ dates: validDates });
  } catch (err) {
    console.error("Error fetching out-of-office dates:", err);
    return NextResponse.json({ error: "Failed to load out-of-office dates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const raw = body.dates;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "dates must be an array" }, { status: 400 });
    }
    const dates = raw
      .filter((d) => typeof d === "string" && DATE_REGEX.test(d))
      .map((d) => d as string)
      .sort();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const existing = (profile?.metadata || {}) as Record<string, unknown>;
    const updated = { ...existing, outOfOfficeDates: dates };

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ metadata: updated })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error saving out-of-office dates:", updateError);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
    return NextResponse.json({ dates });
  } catch (err) {
    console.error("Error saving out-of-office dates:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
