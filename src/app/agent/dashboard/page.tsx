"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

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

        // Available leads = new, not yet assigned
        const { count: availableCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("status", "new");

        // My leads = any lead assigned to this agent
        const { count: myLeadsCount } = await supabaseClient
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("assigned_agent_id", agentId);

        // Purchased = leads assigned + marked as purchased
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">Agent Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:border-slate-400"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-600">Loading your stats…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Available leads card */}
            <Link
              href="/agent/leads/available"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Available leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.available}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                New leads you can buy or bid on.
              </p>
              <p className="mt-3 text-xs font-medium text-brand-600">
                View available leads →
              </p>
            </Link>

            {/* My leads card */}
            <Link
              href="/agent/leads/mine"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                My leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.myLeads}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                All leads currently assigned to you.
              </p>
              <p className="mt-3 text-xs font-medium text-brand-600">
                View my leads →
              </p>
            </Link>

            {/* Purchased leads card */}
            <Link
              href="/agent/leads/purchased"
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Purchased leads
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {stats.purchased}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Leads you've bought through EverLead.
              </p>
              <p className="mt-3 text-xs font-medium text-brand-600">
                View purchased leads →
              </p>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
