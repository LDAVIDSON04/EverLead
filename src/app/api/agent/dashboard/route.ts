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
    myAppointments: number;
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
  recentBids: {
    id: string;
    leadId: string;
    amount: number;
    createdAt: string;
    leadCity: string | null;
    leadUrgency: string | null;
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
  roi?: {
    totalAppointments: number;
    totalSpend: number;
    bookedAppointments: number;
    completedAppointments: number;
    avgCostPerAppointment: number;
    costPerBookedAppointment: number;
    costPerCompletedAppointment: number;
  };
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

    // Fetch all stats and data in parallel for maximum speed
    const [
      myLeadsResult,
      myAppointmentsResult,
      availableAppointmentsResult,
      purchasedThisMonthResult,
      purchasedAppointmentsResult,
      newAppointmentsResult,
      recentLeadsResult,
      recentBidsResult,
      allAppointmentsResult, // For ROI stats and total spent
    ] = await Promise.all([
      // 1. Stats: Total leads assigned to this agent
      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("assigned_agent_id", agentId),
      
      // 2. Stats: My appointments (assigned to this agent)
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId),
      
      // 3. Stats: Available appointments (pending, not hidden, not assigned)
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .is("agent_id", null),
      
      // 4. Stats: Purchased this month (appointments purchased in last 30 days)
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .gte("created_at", thirtyDaysAgoISO),
      
      // 5. Stats: Total spent on appointments (only need price_cents)
      supabaseAdmin
        .from("appointments")
        .select("price_cents")
        .eq("agent_id", agentId)
        .not("price_cents", "is", null),
      
      // 6. Stats: New appointments needing attention (booked but not completed/no-show)
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "booked"),
      
      // 7. Recent leads (last 5)
      supabaseAdmin
        .from("leads")
        .select("id, created_at, city, province, urgency_level, service_type, status, agent_status")
        .eq("assigned_agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // 8. Recent bids (last 5 bids, regardless of auction status)
      supabaseAdmin
        .from("lead_bids")
        .select("id, lead_id, amount, created_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(5),
      
      // All appointments for ROI stats (can be optimized but needed for calculations)
      supabaseAdmin
        .from("appointments")
        .select("id, status, price_cents")
        .eq("agent_id", agentId),
    ]);

    const myLeadsCount = myLeadsResult.count ?? 0;
    const myAppointmentsCount = myAppointmentsResult.count ?? 0;
    const availableAppointmentsCount = availableAppointmentsResult.count ?? 0;
    const purchasedThisMonthCount = purchasedThisMonthResult.count ?? 0;
    const totalSpentCents = (purchasedAppointmentsResult.data || []).reduce(
      (sum: number, appt: any) => sum + (appt.price_cents || 0),
      0
    );
    const newAppointmentsCount = newAppointmentsResult.count ?? 0;
    const recentLeadsData = recentLeadsResult.data || [];
    const recentBidsData = recentBidsResult.data || [];
    const appointments = allAppointmentsResult.data || [];


    // 9. Process recent bids (fetch lead info if needed) and get your bids in parallel
    const recentBidsLeadIds = recentBidsData.map((bid: any) => bid.lead_id as string);

    // Fetch your bids and pending auctions in parallel (they're independent)
    const [recentBidLeadsResult, yourBidsResult, pendingAuctionsResult] = await Promise.all([
      // Lead info for recent bids (only if we have bids)
      recentBidsLeadIds.length > 0
        ? supabaseAdmin
            .from("leads")
            .select("id, city, urgency_level")
            .in("id", recentBidsLeadIds)
        : Promise.resolve({ data: [], error: null }),
      
      // 9. Your bids (active auction bids only)
      supabaseAdmin
        .from("lead_bids")
        .select("lead_id, amount, created_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(50),
      
      // 10. Pending auctions
      supabaseAdmin
        .from("leads")
        .select("id, city, urgency_level, current_bid_amount, buy_now_price, auction_end_time, auction_status, current_bid_agent_id")
        .eq("auction_enabled", true)
        .in("auction_status", ["pending", "open"])
        .or("auction_end_time.gt." + nowISO + ",auction_end_time.is.null")
        .neq("status", "purchased_by_agent")
        .order("auction_end_time", { ascending: true })
        .limit(20),
    ]);

    // Process recent bids
    const leadMap = new Map(
      ((recentBidLeadsResult.data as any) || []).map((lead: any) => [lead.id, lead])
    );

    const recentBidsList: AgentDashboardData["recentBids"] = recentBidsData.map((bid: any) => {
      const lead: any = leadMap.get(bid.lead_id as string);
      return {
        id: bid.id,
        leadId: bid.lead_id as string,
        amount: bid.amount as number,
        createdAt: bid.created_at || "",
        leadCity: lead?.city || null,
        leadUrgency: lead?.urgency_level || null,
      };
    });

    // Process your bids
    const bidsData = (yourBidsResult.data as any) || [];
    const leadBidMap: Record<string, number> = {};
    bidsData.forEach((bid: any) => {
      const lid = bid.lead_id as string;
      const amount = bid.amount as number;
      if (!leadBidMap[lid] || amount > leadBidMap[lid]) {
        leadBidMap[lid] = amount;
      }
    });

    const yourBidLeadIds = Object.keys(leadBidMap).slice(0, 10);
    const allPendingAuctions = (pendingAuctionsResult.data as any) || [];

    let yourBidsList: AgentDashboardData["yourBids"] = [];

    if (yourBidLeadIds.length > 0) {
      // Fetch lead info for your bids (only active auctions)
      const { data: bidLeadsData } = await supabaseAdmin
        .from("leads")
        .select("id, city, urgency_level, current_bid_agent_id, auction_end_time, auction_enabled, status")
        .in("id", yourBidLeadIds)
        .eq("auction_enabled", true)
        .gt("auction_end_time", nowISO)
        .neq("status", "purchased_by_agent");

      yourBidsList = (bidLeadsData || []).map((lead: any) => ({
        lead_id: lead.id,
        lead_city: lead.city || null,
        lead_urgency: lead.urgency_level || null,
        amount: leadBidMap[lead.id],
        is_highest: lead.current_bid_agent_id === agentId,
        auction_ends_at: lead.auction_end_time || null,
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

    // Filter to only auctions where this agent is involved
    const agentBidLeadIds = new Set(yourBidLeadIds);
    const pendingAuctionsList: AgentDashboardData["pendingAuctions"] = (
      allPendingAuctions || []
    )
      .filter(
        (auction: any) =>
          auction.current_bid_agent_id === agentId ||
          agentBidLeadIds.has(auction.id)
      )
      .slice(0, 5)
      .map((auction: any) => ({
        lead_id: auction.id,
        lead_city: auction.city || null,
        lead_urgency: auction.urgency_level || null,
        current_bid_amount: auction.current_bid_amount || null,
        buy_now_price: auction.buy_now_price || null,
        auction_ends_at: auction.auction_end_time || null,
        is_highest_bidder: auction.current_bid_agent_id === agentId,
      }));

    // Calculate appointment ROI stats (using appointments already fetched above)
    const totalAppointments = appointments.length;
    const bookedAppointments = appointments.filter((a: any) => a.status === "booked").length;
    const completedAppointments = appointments.filter((a: any) => a.status === "completed").length;
    const totalSpend = appointments.reduce((sum: number, a: any) => sum + (a.price_cents || 0), 0);
    const avgCostPerAppointment = totalAppointments > 0 ? totalSpend / totalAppointments : 0;
    const costPerBookedAppointment = bookedAppointments > 0 ? totalSpend / bookedAppointments : 0;
    const costPerCompletedAppointment = completedAppointments > 0 ? totalSpend / completedAppointments : 0;

        const response: AgentDashboardData = {
          stats: {
            availableLeads: availableAppointmentsCount ?? 0,
            myLeads: myLeadsCount ?? 0, // Total leads assigned to agent
            purchasedThisMonth: purchasedThisMonthCount ?? 0,
            totalSpentCents: totalSpentCents,
            newLeadsNeedingAttention: newAppointmentsCount ?? 0,
            myAppointments: myAppointmentsCount ?? 0, // Total appointments for agent
          },
      recentLeads: (recentLeadsData || []).map((lead: any) => ({
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
      recentBids: recentBidsList,
      pendingAuctions: pendingAuctionsList,
      roi: {
        totalAppointments,
        totalSpend: totalSpend / 100, // Convert to dollars
        bookedAppointments,
        completedAppointments,
        avgCostPerAppointment: avgCostPerAppointment / 100,
        costPerBookedAppointment: costPerBookedAppointment / 100,
        costPerCompletedAppointment: costPerCompletedAppointment / 100,
      },
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

