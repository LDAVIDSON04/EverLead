// src/app/api/agent/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type AgentDashboardData = {
  stats: {
    availableLeads: number;
    myLeads: number;
    purchasedThisMonth: number;
    totalSpentCents: number;
    newLeadsNeedingAttention: number;
  };
  recentLeads: {
    id: string;
    created_at: string;
    city: string | null;
    province: string | null;
    urgency_level: string | null;
    service_type: string | null;
    status: string | null;
    agent_status: string | null;
  }[];
  yourBids: {
    lead_id: string;
    lead_city: string | null;
    lead_urgency: string | null;
    amount: number;
    is_highest: boolean;
    auction_ends_at: string | null;
  }[];
  pendingAuctions: {
    lead_id: string;
    lead_city: string | null;
    lead_urgency: string | null;
    current_bid_amount: number | null;
    buy_now_price: number | null;
    auction_ends_at: string | null;
    is_highest_bidder: boolean;
  }[];
};

export async function GET(request: NextRequest) {
  try {
    // Get agentId from query parameter (client will send it after getting user)
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.role !== "agent") {
      return NextResponse.json(
        { error: "Not an agent account" },
        { status: 403 }
      );
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    const nowISO = new Date().toISOString();

    // 1. Stats: Available leads
    const { count: availableCount } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    // 2. Stats: My leads
    const { count: myLeadsCount } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_agent_id", agentId);

    // 3. Stats: Purchased this month
    const { count: purchasedThisMonthCount } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_agent_id", agentId)
      .eq("status", "purchased_by_agent")
      .gte("created_at", thirtyDaysAgoISO);

    // 4. Stats: Total spent
    const { data: purchasedLeads } = await supabaseAdmin
      .from("leads")
      .select("price_charged_cents")
      .eq("assigned_agent_id", agentId)
      .eq("status", "purchased_by_agent");

    const totalSpentCents =
      purchasedLeads?.reduce(
        (sum, lead) => sum + (lead.price_charged_cents || 0),
        0
      ) || 0;

    // 5. Stats: New leads needing attention
    const { count: newLeadsCount } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("assigned_agent_id", agentId)
      .ilike("agent_status", "new");

    // 6. Recent leads (last 5)
    const { data: recentLeadsData } = await supabaseAdmin
      .from("leads")
      .select(
        "id, created_at, city, province, urgency_level, service_type, status, agent_status"
      )
      .eq("assigned_agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(5);

    // 7. Your bids
    // Get all bids from this agent
    const { data: bidsData } = await supabaseAdmin
      .from("lead_bids")
      .select("lead_id, amount, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(50); // Get more to find distinct leads

    // Group by lead_id to get highest bid per lead
    const leadBidMap: Record<string, number> = {};
    bidsData?.forEach((bid) => {
      const lid = bid.lead_id as string;
      const amount = bid.amount as number;
      if (!leadBidMap[lid] || amount > leadBidMap[lid]) {
        leadBidMap[lid] = amount;
      }
    });

    const yourBidLeadIds = Object.keys(leadBidMap).slice(0, 10);

    let yourBidsList: AgentDashboardData["yourBids"] = [];

    if (yourBidLeadIds.length > 0) {
      // Fetch lead info for these bids (only active auctions)
      const { data: bidLeadsData } = await supabaseAdmin
        .from("leads")
        .select(
          "id, city, urgency_level, current_bid_agent_id, auction_ends_at, auction_enabled, status"
        )
        .in("id", yourBidLeadIds)
        .eq("auction_enabled", true)
        .gt("auction_ends_at", nowISO)
        .neq("status", "purchased_by_agent");

      yourBidsList = (bidLeadsData || []).map((lead) => ({
        lead_id: lead.id,
        lead_city: lead.city || null,
        lead_urgency: lead.urgency_level || null,
        amount: leadBidMap[lead.id],
        is_highest: lead.current_bid_agent_id === agentId,
        auction_ends_at: lead.auction_ends_at || null,
      }));

      // Sort by auction_ends_at (soonest first)
      yourBidsList.sort((a, b) => {
        if (!a.auction_ends_at) return 1;
        if (!b.auction_ends_at) return -1;
        return (
          new Date(a.auction_ends_at).getTime() -
          new Date(b.auction_ends_at).getTime()
        );
      });
    }

    // 8. Pending auctions
    // Get auctions where this agent is involved (either highest bidder or has placed a bid)
    const { data: allPendingAuctions } = await supabaseAdmin
      .from("leads")
      .select("id, city, urgency_level, current_bid_amount, buy_now_price, auction_ends_at, current_bid_agent_id")
      .eq("auction_enabled", true)
      .gt("auction_ends_at", nowISO)
      .neq("status", "purchased_by_agent")
      .order("auction_ends_at", { ascending: true })
      .limit(20);

    // Filter to only auctions where this agent is involved
    const agentBidLeadIds = new Set(yourBidLeadIds);
    const pendingAuctionsList: AgentDashboardData["pendingAuctions"] = (
      allPendingAuctions || []
    )
      .filter(
        (auction) =>
          auction.current_bid_agent_id === agentId ||
          agentBidLeadIds.has(auction.id)
      )
      .slice(0, 5)
      .map((auction) => ({
        lead_id: auction.id,
        lead_city: auction.city || null,
        lead_urgency: auction.urgency_level || null,
        current_bid_amount: auction.current_bid_amount || null,
        buy_now_price: auction.buy_now_price || null,
        auction_ends_at: auction.auction_ends_at || null,
        is_highest_bidder: auction.current_bid_agent_id === agentId,
      }));

    const response: AgentDashboardData = {
      stats: {
        availableLeads: availableCount ?? 0,
        myLeads: myLeadsCount ?? 0,
        purchasedThisMonth: purchasedThisMonthCount ?? 0,
        totalSpentCents: totalSpentCents,
        newLeadsNeedingAttention: newLeadsCount ?? 0,
      },
      recentLeads: (recentLeadsData || []).map((lead) => ({
        id: lead.id,
        created_at: lead.created_at || "",
        city: lead.city || null,
        province: lead.province || null,
        urgency_level: lead.urgency_level || null,
        service_type: lead.service_type || null,
        status: lead.status || null,
        agent_status: lead.agent_status || null,
      })),
      yourBids: yourBidsList,
      pendingAuctions: pendingAuctionsList,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error loading agent dashboard:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

