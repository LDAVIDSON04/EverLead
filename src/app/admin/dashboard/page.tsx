// src/app/admin/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type DashboardStats = {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  inFollowupLeads: number;
  closedWonLeads: number;
  purchasedLeads: number;
  totalRevenueCents: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  auctionEnabledCount: number;
  auctionWithBidsCount: number;
};

type TopAgent = {
  agent_id: string;
  purchased_count: number;
  agent_email?: string;
};

type RecentLead = {
  id: string;
  created_at: string;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  auction_enabled: boolean | null;
  price_charged_cents: number | null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const { data, error } = await supabaseClient
          .from("leads")
          .select(
            "urgency_level, status, agent_status, price_charged_cents, auction_enabled, current_bid_amount, assigned_agent_id"
          );

        if (error) {
          console.error(error);
          setError("Failed to load dashboard stats.");
          setLoading(false);
          return;
        }

        const leads = data || [];

        const totalLeads = leads.length;
        const newLeads = leads.filter(
          (l) => l.status === "new" || l.status === "cold_unassigned"
        ).length;
        const contactedLeads = leads.filter(
          (l) => l.agent_status === "contacted"
        ).length;
        const inFollowupLeads = leads.filter(
          (l) => l.agent_status === "in_followup"
        ).length;
        const closedWonLeads = leads.filter(
          (l) => l.agent_status === "closed_won"
        ).length;
        const purchasedLeads = leads.filter(
          (l) => l.status === "purchased_by_agent"
        ).length;

        const totalRevenueCents = leads
          .filter((l) => l.status === "purchased_by_agent")
          .reduce((sum, l) => sum + (l.price_charged_cents || 0), 0);

        const hotLeads = leads.filter((l) => l.urgency_level === "hot").length;
        const warmLeads = leads.filter(
          (l) => l.urgency_level === "warm"
        ).length;
        const coldLeads = leads.filter(
          (l) => l.urgency_level === "cold"
        ).length;

        const auctionEnabledCount = leads.filter(
          (l) => l.auction_enabled === true
        ).length;
        const auctionWithBidsCount = leads.filter(
          (l) => l.auction_enabled === true && l.current_bid_amount !== null
        ).length;

        setStats({
          totalLeads,
          newLeads,
          contactedLeads,
          inFollowupLeads,
          closedWonLeads,
          purchasedLeads,
          totalRevenueCents,
          hotLeads,
          warmLeads,
          coldLeads,
          auctionEnabledCount,
          auctionWithBidsCount,
        });

        // Top agents by purchased leads
        const agentPurchases: Record<string, number> = {};
        leads
          .filter((l) => l.status === "purchased_by_agent" && l.assigned_agent_id)
          .forEach((l) => {
            const agentId = l.assigned_agent_id as string;
            agentPurchases[agentId] = (agentPurchases[agentId] || 0) + 1;
          });

        const topAgentsList: TopAgent[] = Object.entries(agentPurchases)
          .map(([agent_id, purchased_count]) => ({
            agent_id,
            purchased_count,
          }))
          .sort((a, b) => b.purchased_count - a.purchased_count)
          .slice(0, 5);

        setTopAgents(topAgentsList);

        // Recent leads
        const { data: recentData } = await supabaseClient
          .from("leads")
          .select(
            "id, created_at, city, urgency_level, status, auction_enabled, price_charged_cents"
          )
          .order("created_at", { ascending: false })
          .limit(10);

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
          <StatCard label="Purchased Leads" value={stats.purchasedLeads} />
          <StatCard
            label="Total Revenue"
            value={formatMoney(stats.totalRevenueCents)}
          />
          <StatCard label="New Leads" value={stats.newLeads} />
        </div>

        {/* Leads by Status */}
        <div className="mb-8">
          <h2
            className="mb-4 text-lg font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Leads by Status
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="New" value={stats.newLeads} />
            <StatCard label="Contacted" value={stats.contactedLeads} />
            <StatCard label="In Follow-up" value={stats.inFollowupLeads} />
            <StatCard label="Closed – Won" value={stats.closedWonLeads} />
          </div>
        </div>

        {/* Charts/Summaries */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Leads by Urgency */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2
              className="mb-4 text-base font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Leads by Urgency
            </h2>
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

          {/* Auctions Overview */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2
              className="mb-4 text-base font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Auctions Overview
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-[#4a4a4a]">Auction enabled</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.auctionEnabledCount}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-[#4a4a4a]">With active bids</td>
                  <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                    {stats.auctionWithBidsCount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Agents */}
        {topAgents.length > 0 && (
          <div className="mb-8">
            <h2
              className="mb-4 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Top Agents by Purchased Leads
            </h2>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#faf8f5]">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Agent ID
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Purchased Leads
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent) => (
                    <tr
                      key={agent.agent_id}
                      className="border-b border-slate-100 hover:bg-[#faf8f5]"
                    >
                      <td className="px-4 py-2 text-[#4a4a4a]">
                        {agent.agent_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-[#2a2a2a]">
                        {agent.purchased_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Leads Table */}
        <div>
          <h2
            className="mb-4 text-lg font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Recent Leads
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#faf8f5]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    City / Region
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Urgency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Auction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Purchased
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
                      {lead.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {formatUrgency(lead.urgency_level)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.status || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.auction_enabled ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-[#6b6b6b]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4a4a4a]">
                      {lead.price_charged_cents ? (
                        <span className="text-green-600">Yes</span>
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="text-xl font-semibold text-[#2a2a2a]">{value}</p>
    </div>
  );
}
