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

type TopAgent = {
  agent_id: string;
  agent_email: string | null;
  purchased_count: number;
};

type PendingAuction = {
  id: string;
  city: string | null;
  urgency_level: string | null;
  auction_ends_at: string | null;
  current_bid_amount: number | null;
};

type YourBid = {
  lead_id: string;
  lead_city: string | null;
  lead_urgency: string | null;
  your_highest_bid: number;
  is_highest_bidder: boolean;
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
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [pendingAuctions, setPendingAuctions] = useState<PendingAuction[]>([]);
  const [yourBids, setYourBids] = useState<YourBid[]>([]);
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

        // Load top agents (purchased leads in last 30 days)
        const { data: purchasedLeadsData } = await supabaseClient
          .from("leads")
          .select("assigned_agent_id, created_at")
          .eq("status", "purchased_by_agent")
          .not("assigned_agent_id", "is", null)
          .gte("created_at", thirtyDaysAgoISO);

        // Group by agent_id and count
        const agentCounts: Record<string, number> = {};
        purchasedLeadsData?.forEach((lead) => {
          const aid = lead.assigned_agent_id as string;
          agentCounts[aid] = (agentCounts[aid] || 0) + 1;
        });

        // Get top 5 agents
        const topAgentIds = Object.entries(agentCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id]) => id);

        // Fetch agent emails from profiles
        const { data: profilesData } = await supabaseClient
          .from("profiles")
          .select("id, email")
          .in("id", topAgentIds);

        const topAgentsList: TopAgent[] = topAgentIds.map((aid) => {
          const profile = profilesData?.find((p) => p.id === aid);
          // Try to get email from profile, or fall back to auth.users if needed
          // For now, we'll use profile email or show truncated agent ID
          return {
            agent_id: aid,
            agent_email: profile?.email || `agent_${aid.slice(0, 8)}`,
            purchased_count: agentCounts[aid] || 0,
          };
        });

        setTopAgents(topAgentsList);

        // Load pending auctions (auction_enabled = true, ends_at in future, not purchased)
        const now = new Date().toISOString();
        const { data: auctionsData } = await supabaseClient
          .from("leads")
          .select("id, city, urgency_level, auction_ends_at, current_bid_amount")
          .eq("auction_enabled", true)
          .neq("status", "purchased_by_agent")
          .gt("auction_ends_at", now)
          .order("auction_ends_at", { ascending: true })
          .limit(5);

        setPendingAuctions((auctionsData || []) as PendingAuction[]);

        // Load your bids
        const { data: bidsData } = await supabaseClient
          .from("lead_bids")
          .select("lead_id, amount")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false });

        // Get distinct lead_ids and find highest bid per lead for this agent
        const leadBidMap: Record<string, number> = {};
        bidsData?.forEach((bid) => {
          const lid = bid.lead_id as string;
          const amount = bid.amount as number;
          if (!leadBidMap[lid] || amount > leadBidMap[lid]) {
            leadBidMap[lid] = amount;
          }
        });

        const yourBidLeadIds = Object.keys(leadBidMap).slice(0, 10);

        if (yourBidLeadIds.length > 0) {
          // Fetch lead info for these bids
          const { data: bidLeadsData } = await supabaseClient
            .from("leads")
            .select("id, city, urgency_level, current_bid_agent_id")
            .in("id", yourBidLeadIds);

          const yourBidsList: YourBid[] = yourBidLeadIds.map((lid) => {
            const lead = bidLeadsData?.find((l) => l.id === lid);
            return {
              lead_id: lid,
              lead_city: lead?.city || null,
              lead_urgency: lead?.urgency_level || null,
              your_highest_bid: leadBidMap[lid],
              is_highest_bidder: lead?.current_bid_agent_id === agentId,
            };
          });

          setYourBids(yourBidsList);
        } else {
          setYourBids([]);
        }
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

            {/* Marketplace sections: Leaderboard, Pending Auctions, Your Bids */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {/* Leaderboard */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2
                    className="text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Top agents this month
                  </h2>
                </div>
                <div className="px-6 py-4">
                  {topAgents.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {topAgents.map((agent, idx) => {
                        const email = agent.agent_email || "Unknown";
                        // Truncate email if too long, but preserve @domain part
                        let displayEmail = email;
                        if (email.includes("@") && email.length > 25) {
                          const [user, domain] = email.split("@");
                          displayEmail = `${user.slice(0, 15)}…@${domain}`;
                        } else if (email.length > 25) {
                          displayEmail = `${email.slice(0, 22)}…`;
                        }
                        return (
                          <div
                            key={agent.agent_id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#6b6b6b]">
                                {idx + 1}.
                              </span>
                              <span className="text-sm text-[#2a2a2a]">
                                {displayEmail}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-[#2a2a2a]">
                              {agent.purchased_count} leads
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Auctions */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2
                    className="text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Pending auctions
                  </h2>
                </div>
                <div className="px-6 py-4">
                  {pendingAuctions.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">
                      No active auctions right now
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingAuctions.map((auction) => {
                        const endDate = auction.auction_ends_at
                          ? new Date(auction.auction_ends_at)
                          : null;
                        const endTimeStr = endDate
                          ? endDate.toLocaleDateString() +
                            " " +
                            endDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Unknown";
                        return (
                          <div
                            key={auction.id}
                            className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getUrgencyColor(
                                  auction.urgency_level
                                )}`}
                              >
                                {formatUrgency(auction.urgency_level)}
                              </span>
                              <span className="text-xs text-[#6b6b6b]">
                                {auction.city || "Unknown"}
                              </span>
                            </div>
                            <div className="mb-2 text-xs text-[#4a4a4a]">
                              Ends: {endTimeStr}
                            </div>
                            <div className="mb-2 text-xs text-[#4a4a4a]">
                              Current bid:{" "}
                              {auction.current_bid_amount
                                ? `$${auction.current_bid_amount.toFixed(2)}`
                                : "No bids yet"}
                            </div>
                            <Link
                              href={`/agent/leads/${auction.id}`}
                              className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                            >
                              View / Bid →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Your Bids */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2
                    className="text-base font-normal text-[#2a2a2a]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Your bids
                  </h2>
                </div>
                <div className="px-6 py-4">
                  {yourBids.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">
                      You haven&apos;t placed any bids yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {yourBids.map((bid) => (
                        <div
                          key={bid.lead_id}
                          className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getUrgencyColor(
                                bid.lead_urgency
                              )}`}
                            >
                              {formatUrgency(bid.lead_urgency)}
                            </span>
                            <span className="text-xs text-[#6b6b6b]">
                              {bid.lead_city || "Unknown"}
                            </span>
                          </div>
                          <div className="mb-2 text-xs text-[#4a4a4a]">
                            Your bid: ${bid.your_highest_bid.toFixed(2)}
                          </div>
                          <div className="mb-2">
                            {bid.is_highest_bidder ? (
                              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">
                                Highest bidder
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                                Outbid
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/agent/leads/${bid.lead_id}`}
                            className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
