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

type GeoStat = {
  city: string | null;
  province: string | null;
  totalLeads: number;
  soldLeads: number;
  totalRevenueCents: number;
};

type ApiStatsResponse = {
  ok: boolean;
  totalLeads: number;
  totalPurchased: number;
  totalRevenueCents: number;
  leadsLast7Days: number;
  urgencyCounts: {
    hot: number;
    warm: number;
    cold: number;
  };
  topAgents: Array<{
    agentId: string;
    email: string;
    purchasedCount: number;
    purchasedCountLast30: number;
    revenue: number;
  }>;
  totalAgentsCount?: number;
  geography?: GeoStat[];
  error?: string;
};

type TopAgent = {
  agent_id: string;
  agent_email: string | null;
  purchased_count_all_time: number;
  purchased_count_last_30_days: number;
  revenue?: number; // Total spent in cents
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
  const [totalAgentsCount, setTotalAgentsCount] = useState<number>(0);
  const [apiData, setApiData] = useState<ApiStatsResponse | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geography, setGeography] = useState<GeoStat[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "auctions" | "agents" | "geography" | "recent" | "roi">("overview");
  
  // ROI state
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    channel: "",
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats from API
        const res = await fetch("/api/admin/stats");
        const apiData: ApiStatsResponse = await res.json();
        setApiData(apiData); // Store for use in Agents tab

        if (!res.ok || !apiData.ok) {
          throw new Error(apiData.error || "Failed to load dashboard stats");
        }

        // Map API response to dashboard stats format
        setStats({
          totalLeads: apiData.totalLeads,
          leadsThisWeek: apiData.leadsLast7Days,
          purchasedLeads: apiData.totalPurchased,
          totalRevenueCents: apiData.totalRevenueCents,
          hotLeads: apiData.urgencyCounts.hot,
          warmLeads: apiData.urgencyCounts.warm,
          coldLeads: apiData.urgencyCounts.cold,
          auctionEnabledCount: 0, // Will be loaded separately if needed
          auctionWithBidsCount: 0, // Will be loaded separately if needed
          soldViaBuyNow: 0, // Will be loaded separately if needed
          soldViaAuction: 0, // Will be loaded separately if needed
        });

        // Set geography data
        if (apiData.geography) {
          setGeography(apiData.geography);
        }

        // Set total agents count
        setTotalAgentsCount(apiData.totalAgentsCount ?? 0);

        // Map top agents from API (grouped by email)
        if (apiData.topAgents && apiData.topAgents.length > 0) {
          const topAgentsList: TopAgent[] = apiData.topAgents.map((apiAgent: any) => ({
            agent_id: apiAgent.agentId || apiAgent.email, // Use email as ID
            agent_email: apiAgent.email || null,
            purchased_count_all_time: apiAgent.purchasedCount || 0,
            purchased_count_last_30_days: apiAgent.purchasedCountLast30 || 0,
            revenue: apiAgent.revenue || 0, // Include revenue
          }));
          setTopAgents(topAgentsList);
        } else {
          setTopAgents([]);
        }

        // Load recent leads and auction stats separately (still using client-side for now)
        const { data: recentData } = await supabaseClient
          .from("leads")
          .select(
            "id, created_at, city, province, urgency_level, status, agent_status, auction_enabled, price_charged_cents"
          )
          .order("created_at", { ascending: false })
          .limit(20);

        setRecentLeads((recentData || []) as RecentLead[]);

        // Load auction stats
        const { data: allLeads } = await supabaseClient
          .from("leads")
          .select("auction_enabled, current_bid_amount, status, buy_now_price_cents");

        if (allLeads) {
          const auctionEnabledCount = allLeads.filter((l) => l.auction_enabled === true).length;
          const auctionWithBidsCount = allLeads.filter(
            (l) => l.auction_enabled === true && l.current_bid_amount !== null
          ).length;

          const purchasedLeadsList = allLeads.filter((l) => l.status === "purchased_by_agent");
          const soldViaBuyNow = purchasedLeadsList.filter(
            (l) => l.auction_enabled !== true || (l.buy_now_price_cents && !l.current_bid_amount)
          ).length;
          const soldViaAuction = purchasedLeadsList.filter(
            (l) => l.auction_enabled === true && l.current_bid_amount !== null
          ).length;

          setStats((prev) => ({
            ...prev!,
            auctionEnabledCount,
            auctionWithBidsCount,
            soldViaBuyNow,
            soldViaAuction,
          }));
        }
      } catch (err) {
        console.error("Failed to load admin dashboard stats:", err);
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Load expenses function
  async function loadExpenses() {
    setLoadingExpenses(true);
    try {
      const res = await fetch("/api/admin/expenses");
      if (!res.ok) {
        throw new Error("Failed to load expenses");
      }
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalExpenses(data.totals?.totalExpenses || 0);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  }

  // Load expenses when ROI tab is active
  useEffect(() => {
    if (activeTab === "roi") {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle add expense
  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: newExpense.expense_date,
          amount: Number(newExpense.amount),
          description: newExpense.description || null,
          channel: newExpense.channel || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add expense");
      }

      // Reset form
      setNewExpense({
        expense_date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        channel: "",
      });

      // Reload expenses
      await loadExpenses();
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to add expense. Please try again.");
    } finally {
      setSubmittingExpense(false);
    }
  }

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

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            {[
              { id: "overview" as const, label: "Overview" },
              { id: "auctions" as const, label: "Auctions" },
              { id: "agents" as const, label: "Agents" },
              { id: "geography" as const, label: "Geography" },
              { id: "recent" as const, label: "Recent leads" },
              { id: "roi" as const, label: "ROI" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#2a2a2a] text-[#2a2a2a]"
                    : "border-transparent text-[#6b6b6b] hover:text-[#2a2a2a] hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Top KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Total Leads" value={stats.totalLeads} />
              <StatCard label="Leads This Week" value={stats.leadsThisWeek} />
              <StatCard label="Leads Sold" value={stats.purchasedLeads} />
              <StatCard
                label="Total Revenue (test mode)"
                value={formatMoney(stats.totalRevenueCents)}
              />
            </div>

            {/* Pipeline Overview */}
            <div>
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

          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <div>
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
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div>
            <h2
              className="mb-4 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Agents
            </h2>

            {/* Total Agents Count */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Total Agents Signed Up
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-[#2a2a2a]">
                    {totalAgentsCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Agents Table */}
            {topAgents.length > 0 ? (
              <div>
                <h3
                  className="mb-4 text-base font-normal text-[#2a2a2a]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Top Agents (by purchases & spending)
                </h3>
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
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Total spent
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAgents.map((agent) => {
                        // Display email as primary label (not ID)
                        const email = agent.agent_email || `agent_${agent.agent_id.slice(0, 8)}`;
                        const displayEmail = email.length > 40 ? `${email.slice(0, 37)}…` : email;
                        const revenue = agent.revenue || 0;
                        return (
                          <tr
                            key={agent.agent_id}
                            className="border-b border-slate-100 hover:bg-[#faf8f5]"
                          >
                            <td className="px-4 py-3 text-[#4a4a4a] font-medium">
                              {displayEmail}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#2a2a2a]">
                              {agent.purchased_count_all_time}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#2a2a2a]">
                              {agent.purchased_count_last_30_days}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#2a2a2a]">
                              ${(revenue / 100).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-6 py-8 text-center shadow-sm">
                <p className="text-sm text-[#6b6b6b]">
                  No agents have purchased leads yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Geography Tab */}
        {activeTab === "geography" && (
          <div>
            {geography.length > 0 && (
              <div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Geography (where leads and sales come from)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Top regions by total leads and sales.
                  </p>

                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-1 pr-3">Region</th>
                          <th className="py-1 pr-3">Total leads</th>
                          <th className="py-1 pr-3">Sold leads</th>
                          <th className="py-1 pr-3">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {geography.map((geo, idx) => (
                          <tr key={`${geo.city}-${geo.province}-${idx}`} className="border-b border-slate-100">
                            <td className="py-1 pr-3">
                              {(geo.city || "Unknown city") +
                                (geo.province ? `, ${geo.province}` : "")}
                            </td>
                            <td className="py-1 pr-3">{geo.totalLeads}</td>
                            <td className="py-1 pr-3">{geo.soldLeads}</td>
                            <td className="py-1 pr-3">
                              {formatMoney(geo.totalRevenueCents)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Leads Tab */}
        {activeTab === "recent" && (
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
        )}

        {/* ROI Tab */}
        {activeTab === "roi" && (
          <div>
            <h2
              className="mb-4 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              ROI Tracker
            </h2>

            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Revenue
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {formatMoney(stats.totalRevenueCents)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Expenses
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  ${totalExpenses.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Net Profit
                </span>
                <span className={`text-2xl font-semibold ${
                  (stats.totalRevenueCents / 100 - totalExpenses) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  ${((stats.totalRevenueCents / 100) - totalExpenses).toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  ROI %
                </span>
                <span className={`text-2xl font-semibold ${
                  totalExpenses > 0 && ((stats.totalRevenueCents / 100 - totalExpenses) / totalExpenses * 100) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}>
                  {totalExpenses > 0
                    ? `${(((stats.totalRevenueCents / 100 - totalExpenses) / totalExpenses) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* New Expense Form */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3
                  className="mb-4 text-base font-semibold text-[#2a2a2a]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Add Expense
                </h3>
                <form
                  onSubmit={handleAddExpense}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newExpense.expense_date}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, expense_date: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, description: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      placeholder="e.g., Google Ads, Facebook campaign"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                      Channel (optional)
                    </label>
                    <input
                      type="text"
                      value={newExpense.channel}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, channel: e.target.value })
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                      placeholder="e.g., Online, Print, Radio"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingExpense}
                    className="w-full rounded-full bg-[#2a2a2a] px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                  >
                    {submittingExpense ? "Adding..." : "Add Expense"}
                  </button>
                </form>
              </div>

              {/* Expenses Table */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3
                  className="mb-4 text-base font-semibold text-[#2a2a2a]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Expenses
                </h3>
                {loadingExpenses ? (
                  <p className="text-sm text-[#6b6b6b]">Loading expenses...</p>
                ) : expenses.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b]">No expenses recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-1 pr-3">Date</th>
                          <th className="py-1 pr-3">Description</th>
                          <th className="py-1 pr-3">Channel</th>
                          <th className="py-1 pr-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((expense) => (
                          <tr key={expense.id} className="border-b border-slate-100">
                            <td className="py-1 pr-3">
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </td>
                            <td className="py-1 pr-3">{expense.description || "—"}</td>
                            <td className="py-1 pr-3">{expense.channel || "—"}</td>
                            <td className="py-1 pr-3 text-right">
                              ${Number(expense.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
