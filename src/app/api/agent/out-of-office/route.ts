import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

export type OutOfOfficeEntry = {
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
};

function parseTime(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Today in YYYY-MM-DD (UTC). Out-of-office entries for dates before today are ignored. */
function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10);
}

function filterOutPastEntries(entries: OutOfOfficeEntry[], today: string): OutOfOfficeEntry[] {
  return entries.filter((e) => e.date >= today);
}

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
    const entries = (metadata.outOfOfficeEntries as OutOfOfficeEntry[]) || [];
    const legacyDates = (metadata.outOfOfficeDates as string[]) || [];

    let validEntries = entries.filter(
      (e) =>
        e &&
        typeof e.date === "string" &&
        DATE_REGEX.test(e.date) &&
        typeof e.allDay === "boolean" &&
        (e.allDay === true || (TIME_REGEX.test(e.startTime ?? "") && TIME_REGEX.test(e.endTime ?? "")))
    );

    const today = todayYYYYMMDD();
    const beforePastFilter = validEntries;
    validEntries = filterOutPastEntries(validEntries, today);
    const hadPast = beforePastFilter.length > validEntries.length;

    if (validEntries.length > 0) {
      const dates = [...new Set(validEntries.map((e) => e.date))].sort();
      if (hadPast) {
        const existing = (profile?.metadata || {}) as Record<string, unknown>;
        const updated = { ...existing, outOfOfficeEntries: validEntries, outOfOfficeDates: dates };
        await supabaseAdmin.from("profiles").update({ metadata: updated }).eq("id", user.id);
      }
      return NextResponse.json({ dates, entries: validEntries });
    }

    const validDates = legacyDates.filter((d) => typeof d === "string" && DATE_REGEX.test(d));
    const legacyEntries: OutOfOfficeEntry[] = validDates.map((d) => ({ date: d, allDay: true }));
    const futureLegacyEntries = filterOutPastEntries(legacyEntries, today);
    const futureLegacyDates = futureLegacyEntries.map((e) => e.date);
    return NextResponse.json({ dates: futureLegacyDates, entries: futureLegacyEntries });
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

    if (Array.isArray(body.entries)) {
      const raw = body.entries as unknown[];
      const entries: OutOfOfficeEntry[] = [];
      for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const date = typeof o.date === "string" && DATE_REGEX.test(o.date) ? o.date : null;
        if (!date) continue;
        const allDay = o.allDay === true;
        if (allDay) {
          entries.push({ date, allDay: true });
          continue;
        }
        const startTime = typeof o.startTime === "string" && TIME_REGEX.test(o.startTime) ? o.startTime : "09:00";
        const endTime = typeof o.endTime === "string" && TIME_REGEX.test(o.endTime) ? o.endTime : "17:00";
        const startM = parseTime(startTime);
        const endM = parseTime(endTime);
        if (startM >= endM) continue;
        entries.push({ date, allDay: false, startTime, endTime });
      }
      const today = todayYYYYMMDD();
      const futureEntries = filterOutPastEntries(entries, today);
      const dates = [...new Set(futureEntries.map((e) => e.date))].sort();

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("metadata")
        .eq("id", user.id)
        .maybeSingle();

      const existing = (profile?.metadata || {}) as Record<string, unknown>;
      const updated = { ...existing, outOfOfficeEntries: futureEntries, outOfOfficeDates: dates };

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ metadata: updated })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error saving out-of-office entries:", updateError);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
      }
      return NextResponse.json({ dates, entries: futureEntries });
    }

    const raw = body.dates;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "dates or entries must be provided" }, { status: 400 });
    }
    const today = todayYYYYMMDD();
    const dates = raw
      .filter((d) => typeof d === "string" && DATE_REGEX.test(d))
      .map((d) => d as string)
      .filter((d) => d >= today)
      .sort();

    const entries: OutOfOfficeEntry[] = dates.map((d) => ({ date: d, allDay: true }));

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const existing = (profile?.metadata || {}) as Record<string, unknown>;
    const updated = { ...existing, outOfOfficeEntries: entries, outOfOfficeDates: dates };

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ metadata: updated })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error saving out-of-office dates:", updateError);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
    return NextResponse.json({ dates, entries });
  } catch (err) {
    console.error("Error saving out-of-office dates:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
