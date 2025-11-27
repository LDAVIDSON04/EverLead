"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { maskName } from "@/lib/masking";
import { agentOwnsLead } from "@/lib/leads";

type Stats = {
  available: number;
  myLeads: number;
  newLeads: number; // Leads with agent_status = 'new'
  purchased: number;
  purchasedThisMonth: number;
  totalSpent: number;
};

type RoiStats = {
  totalAppointments: number;
  totalSpend: number;
  bookedAppointments: number;
  completedAppointments: number;
  avgCostPerAppointment: number;
  costPerBookedAppointment: number;
  costPerCompletedAppointment: number;
};

type RecentLead = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  province: string | null;
  urgency_level: string | null;
  service_type: string | null;
  status: string | null;
  agent_status: string | null;
  assigned_agent_id: string | null;
};


export default function AgentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    available: 0,
    myLeads: 0,
    newLeads: 0,
    purchased: 0,
    purchasedThisMonth: 0,
    totalSpent: 0,
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roiStats, setRoiStats] = useState<RoiStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Check for appointment purchase success
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const purchaseType = urlParams.get("type");
    const purchaseSuccess = urlParams.get("purchase") === "success";
    const appointmentId = urlParams.get("appointmentId");

    if (purchaseSuccess && sessionId && purchaseType === "appointment" && appointmentId) {
      // Handle appointment purchase confirmation
      const confirmAppointment = async () => {
        try {
          const {
            data: { user },
          } = await supabaseClient.auth.getUser();

          if (!user) return;

          const res = await fetch("/api/appointments/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              appointmentId,
              agentId: user.id,
            }),
          });

          if (res.ok) {
            // Clean URL and reload to show updated appointments
            window.history.replaceState({}, "", "/agent/dashboard");
            // Optionally show success message or redirect to appointments page
            router.push("/agent/appointments");
          }
        } catch (err) {
          console.error("Appointment confirmation error:", err);
        }
      };

      confirmAppointment();
    }

    async function loadDashboard() {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/agent");
          return;
        }

        const agentId = user.id;
        setUserId(agentId);

        // Fetch dashboard data from API
        const res = await fetch(`/api/agent/dashboard?agentId=${agentId}`);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Dashboard API error:", errorData);
          throw new Error(errorData.error || "Failed to load dashboard");
        }

        const data = await res.json();

        if (cancelled) return;

        if (!data || data.error) {
          throw new Error(data.error || "Failed to load dashboard data");
        }

        // Update stats
        setStats({
          available: data.stats.availableLeads ?? 0,
          myLeads: data.stats.myLeads ?? 0,
          newLeads: data.stats.newLeadsNeedingAttention ?? 0,
          purchased: 0, // Not used in UI
          purchasedThisMonth: data.stats.purchasedThisMonth ?? 0,
          totalSpent: (data.stats.totalSpentCents ?? 0) / 100, // Convert to dollars
        });

        // Update ROI stats
        if (data.roi) {
          setRoiStats(data.roi);
        }

        // Update recent leads (map to existing type)
        setRecentLeads(
          (data.recentLeads || []).map((lead: any) => ({
            id: lead.id,
            created_at: lead.created_at,
            full_name: null,
            first_name: null,
            last_name: null,
            city: lead.city,
            province: lead.province,
            urgency_level: lead.urgency_level,
            service_type: lead.service_type,
            status: lead.status,
            agent_status: lead.agent_status,
            assigned_agent_id: agentId,
          }))
        );

        // No auction data needed - buy-now-only

        // Top agents removed - leaderboard only exists in admin dashboard
      } catch (err) {
        console.error("Error loading agent dashboard:", err);
        if (!cancelled) {
          setError("Failed to load dashboard stats");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);



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


  function getStatusColors(status: string | null): { bg: string; text: string } {
    const s = (status ?? "new").toLowerCase();
    if (s === "new") return { bg: "bg-blue-100", text: "text-blue-700" };
    if (s === "contacted") return { bg: "bg-slate-100", text: "text-slate-700" };
    if (s.includes("follow")) return { bg: "bg-amber-100", text: "text-amber-700" };
    if (s.includes("won")) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (s.includes("lost")) return { bg: "bg-rose-100", text: "text-rose-700" };
    return { bg: "bg-slate-100", text: "text-slate-700" };
  }

  return (
    <>
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

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-[#6b6b6b]">Loading your stats…</p>
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-red-500">
              We couldn&apos;t load your stats. Please refresh the page.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards row */}
            <div className="grid gap-4 md:grid-cols-4">
              <Link
                href="/agent/leads/available"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Available leads
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.available}
                </span>
                <span className="text-[11px] text-slate-500">
                  New leads you can buy or bid on
                </span>
              </Link>

              <Link
                href="/agent/leads/mine"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My leads
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.myLeads}
                </span>
                <span className="text-[11px] text-slate-500">
                  Leads currently assigned to you
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {stats.newLeads === 0
                    ? "No new leads needing attention"
                    : `${stats.newLeads} new lead${stats.newLeads === 1 ? "" : "s"} need attention`}
                </p>
              </Link>

              <Link
                href="/agent/leads/purchased"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Purchased this month
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.purchasedThisMonth}
                </span>
                <span className="text-[11px] text-slate-500">
                  Leads purchased in last 30 days
                </span>
              </Link>

              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total spent
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  ${stats.totalSpent.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500">
                  All-time lead purchases
                </span>
              </div>
            </div>

            {/* ROI Section */}
            {roiStats && (
              <section id="roi" className="space-y-4">
                <h2
                  className="text-xl font-normal text-[#2a2a2a]"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Your ROI
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
                      Total spent
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#2a2a2a]">
                      ${roiStats.totalSpend.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      Across {roiStats.totalAppointments} appointment{roiStats.totalAppointments !== 1 ? 's' : ''} reserved/purchased
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
                      Cost per booked
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#2a2a2a]">
                      {roiStats.bookedAppointments > 0
                        ? `$${roiStats.costPerBookedAppointment.toFixed(2)}`
                        : '—'}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      {roiStats.bookedAppointments} booked appointment{roiStats.bookedAppointments !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b6b6b]">
                      Cost per completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#2a2a2a]">
                      {roiStats.completedAppointments > 0
                        ? `$${roiStats.costPerCompletedAppointment.toFixed(2)}`
                        : '—'}
                    </p>
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      {roiStats.completedAppointments} completed appointment{roiStats.completedAppointments !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left column */}
              <div className="space-y-6 lg:col-span-2">
                {/* Recent Leads Card */}
                <div className="rounded-xl border border-slate-200 bg-white/70 shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2
                      className="text-lg font-normal text-[#2a2a2a]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Recent leads
                    </h2>
                  </div>
                  <div className="px-6 py-4">
                    {recentLeads.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="mb-4 text-sm text-[#6b6b6b]">
                          You don&apos;t have any leads assigned yet. Purchase or claim a lead to see it here.
                        </p>
                        <Link
                          href="/agent/leads/available"
                          className="inline-block rounded-full bg-[#2a2a2a] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
                        >
                          Browse available leads
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentLeads.map((lead) => {
                              const { bg: statusBg, text: statusText } = getStatusColors(lead.agent_status || lead.status);
                              
                              // Format location: "City, Province" or just "City"
                              const locationStr = lead.city
                                ? lead.province
                                  ? `${lead.city}, ${lead.province}`
                                  : lead.city
                                : "Unknown location";
                              
                              // Format service type
                              const serviceType = lead.service_type || "Pre-need planning";
                              
                              return (
                                <div
                                  key={lead.id}
                                  className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 -mx-3 px-3 py-2 rounded"
                                  onClick={() => router.push(`/agent/leads/${lead.id}`)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {lead.urgency_level && (
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getUrgencyColor(
                                          lead.urgency_level
                                        )}`}
                                      >
                                        {formatUrgency(lead.urgency_level)}
                                      </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-slate-900">
                                        {locationStr}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {serviceType}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4">
                                    <span
                                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBg} ${statusText}`}
                                    >
                                      {formatStatus(lead.agent_status || lead.status)}
                                    </span>
                                    <Link
                                      href={`/agent/leads/${lead.id}`}
                                      className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors whitespace-nowrap"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View details →
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Quick Links */}
                <div className="rounded-xl border border-slate-200 bg-white/70 shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2
                      className="text-lg font-normal text-[#2a2a2a]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Quick links
                    </h2>
                  </div>
                  <div className="px-6 py-4 space-y-3">
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
                <div className="rounded-xl border border-slate-200 bg-white/70 shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2
                      className="text-lg font-normal text-[#2a2a2a]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Tips for working EverLead leads
                    </h2>
                  </div>
                  <div className="px-6 py-4">
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
            </div>
          </div>
        )}
      </section>
    </>
  );
}
