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
  auction_status: 'open' | 'closed' | 'pending' | null;
  winning_agent_id: string | null;
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
          "auction_status",
          "winning_agent_id",
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
    
    // Debug: log all unique status values
    const statusValues = new Set(allLeads.map(l => l.status).filter(Boolean));
    console.log("All unique lead statuses in DB:", Array.from(statusValues));
    
    // Filter for purchased leads - check multiple possible status values and auction_status
    const purchasedLeads = allLeads.filter((l) => {
      const status = (l.status || "").toLowerCase();
      const auctionStatus = l.auction_status;
      
      // Check auction_status first (new system)
      // Closed auctions with winners are considered purchased
      if (auctionStatus === 'closed' && l.winning_agent_id) {
        return true;
      }
      
      // Fallback to old status-based check
      return status === "purchased_by_agent" || 
             status === "purchased" ||
             (l.assigned_agent_id && (l.price_charged_cents || 0) > 0);
    });
    
    console.log("Purchased leads found:", {
      total: purchasedLeads.length,
      withEmail: purchasedLeads.filter(l => l.purchased_by_email).length,
      withAssignedAgent: purchasedLeads.filter(l => l.assigned_agent_id).length,
      sampleStatuses: purchasedLeads.slice(0, 3).map(l => ({ status: l.status, hasEmail: !!l.purchased_by_email, hasAgentId: !!l.assigned_agent_id })),
    });
    
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

    // Top agents leaderboard - query purchased leads with agent emails
    // Use a direct query that joins leads to profiles to get emails
    const agentIds = Array.from(
      new Set(
        purchasedLeads
          .map((l) => l.assigned_agent_id)
          .filter((id): id is string => !!id)
      )
    );

    // Fetch all agent profiles with emails
    let agentEmailMap: Record<string, string> = {};
    if (agentIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", agentIds);

      if (profilesError) {
        console.error("Error fetching agent profiles:", profilesError);
      } else if (profilesData) {
        console.log("Profiles fetched:", profilesData.length, "profiles");
        for (const profile of profilesData) {
          if (profile.email) {
            agentEmailMap[profile.id] = profile.email;
          } else {
            console.warn("Profile missing email:", profile.id);
          }
        }
      } else {
        console.warn("No profiles data returned for agent IDs:", agentIds);
      }

      // Fallback: Try to get emails from auth.users for profiles without emails
      const profilesWithoutEmail = profilesData?.filter((p: { id: string; email: string | null }) => !p.email) || [];
      if (profilesWithoutEmail.length > 0) {
        console.log("Attempting to fetch emails from auth.users for", profilesWithoutEmail.length, "profiles");
        // Note: Supabase admin client can access auth.users
        // We'll try using RPC or direct auth query if available
        // For now, we'll rely on purchased_by_email which should be set on new purchases
      }
    }

    console.log("Agent email mapping:", {
      agentIdsCount: agentIds.length,
      emailsFound: Object.keys(agentEmailMap).length,
      emailMap: agentEmailMap,
    });

    // Aggregate by email (prioritize purchased_by_email, fallback to profile email)
    const statsMap = new Map<
      string,
      { email: string; allTime: number; last30: number; revenue: number }
    >();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    console.log("Processing purchased leads for leaderboard:", {
      totalPurchased: purchasedLeads.length,
      agentIdsCount: agentIds.length,
      profilesFound: Object.keys(agentEmailMap).length,
    });

    for (const lead of purchasedLeads) {
      // Priority: 1) purchased_by_email, 2) profile email from assigned_agent_id
      let email: string | null = lead.purchased_by_email;
      
      if (!email && lead.assigned_agent_id) {
        email = agentEmailMap[lead.assigned_agent_id] || null;
      }

      if (!email) {
        console.warn("Lead purchased but no email found:", {
          leadId: lead.id,
          assigned_agent_id: lead.assigned_agent_id,
          purchased_by_email: lead.purchased_by_email,
          inEmailMap: lead.assigned_agent_id ? agentEmailMap[lead.assigned_agent_id] : "N/A",
        });
        continue; // Skip leads without email
      }

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

    console.log("Leaderboard stats calculated:", {
      uniqueEmails: statsMap.size,
      stats: Array.from(statsMap.values()),
    });

    // Sort by total spent (revenue) descending, then by purchased count
    const topAgents = Array.from(statsMap.values())
      .sort((a, b) => {
        // Primary sort: by revenue (total spent)
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
        // Secondary sort: by purchased count
        return b.allTime - a.allTime;
      })
      .slice(0, 10) // Show top 10
      .map((stat) => ({
        agentId: stat.email, // Use email as ID for compatibility
        email: stat.email,
        purchasedCount: stat.allTime,
        purchasedCountLast30: stat.last30,
        revenue: stat.revenue,
      }));

    console.log("Top agents final (showing emails):", topAgents);

    // Count total agents signed up (from profiles table)
    const { count: totalAgentsCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "agent");

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
        totalAgentsCount: totalAgentsCount ?? 0,
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

