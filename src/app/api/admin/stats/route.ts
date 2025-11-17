// src/app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  created_at: string;
  urgency_level: string | null;
  city: string | null;
  province: string | null;
  service_type: string | null;
  assigned_agent_id: string | null;
  status: string | null;
  price_charged_cents: number | null;
};

export async function GET(_req: NextRequest) {
  try {
    // 1) Get all leads (you don't have that many yet; this is fine for MVP)
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select(
        [
          "id",
          "created_at",
          "urgency_level",
          "city",
          "province",
          "service_type",
          "assigned_agent_id",
          "status",
          "price_charged_cents",
        ].join(", ")
      )
      .order("created_at", { ascending: false });

    if (leadsError) {
      console.error("admin stats: leadsError", leadsError);
      throw leadsError;
    }

    if (!leads) {
      throw new Error("No leads data returned");
    }

    const allLeads: LeadRow[] = leads as unknown as LeadRow[];

    const totalLeads = allLeads.length;
    const purchasedLeads = allLeads.filter((l) => l.status === "purchased_by_agent");
    const totalPurchased = purchasedLeads.length;

    const totalRevenueCents = purchasedLeads.reduce(
      (sum, l) => sum + (l.price_charged_cents ?? 0),
      0
    );

    // Leads created in last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const leadsLast7Days = allLeads.filter(
      (l) => l.created_at >= sevenDaysAgo
    ).length;

    // Basic urgency breakdown
    const urgencyCounts: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
    for (const lead of allLeads) {
      const u = (lead.urgency_level ?? "").toLowerCase();
      if (u === "hot") urgencyCounts.hot++;
      else if (u === "warm") urgencyCounts.warm++;
      else if (u === "cold") urgencyCounts.cold++;
    }

    // Very simple "top agents" ranking by number of purchased leads
    const agentPurchaseCounts: Record<string, number> = {};
    for (const lead of purchasedLeads) {
      if (!lead.assigned_agent_id) continue;
      agentPurchaseCounts[lead.assigned_agent_id] =
        (agentPurchaseCounts[lead.assigned_agent_id] ?? 0) + 1;
    }
    const topAgents = Object.entries(agentPurchaseCounts)
      .map(([agentId, count]) => ({ agentId, purchasedCount: count }))
      .sort((a, b) => b.purchasedCount - a.purchasedCount)
      .slice(0, 5);

    return NextResponse.json(
      {
        ok: true,
        totalLeads,
        totalPurchased,
        totalRevenueCents,
        leadsLast7Days,
        urgencyCounts,
        topAgents,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("admin stats: unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load admin stats" },
      { status: 500 }
    );
  }
}

