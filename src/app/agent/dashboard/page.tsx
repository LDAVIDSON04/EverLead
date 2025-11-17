"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { AgentNav } from "@/components/AgentNav";

type Stats = {
  available: number;
  myLeads: number;
  purchased: number;
  purchasedThisMonth: number;
  totalSpent: number;
};

type RecentLead = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  agent_status: string | null;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    available: 0,
    myLeads: 0,
    purchased: 0,
    purchasedThisMonth: 0,
    totalSpent: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || null);
        const agentId = user.id;

        // Calculate date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Load stats
        const { count: availableCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "new");

        const { count: myLeadsCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("assigned_agent_id", agentId);

        const { count: purchasedCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("assigned_agent_id", agentId)
          .eq("status", "purchased_by_agent");

        // Purchased this month
        const { count: purchasedThisMonthCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("assigned_agent_id", agentId)
          .eq("status", "purchased_by_agent")
          .gte("created_at", thirtyDaysAgoISO);

        // Total spent (sum of price_charged_cents for purchased leads)
        const { data: purchasedLeads } = await supabaseClient
          .from("leads")
          .select("price_charged_cents")
          .eq("assigned_agent_id", agentId)
          .eq("status", "purchased_by_agent");

        const totalSpentCents =
          purchasedLeads?.reduce(
            (sum, lead) => sum + (lead.price_charged_cents || 0),
            0
          ) || 0;

        setStats({
          available: availableCount ?? 0,
          myLeads: myLeadsCount ?? 0,
          purchased: purchasedCount ?? 0,
          purchasedThisMonth: purchasedThisMonthCount ?? 0,
          totalSpent: totalSpentCents / 100, // Convert to dollars
        });

        // Load recent leads (assigned to this agent, limit 10)
        const { data: recentData } = await supabaseClient
          .from("leads")
          .select("id, created_at, full_name, city, urgency_level, status, agent_status")
          .eq("assigned_agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(10);

        setRecentLeads((recentData || []) as RecentLead[]);
      } catch (err) {
        console.error("Error loading agent dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [router]);

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.push("/login");
  }

  function formatUrgency(urgency: string | null) {
    if (!urgency) return "Unknown";
    const lower = urgency.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return urgency;
  }

  function getUrgencyColor(urgency: string | null) {
    if (!urgency) return "bg-slate-100 text-slate-900";
    const lower = urgency.toLowerCase();
    if (lower === "hot") return "bg-red-100 text-red-900";
    if (lower === "warm") return "bg-amber-100 text-amber-900";
    return "bg-slate-100 text-slate-900";
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  function formatStatus(status: string | null) {
    if (!status) return "New";
    if (status === "purchased_by_agent") return "Purchased";
    return status;
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Top bar */}
      <header className="border-b border-[#ded3c2] bg-[#1f2933] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-white">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              Agent Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-xs text-[#e0d5bf]">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md border border-[#e5d7b5] bg-transparent px-3 py-1 text-[11px] font-medium text-[#e0d5bf] hover:bg-white/10 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Agent nav */}
      <AgentNav />

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="mb-2 text-3xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Agent dashboard
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Your pre-need leads and results at a glance.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading your stats…</p>
        ) : (
          <>
            {/* Metrics row */}
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <Link
                href="/agent/leads/available"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Available leads
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.available}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  New leads you can buy or bid on
                </p>
              </Link>

              <Link
                href="/agent/leads/mine"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  My leads
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.myLeads}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Leads currently assigned to you
                </p>
              </Link>

              <Link
                href="/agent/leads/purchased"
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Purchased this month
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.purchasedThisMonth}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Leads purchased in last 30 days
                </p>
              </Link>

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Total spent
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  ${stats.totalSpent.toFixed(2)}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  All-time lead purchases
                </p>
              </div>
            </div>

            {/* Recent activity / recent leads */}
            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              {/* Recent Leads Table */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2
                    className="text-lg font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Recent leads
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {recentLeads.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-[#6b6b6b]">
                      You don&apos;t have any leads yet. Browse available leads to get started.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#faf8f5]">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            City / Region
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Urgency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
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
                            <td className="px-6 py-3 text-[#4a4a4a]">
                              {formatDate(lead.created_at)}
                            </td>
                            <td className="px-6 py-3 text-[#2a2a2a]">
                              {lead.city || "-"}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getUrgencyColor(
                                  lead.urgency_level
                                )}`}
                              >
                                {formatUrgency(lead.urgency_level)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-[#4a4a4a]">
                              {formatStatus(lead.agent_status || lead.status)}
                            </td>
                            <td className="px-6 py-3">
                              <Link
                                href={`/agent/leads/${lead.id}`}
                                className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                              >
                                View →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Quick Links + Tips */}
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2
                    className="mb-4 text-lg font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Quick links
                  </h2>
                  <div className="space-y-3">
                    <Link
                      href="/agent/leads/available"
                      className="block rounded-md border border-slate-200 bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                    >
                      Browse available leads
                    </Link>
                    <Link
                      href="/agent/leads/purchased"
                      className="block rounded-md border border-slate-200 bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                    >
                      View my purchased leads
                    </Link>
                    <Link
                      href="/agent/leads/mine"
                      className="block rounded-md border border-slate-200 bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                    >
                      View all my leads
                    </Link>
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2
                    className="mb-3 text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Tips for working EverLead leads
                  </h2>
                  <ul className="space-y-2 text-sm text-[#4a4a4a]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6b6b6b]">•</span>
                      <span>
                        Contact HOT leads within 24 hours for best conversion rates
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6b6b6b]">•</span>
                      <span>
                        Use notes to track every touchpoint and follow-up
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6b6b6b]">•</span>
                      <span>
                        Update lead status as you progress through your workflow
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
