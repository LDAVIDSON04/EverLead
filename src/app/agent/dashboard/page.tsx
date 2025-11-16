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

export default function AgentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    available: 0,
    myLeads: 0,
    purchased: 0,
  });
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

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Agent portal
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1 text-[11px] text-slate-700 hover:border-slate-400"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Agent nav */}
      <AgentNav />

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Overview
            </h1>
            <p className="text-xs text-slate-500">
              Quick snapshot of leads available in your territory.
            </p>
          </div>
          <Link
            href="/agent/leads/available"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            View available leads →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading your stats…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/agent/leads/available"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Available leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.available}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                New leads you can buy or bid on.
              </p>
            </Link>

            <Link
              href="/agent/leads/mine"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                My leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.myLeads}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Leads currently assigned to you.
              </p>
            </Link>

            <Link
              href="/agent/leads/purchased"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Purchased leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.purchased}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Leads you&apos;ve bought through EverLead.
              </p>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
