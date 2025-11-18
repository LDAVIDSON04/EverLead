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
  purchased_by_email: string | null;
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
          "purchased_by_email",
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

    // Top agents ranking by number of purchased leads, grouped by email
    // Aggregate by purchased_by_email (ignoring nulls)
    const statsMap = new Map<
      string,
      { email: string; allTime: number; last30: number; revenue: number }
    >();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    for (const lead of purchasedLeads) {
      const email = lead.purchased_by_email;
      if (!email) continue; // Skip leads without email

      const createdAt = new Date(lead.created_at);

      if (!statsMap.has(email)) {
        statsMap.set(email, { email, allTime: 0, last30: 0, revenue: 0 });
      }

      const stat = statsMap.get(email)!;
      stat.allTime += 1;
      if (lead.created_at >= thirtyDaysAgoISO) {
        stat.last30 += 1;
      }
      stat.revenue += lead.price_charged_cents ?? 0;
    }

    const topAgents = Array.from(statsMap.values())
      .sort((a, b) => b.allTime - a.allTime)
      .slice(0, 5)
      .map((stat) => ({
        agentId: stat.email, // Use email as ID for compatibility
        email: stat.email,
        purchasedCount: stat.allTime,
        purchasedCountLast30: stat.last30,
        revenue: stat.revenue,
      }));

    // Geographic aggregation
    type GeoStat = {
      city: string | null;
      province: string | null;
      totalLeads: number;
      soldLeads: number;
      totalRevenueCents: number;
    };

    const geoMap = new Map<string, GeoStat>();

    for (const lead of allLeads) {
      const city = lead.city ?? "";
      const province = lead.province ?? "";
      const key = `${city}__${province}`;

      const isSold = lead.price_charged_cents && lead.price_charged_cents > 0;

      if (!geoMap.has(key)) {
        geoMap.set(key, {
          city: city || null,
          province: province || null,
          totalLeads: 0,
          soldLeads: 0,
          totalRevenueCents: 0,
        });
      }

      const stat = geoMap.get(key)!;
      stat.totalLeads += 1;
      if (isSold) {
        stat.soldLeads += 1;
        stat.totalRevenueCents += lead.price_charged_cents ?? 0;
      }
    }

    const geography = Array.from(geoMap.values()).sort(
      (a, b) => b.totalLeads - a.totalLeads
    );

    return NextResponse.json(
      {
        ok: true,
        totalLeads,
        totalPurchased,
        totalRevenueCents,
        leadsLast7Days,
        urgencyCounts,
        topAgents,
        geography,
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

