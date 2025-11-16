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
};

type RecentLead = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    available: 0,
    myLeads: 0,
    purchased: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

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

        const agentId = user.id;

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

        setStats({
          available: availableCount ?? 0,
          myLeads: myLeadsCount ?? 0,
          purchased: purchasedCount ?? 0,
        });

        // Load recent leads (assigned to this agent, limit 10)
        const { data: recentData } = await supabaseClient
          .from("leads")
          .select("id, created_at, full_name, city, urgency_level, status")
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

  function formatDate(dateString: string | null) {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
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
            <span className="text-xs text-[#e0d5bf]">Agent</span>
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
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Overview
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Quick snapshot of leads available in your territory.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading your stats…</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <Link
                href="/agent/leads/available"
                className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Available leads
                </div>
                <div className="mt-3 text-3xl font-semibold text-[#2a2a2a]">
                  {stats.available}
                </div>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  New leads you can buy or bid on.
                </p>
              </Link>

              <Link
                href="/agent/leads/mine"
                className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                  My leads
                </div>
                <div className="mt-3 text-3xl font-semibold text-[#2a2a2a]">
                  {stats.myLeads}
                </div>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Leads currently assigned to you.
                </p>
              </Link>

              <Link
                href="/agent/leads/purchased"
                className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                  Purchased leads
                </div>
                <div className="mt-3 text-3xl font-semibold text-[#2a2a2a]">
                  {stats.purchased}
                </div>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Leads you&apos;ve bought through EverLead.
                </p>
              </Link>
            </div>

            {/* Recent Leads and Quick Links */}
            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              {/* Recent Leads Table */}
              <div className="rounded-lg border border-[#ded3c2] bg-white shadow-sm">
                <div className="border-b border-[#ded3c2] px-6 py-4">
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
                        <tr className="border-b border-[#ded3c2] bg-[#faf8f5]">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            City
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
                            className="border-b border-[#f3f4f6] hover:bg-[#faf8f5]"
                          >
                            <td className="px-6 py-3 text-[#4a4a4a]">
                              {formatDate(lead.created_at)}
                            </td>
                            <td className="px-6 py-3 text-[#2a2a2a]">
                              {lead.full_name || "Unnamed"}
                            </td>
                            <td className="px-6 py-3 text-[#4a4a4a]">
                              {lead.city || "-"}
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-xs font-medium text-[#4a4a4a]">
                                {formatUrgency(lead.urgency_level)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-[#4a4a4a]">
                              {lead.status || "-"}
                            </td>
                            <td className="px-6 py-3">
                              <Link
                                href={`/agent/leads/${lead.id}`}
                                className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                              >
                                View details →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
                <h2
                  className="mb-4 text-lg font-normal text-[#2a2a2a]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Quick links
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/agent/leads/available"
                    className="block rounded-md border border-[#ded3c2] bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                  >
                    Browse available leads
                  </Link>
                  <Link
                    href="/agent/leads/purchased"
                    className="block rounded-md border border-[#ded3c2] bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                  >
                    View my purchased leads
                  </Link>
                  <Link
                    href="/agent/leads/mine"
                    className="block rounded-md border border-[#ded3c2] bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                  >
                    View all my leads
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
