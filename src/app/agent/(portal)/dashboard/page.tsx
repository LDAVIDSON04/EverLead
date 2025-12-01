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

// Removed RecentLead type - no longer using recent leads section


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
  // Removed recentLeads state - no longer displaying recent leads section
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
    const isFree = urlParams.get("free") === "true";

    if (purchaseSuccess && purchaseType === "appointment" && appointmentId) {
      // Handle appointment purchase confirmation
      const confirmAppointment = async () => {
        try {
          const {
            data: { user },
          } = await supabaseClient.auth.getUser();

          if (!user) return;

          // If free appointment, skip Stripe confirmation
          if (isFree) {
            // Clean URL and reload to show updated appointments
            window.history.replaceState({}, "", "/agent/dashboard");
            router.push("/agent/my-appointments");
            return;
          }

          // For paid appointments, confirm with Stripe
          if (!sessionId) {
            console.error("Missing sessionId for paid appointment");
            return;
          }

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
            // Redirect to my appointments page to see the purchased appointment
            router.push("/agent/my-appointments");
          } else {
            // Log error for debugging
            const errorData = await res.json().catch(() => ({}));
            console.error("Failed to confirm appointment:", errorData);
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

        // Removed recent leads - no longer displaying this section

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



  // Removed formatUrgency, getUrgencyColor, formatDate, formatStatus, getStatusColors functions
  // These were only used for the recent leads section which has been removed

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
            Your appointments and results at a glance.
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
                href="/agent/appointments"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Available appointments
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.available}
                </span>
                <span className="text-[11px] text-slate-500">
                  Appointments you can purchase
                </span>
              </Link>

              <Link
                href="/agent/my-appointments"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My appointments
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.myLeads}
                </span>
                <span className="text-[11px] text-slate-500">
                  Appointments assigned to you
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {stats.newLeads === 0
                    ? "No new appointments needing attention"
                    : `${stats.newLeads} new appointment${stats.newLeads === 1 ? "" : "s"} need attention`}
                </p>
              </Link>

              <Link
                href="/agent/my-appointments"
                className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm flex flex-col gap-1 transition hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Purchased this month
                </span>
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.purchasedThisMonth}
                </span>
                <span className="text-[11px] text-slate-500">
                  Appointments purchased in last 30 days
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
                  All-time appointment purchases
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
              {/* Left column - removed Recent leads section */}
              <div className="space-y-6 lg:col-span-2">
                {/* Available Appointments Card */}
                <div className="rounded-xl border border-slate-200 bg-white/70 shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2
                      className="text-lg font-normal text-[#2a2a2a]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Available Appointments
                    </h2>
                  </div>
                  <div className="px-6 py-4">
                    <div className="py-8 text-center">
                      <p className="mb-4 text-sm text-[#6b6b6b]">
                        Browse and purchase planning call appointments with families.
                      </p>
                      <Link
                        href="/agent/appointments"
                        className="inline-block rounded-full bg-[#2a2a2a] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors"
                      >
                        View Available Appointments
                      </Link>
                    </div>
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
                      href="/agent/appointments"
                      className="block rounded-md border border-slate-200 bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                    >
                      Browse available appointments
                    </Link>
                    <Link
                      href="/agent/my-appointments"
                      className="block rounded-md border border-slate-200 bg-[#faf8f5] px-4 py-2 text-sm text-[#2a2a2a] hover:bg-[#f7f4ef] transition-colors"
                    >
                      View my appointments
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
                      Tips for working appointments
                    </h2>
                  </div>
                  <div className="px-6 py-4">
                    <ul className="space-y-2 text-sm text-[#4a4a4a]">
                      <li className="flex items-start gap-2">
                        <span className="text-[#6b6b6b]">•</span>
                        <span>
                          Contact families within their requested time window
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6b6b6b]">•</span>
                        <span>
                          Mark appointments as completed or no-show after the call
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#6b6b6b]">•</span>
                        <span>
                          Review lead details before calling to prepare
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
