// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type DashboardStats = {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  purchasedLeads: number;
  totalRevenueCents: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("urgency_level, status, price_charged_cents");

      if (error) {
        console.error(error);
        setError("Failed to load dashboard stats.");
        return;
      }

      const leads = data || [];

      const totalLeads = leads.length;
      const hotLeads = leads.filter((l) => l.urgency_level === "hot").length;
      const warmLeads = leads.filter((l) => l.urgency_level === "warm").length;
      const coldLeads = leads.filter((l) => l.urgency_level === "cold").length;

      const purchasedLeads = leads.filter(
        (l) => l.status === "purchased_by_agent"
      ).length;

      const totalRevenueCents = leads
        .filter((l) => l.status === "purchased_by_agent")
        .reduce(
          (sum, l) => sum + (l.price_charged_cents || 0),
          0
        );

      setStats({
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        purchasedLeads,
        totalRevenueCents,
      });
    }

    loadStats();
  }, []);

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

  if (!stats) {
    return (
      <main className="min-h-screen bg-[#f7f4ef]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-[#6b6b6b]">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Overview of all leads and revenue in the system.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Leads" value={stats.totalLeads} />
          <StatCard label="Purchased Leads" value={stats.purchasedLeads} />
          <StatCard
            label="Total Revenue"
            value={formatMoney(stats.totalRevenueCents)}
          />
        </div>

        {/* Urgency Breakdown */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-normal text-[#2a2a2a]">By Urgency</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Hot Leads" value={stats.hotLeads} />
            <StatCard label="Warm Leads" value={stats.warmLeads} />
            <StatCard label="Cold Leads" value={stats.coldLeads} />
          </div>
        </div>

        <p className="text-sm text-[#6b6b6b]">
          This view is your owner / house portal. It summarizes every lead that
          has come through the system and how much revenue you&apos;ve generated
          from Buy Now purchases.
        </p>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
        {label}
      </p>
      <p className="text-xl font-semibold text-[#2a2a2a]">{value}</p>
    </div>
  );
}
