import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type MarketplaceContactRequestRow = {
  id: string;
  created_at: string;
  agent_id: string;
  agent_name: string | null;
  channel: string;
  source: string;
};

/**
 * Admin-only: list recent marketplace contact events (contact-only listings).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  const limit = Math.min(500, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "200", 10) || 200));

  const { data: events, error: evErr } = await supabaseAdmin
    .from("marketplace_contact_request_events")
    .select("id, created_at, agent_id, channel, source")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (evErr) {
    console.error("[admin/marketplace-contact-requests]", evErr);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const agentIds = Array.from(new Set((events || []).map((e: { agent_id: string }) => e.agent_id)));
  let nameById: Record<string, string | null> = {};
  if (agentIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", agentIds);
    (profiles || []).forEach((p: { id: string; full_name: string | null }) => {
      nameById[p.id] = p.full_name ?? null;
    });
  }

  const rows: MarketplaceContactRequestRow[] = (events || []).map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    agent_id: e.agent_id,
    agent_name: nameById[e.agent_id] ?? null,
    channel: e.channel,
    source: e.source,
  }));

  const countHead = { count: "exact" as const, head: true as const };
  const [
    { count: totalAll },
    { count: reveal },
    { count: phone },
    { count: email },
  ] = await Promise.all([
    supabaseAdmin.from("marketplace_contact_request_events").select("id", countHead),
    supabaseAdmin.from("marketplace_contact_request_events").select("id", countHead).eq("channel", "reveal"),
    supabaseAdmin.from("marketplace_contact_request_events").select("id", countHead).eq("channel", "phone"),
    supabaseAdmin.from("marketplace_contact_request_events").select("id", countHead).eq("channel", "email"),
  ]);

  const summary = {
    total: totalAll ?? 0,
    reveal: reveal ?? 0,
    phone: phone ?? 0,
    email: email ?? 0,
  };

  return NextResponse.json({ events: rows, summary });
}
