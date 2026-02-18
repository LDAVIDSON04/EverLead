/**
 * One-off: set cached_lead_full_name for 4 specific appointments (Feb 2026).
 * Uses the same timezone and date logic as the schedule so it actually matches.
 * Call once as the logged-in agent (Bearer token), then refresh the schedule.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIXES: { date: string; hour: number; name: string }[] = [
  { date: "2026-02-16", hour: 10, name: "Lee Davidson" },
  { date: "2026-02-17", hour: 12, name: "Shawn Paul" },
  { date: "2026-02-19", hour: 9, name: "Simon Morrisey" },
  { date: "2026-02-20", hour: 10, name: "Nathan Getzlaf" },
];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = user.id;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata, agent_province")
      .eq("id", agentId)
      .single();

    let tz = "America/Vancouver";
    const meta = profile?.metadata as Record<string, unknown> | null;
    if (meta?.timezone && typeof meta.timezone === "string") tz = meta.timezone;
    else if (meta?.availability && typeof (meta.availability as Record<string, string>)?.timezone === "string") tz = (meta.availability as Record<string, string>).timezone;
    else if (profile?.agent_province) {
      const p = String(profile.agent_province).toUpperCase();
      if (p === "BC") tz = "America/Vancouver";
      else if (p === "AB") tz = "America/Edmonton";
      else if (p === "ON") tz = "America/Toronto";
    }

    const { data: appointments } = await supabaseAdmin
      .from("appointments")
      .select("id, confirmed_at, requested_date, cached_lead_full_name")
      .eq("agent_id", agentId)
      .in("status", ["pending", "confirmed", "completed", "booked", "no_show"])
      .not("confirmed_at", "is", null);

    if (!appointments?.length) {
      return NextResponse.json({ ok: true, updated: 0, message: "No appointments with confirmed_at found" });
    }

    let updated = 0;
    for (const fix of FIXES) {
      const targetStart = DateTime.fromObject(
        { year: 2026, month: 2, day: parseInt(fix.date.slice(8, 10), 10), hour: fix.hour, minute: 0 },
        { zone: tz }
      );
      const targetEnd = targetStart.plus({ minutes: 59 });
      const startUtc = targetStart.toUTC();
      const endUtc = targetEnd.toUTC();

      const match = appointments.find((apt: { confirmed_at: string | null }) => {
        if (!apt.confirmed_at) return false;
        const aptStart = DateTime.fromISO(apt.confirmed_at, { zone: "utc" });
        return !aptStart.invalid && aptStart >= startUtc && aptStart <= endUtc;
      });

      if (match) {
        const { error } = await supabaseAdmin
          .from("appointments")
          .update({ cached_lead_full_name: fix.name })
          .eq("id", (match as { id: string }).id);
        if (!error) updated++;
      }
    }

    return NextResponse.json({ ok: true, updated, message: `Set display name for ${updated} appointment(s). Refresh the schedule.` });
  } catch (e: unknown) {
    console.error("fix-schedule-names:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
