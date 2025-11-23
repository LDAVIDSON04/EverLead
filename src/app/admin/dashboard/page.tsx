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

type AgentWithStats = {
  id: string;
  email: string | null;
  full_name: string | null;
  funeral_home: string | null;
  region: string | null;
  leads_purchased: number;
  total_spent: number; // in cents
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
  const [allAgents, setAllAgents] = useState<AgentWithStats[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geography, setGeography] = useState<GeoStat[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "geography" | "recent" | "roi" | "approvals">("overview");
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  
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
        const { data: recentData, error: recentError } = await supabaseClient
          .from("leads")
          .select(
            "id, created_at, city, province, urgency_level, status, agent_status, auction_enabled, price_charged_cents"
          )
          .order("created_at", { ascending: false })
          .limit(50);

        if (recentError) {
          console.error("Error loading recent leads:", recentError);
        }

        setRecentLeads((recentData || []) as RecentLead[]);

        // Load all agents with stats
        const { data: allAgentsData, error: agentsError } = await supabaseClient
          .from("profiles")
          .select("id, email, full_name, funeral_home, region")
          .eq("role", "agent");

        if (agentsError) {
          console.error("Error loading agents:", agentsError);
        } else if (allAgentsData) {
          // For each agent, calculate leads purchased and total spent
          const agentsWithStats: AgentWithStats[] = await Promise.all(
            allAgentsData.map(async (agent) => {
              // Get purchased leads for this agent
              const { data: purchasedLeads } = await supabaseClient
                .from("leads")
                .select("id, price_charged_cents")
                .eq("assigned_agent_id", agent.id)
                .not("price_charged_cents", "is", null);

              const leadsPurchased = purchasedLeads?.length || 0;
              const totalSpent = purchasedLeads?.reduce((sum, lead) => sum + (lead.price_charged_cents || 0), 0) || 0;

              return {
                id: agent.id,
                email: agent.email,
                full_name: agent.full_name,
                funeral_home: agent.funeral_home || null,
                region: agent.region || null,
                leads_purchased: leadsPurchased,
                total_spent: totalSpent,
              };
            })
          );

          // Sort by total spent descending
          agentsWithStats.sort((a, b) => b.total_spent - a.total_spent);
          setAllAgents(agentsWithStats);
        }

        // No auction stats needed - buy-now-only
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

  // Load pending agents when approvals tab is active
  useEffect(() => {
    if (activeTab === "approvals") {
      loadPendingAgents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadPendingAgents() {
    setLoadingApprovals(true);
    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, email, full_name, phone, funeral_home, licensed_in_province, licensed_funeral_director, approval_status, created_at")
        .eq("role", "agent")
        .in("approval_status", ["pending", "declined"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading pending agents:", error);
      } else {
        setPendingAgents(data || []);
      }
    } catch (err) {
      console.error("Error loading pending agents:", err);
    } finally {
      setLoadingApprovals(false);
    }
  }

  async function handleApproveAgent(agentId: string) {
    if (!confirm("Are you sure you want to approve this agent?")) {
      return;
    }

    try {
      // Get current user ID
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        alert("You must be logged in to approve agents.");
        return;
      }

      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, action: "approve", adminUserId: user.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve agent");
      }

      // Reload pending agents
      await loadPendingAgents();
      alert("Agent approved successfully. They will receive an email notification.");
    } catch (err: any) {
      console.error("Error approving agent:", err);
      alert(err.message || "Failed to approve agent. Please try again.");
    }
  }

  async function handleDeclineAgent(agentId: string) {
    const reason = prompt("Please provide a reason for declining (optional):");
    if (reason === null) return; // User cancelled

    try {
      // Get current user ID
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        alert("You must be logged in to decline agents.");
        return;
      }

      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, action: "decline", notes: reason || undefined, adminUserId: user.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to decline agent");
      }

      // Reload pending agents
      await loadPendingAgents();
      alert("Agent declined. They will receive an email notification.");
    } catch (err: any) {
      console.error("Error declining agent:", err);
      alert(err.message || "Failed to decline agent. Please try again.");
    }
  }

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
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (loading || !stats) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-[#6b6b6b]">Loading dashboard...</p>
      </section>
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
    <>
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
              { id: "agents" as const, label: "Agents" },
              { id: "geography" as const, label: "Geography" },
              { id: "recent" as const, label: "Recent leads" },
              { id: "roi" as const, label: "ROI" },
              { id: "approvals" as const, label: "Agent Approvals" },
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

                {/* Sales Summary */}
                <div className="rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm">
                  <h3
                    className="mb-4 text-base font-semibold text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Sales Summary
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 text-[#4a4a4a]">Leads sold</td>
                        <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                          {stats.purchasedLeads}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-[#4a4a4a]">Total revenue</td>
                        <td className="py-2 text-right font-semibold text-[#2a2a2a]">
                          {formatMoney(stats.totalRevenueCents)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Leads Table */}
            <div>
              <h2
                className="mb-4 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Recent Leads
              </h2>
              {recentLeads.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/70 px-8 py-12 text-center shadow-sm">
                  <p className="text-sm text-[#6b6b6b]">No leads found.</p>
                </div>
              ) : (
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
                      {recentLeads.slice(0, 10).map((lead) => (
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
                            {lead.agent_status || lead.status || "New"}
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
              )}
            </div>

          </div>
        )}


        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div className="space-y-8">
            {/* Total Agents Section */}
            <div>
              <h2
                className="mb-4 text-lg font-normal text-[#2a2a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Agent Overview
              </h2>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-6 py-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Total Agents in System
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-[#2a2a2a]">
                      {totalAgentsCount}
                    </p>
                    <p className="mt-2 text-sm text-[#6b6b6b]">
                      {totalAgentsCount === 1 ? "agent" : "agents"} registered
                    </p>
                  </div>
                  <div className="rounded-full bg-[#f7f4ef] p-4">
                    <svg
                      className="h-8 w-8 text-[#2a2a2a]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Leaderboard Section */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2
                    className="text-lg font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Agent Leaderboard
                  </h2>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    All agents sorted by total spending
                  </p>
                </div>
              </div>

              {allAgents.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#faf8f5]">
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Funeral Home
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Region
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Leads Purchased
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Total Spent
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allAgents.map((agent) => {
                          const displayEmail = agent.email && agent.email.length > 40 
                            ? `${agent.email.slice(0, 37)}…` 
                            : agent.email || "-";

                          return (
                            <tr
                              key={agent.id}
                              className="hover:bg-[#faf8f5] transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="font-medium text-[#2a2a2a]">
                                  {agent.full_name || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[#4a4a4a]">
                                  {displayEmail}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[#4a4a4a]">
                                  {agent.funeral_home || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-[#4a4a4a]">
                                  {agent.region || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-semibold text-[#2a2a2a]">
                                  {agent.leads_purchased}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-semibold text-[#2a2a2a]">
                                  ${(agent.total_spent / 100).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white/70 px-8 py-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f4ef]">
                    <svg
                      className="h-8 w-8 text-[#6b6b6b]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-[#2a2a2a]">
                    No agents found
                  </p>
                  <p className="mt-1 text-sm text-[#6b6b6b]">
                    Agents will appear here once they register.
                  </p>
                </div>
              )}
            </div>
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
            {recentLeads.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-8 py-12 text-center shadow-sm">
                <p className="text-sm text-[#6b6b6b]">No leads found.</p>
              </div>
            ) : (
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
                      {recentLeads.slice(0, 50).map((lead) => (
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
                          {lead.agent_status || lead.status || "New"}
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
            )}
          </div>
        )}

        {/* Agent Approvals Tab */}
        {activeTab === "approvals" && (
          <div>
            <h2
              className="mb-4 text-lg font-normal text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Pending Agent Applications
            </h2>
            {loadingApprovals ? (
              <p className="text-sm text-[#6b6b6b]">Loading applications...</p>
            ) : pendingAgents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/70 px-8 py-12 text-center shadow-sm">
                <p className="text-sm text-[#6b6b6b]">No pending applications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-base font-semibold text-[#2a2a2a]">
                          {agent.full_name || "No name provided"}
                        </h3>
                        <div className="space-y-1 text-sm text-[#4a4a4a]">
                          <p><strong>Email:</strong> {agent.email || "-"}</p>
                          <p><strong>Phone:</strong> {agent.phone || "-"}</p>
                          <p><strong>Funeral Home/Agency:</strong> {agent.funeral_home || "-"}</p>
                          <p><strong>Licensed in Province:</strong> {agent.licensed_in_province ? "Yes" : "No"}</p>
                          <p><strong>Licensed Funeral Director:</strong> {agent.licensed_funeral_director ? "Yes" : "No"}</p>
                          <p><strong>Status:</strong> <span className="font-medium capitalize">{agent.approval_status || "pending"}</span></p>
                          <p><strong>Applied:</strong> {formatDate(agent.created_at)}</p>
                        </div>
                      </div>
                      <div className="ml-6 flex flex-col gap-2">
                        {agent.approval_status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApproveAgent(agent.id)}
                              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeclineAgent(agent.id)}
                              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {agent.approval_status === "declined" && (
                          <button
                            onClick={() => handleApproveAgent(agent.id)}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            Re-approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    </>
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
