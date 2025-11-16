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
          <div className="grid gap-4 md:grid-cols-3">
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
        )}
      </section>
    </main>
  );
}
