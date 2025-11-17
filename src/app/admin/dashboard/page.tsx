// src/app/admin/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type DashboardStats = {
  totalLeads: number;
  leadsThisWeek: number;
  purchasedLeads: number;
  totalRevenueCents: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  auctionEnabledCount: number;
  auctionWithBidsCount: number;
  soldViaBuyNow: number;
  soldViaAuction: number;
};

type TopAgent = {
  agent_id: string;
  agent_email: string | null;
  purchased_count_all_time: number;
  purchased_count_last_30_days: number;
};

type RecentLead = {
  id: string;
  created_at: string;
  city: string | null;
  province: string | null;
  urgency_level: string | null;
  status: string | null;
  agent_status: string | null;
  auction_enabled: boolean | null;
  price_charged_cents: number | null;
};

export default function AdminDashboardPage() {
  useRequireRole("admin");
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Get all leads
        const { data, error } = await supabaseClient
          .from("leads")
          .select(
            "urgency_level, status, agent_status, price_charged_cents, auction_enabled, current_bid_amount, assigned_agent_id, created_at, buy_now_price_cents"
          );

        if (error) {
          console.error(error);
          setError("Failed to load dashboard stats.");
          setLoading(false);
          return;
        }

        const leads = data || [];

        const totalLeads = leads.length;
        
        // Leads this week
        const leadsThisWeek = leads.filter(
          (l) => l.created_at && new Date(l.created_at) >= sevenDaysAgo
        ).length;

        // Purchased leads (sold)
        const purchasedLeads = leads.filter(
          (l) => l.status === "purchased_by_agent"
        ).length;

        // Revenue
        const totalRevenueCents = leads
          .filter((l) => l.status === "purchased_by_agent")
          .reduce((sum, l) => sum + (l.price_charged_cents || 0), 0);

        // Urgency breakdown
        const hotLeads = leads.filter((l) => l.urgency_level === "hot").length;
        const warmLeads = leads.filter(
          (l) => l.urgency_level === "warm"
        ).length;
        const coldLeads = leads.filter(
          (l) => l.urgency_level === "cold"
        ).length;

        // Auction stats
        const auctionEnabledCount = leads.filter(
          (l) => l.auction_enabled === true
        ).length;
        const auctionWithBidsCount = leads.filter(
          (l) => l.auction_enabled === true && l.current_bid_amount !== null
        ).length;

        // Sold via Buy Now vs Auction
        const purchasedLeadsList = leads.filter(
          (l) => l.status === "purchased_by_agent"
        );
        const soldViaBuyNow = purchasedLeadsList.filter(
          (l) => l.auction_enabled !== true || (l.buy_now_price_cents && !l.current_bid_amount)
        ).length;
        const soldViaAuction = purchasedLeadsList.filter(
          (l) => l.auction_enabled === true && l.current_bid_amount !== null
        ).length;

        setStats({
          totalLeads,
          leadsThisWeek,
          purchasedLeads,
          totalRevenueCents,
          hotLeads,
          warmLeads,
          coldLeads,
          auctionEnabledCount,
          auctionWithBidsCount,
          soldViaBuyNow,
          soldViaAuction,
        });

        // Top agents by purchased leads (all-time and last 30 days)
        const agentPurchasesAllTime: Record<string, number> = {};
        const agentPurchasesLast30Days: Record<string, number> = {};
        
        leads
          .filter((l) => l.status === "purchased_by_agent" && l.assigned_agent_id)
          .forEach((l) => {
            const agentId = l.assigned_agent_id as string;
            agentPurchasesAllTime[agentId] = (agentPurchasesAllTime[agentId] || 0) + 1;
            
            // Check if purchased in last 30 days
            if (l.created_at && new Date(l.created_at) >= thirtyDaysAgo) {
              agentPurchasesLast30Days[agentId] = (agentPurchasesLast30Days[agentId] || 0) + 1;
            }
          });

        // Get top 10 agents by all-time purchases
        const topAgentIds = Object.entries(agentPurchasesAllTime)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([id]) => id);

        // Fetch agent emails
        const { data: profilesData } = await supabaseClient
          .from("profiles")
          .select("id, email")
          .in("id", topAgentIds);

        const topAgentsList: TopAgent[] = topAgentIds.map((agentId) => {
          const profile = profilesData?.find((p) => p.id === agentId);
          return {
            agent_id: agentId,
            agent_email: profile?.email || null,
            purchased_count_all_time: agentPurchasesAllTime[agentId] || 0,
            purchased_count_last_30_days: agentPurchasesLast30Days[agentId] || 0,
          };
        });

        setTopAgents(topAgentsList);

        // Recent leads (last 20)
        const { data: recentData } = await supabaseClient
          .from("leads")
          .select(
            "id, created_at, city, province, urgency_level, status, agent_status, auction_enabled, price_charged_cents"
          )
          .order("created_at", { ascending: false })
          .limit(20);

        setRecentLeads((recentData || []) as RecentLead[]);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (loading || !stats) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-[#6b6b6b]">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  function formatUrgency(urgency: string | null) {
    if (!urgency) return "Unknown";
    const lower = urgency.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return urgency;
  }

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Header */}
      <header className="border-b border-[#ded3c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-[#2a2a2a]">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#6b6b6b]">Owner view</span>
            <button
              onClick={() => (window.location.href = "/logout")}
              className="rounded-md border border-[#ded3c2] bg-white px-3 py-1 text-xs font-medium text-[#6b6b6b] hover:bg-[#f7f4ef] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Admin Analytics Dashboard
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Overview of all leads, revenue, and marketplace activity.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Total Leads" value={stats.totalLeads} />
          <StatCard label="Leads This Week" value={stats.leadsThisWeek} />
          <StatCard label="Leads Sold" value={stats.purchasedLeads} />
          <StatCard
            label="Total Revenue (test mode)"
            value={formatMoney(stats.totalRevenueCents)}
          />
        </div>

        {/* Pipeline Overview */}
        <div className="mb-8">
          <h2
            className="mb-4 text-lg font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Pipeline Overview
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Leads by Urgency */}
            <div className="rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm">
              <h3
                className="mb-4 text-base font-semibold text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Leads by Urgency
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-[#4a4a4a]">HOT</td>
                    <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                      {stats.hotLeads}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-[#4a4a4a]">WARM</td>
                    <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                      {stats.warmLeads}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#4a4a4a]">COLD</td>
                    <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                      {stats.coldLeads}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Auctions */}
        <div className="mb-8">
          <h2
            className="mb-4 text-lg font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Auctions
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm">
            <h3
              className="mb-4 text-base font-semibold text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Auctions vs Buy Now
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-[#4a4a4a]">Auction enabled</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.auctionEnabledCount}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-[#4a4a4a]">With active bids</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.auctionWithBidsCount}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-[#4a4a4a]">Sold via Buy Now</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.soldViaBuyNow}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-[#4a4a4a]">Sold via Auction</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.soldViaAuction}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Agents */}
        {topAgents.length > 0 && (
          <div className="mb-8">
            <h2
              className="mb-4 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Agents
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/70 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#faf8f5]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Agent email
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Leads purchased (all-time)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Leads purchased (last 30 days)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent) => {
                    const email = agent.agent_email || `agent_${agent.agent_id.slice(0, 8)}`;
                    const displayEmail = email.length > 30 ? `${email.slice(0, 27)}…` : email;
                    return (
                      <tr
                        key={agent.agent_id}
                        className="border-b border-slate-100 hover:bg-[#faf8f5]"
                      >
                        <td className="px-4 py-3 text-[#4a4a4a]">
                          {displayEmail}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#2a2a2a]">
                          {agent.purchased_count_all_time}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#2a2a2a]">
                          {agent.purchased_count_last_30_days}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Leads */}
        <div>
          <h2
            className="mb-4 text-lg font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Recent Leads
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/70 shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#faf8f5]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Created date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    City / Province
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Urgency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Auction enabled?
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Purchased?
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 hover:bg-[#faf8f5]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#4a4a4a]">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {[lead.city, lead.province].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {formatUrgency(lead.urgency_level)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.agent_status || lead.status || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.auction_enabled ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-[#6b6b6b]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.price_charged_cents ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-[#6b6b6b]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
    </div>
  );
}
