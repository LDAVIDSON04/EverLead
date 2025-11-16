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
    return <p style={{ color: "#DC2626" }}>{error}</p>;
  }

  if (!stats) {
    return <p>Loading dashboard...</p>;
  }

  const formatMoney = (cents: number) =>
    `$${(cents / 100).toFixed(2)}`;

  return (
    <div style={{ maxWidth: "720px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: 0 }}>
          Admin Dashboard
        </h1>
        <button
          onClick={() => (window.location.href = "/logout")}
          style={{
            fontSize: "12px",
            borderRadius: "999px",
            padding: "4px 10px",
            border: "1px solid #E5E7EB",
            background: "white",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <StatCard label="Total Leads" value={stats.totalLeads} />
        <StatCard label="Hot Leads" value={stats.hotLeads} />
        <StatCard label="Warm Leads" value={stats.warmLeads} />
        <StatCard label="Cold Leads" value={stats.coldLeads} />
        <StatCard label="Purchased Leads" value={stats.purchasedLeads} />
        <StatCard
          label="Total Revenue"
          value={formatMoney(stats.totalRevenueCents)}
        />
      </div>

      <p style={{ fontSize: "14px", color: "#4B5563" }}>
        This view is your owner / house portal. It summarizes every lead that
        has come through the system and how much revenue you've generated from
        Buy Now purchases.
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        padding: "12px",
      }}
    >
      <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "18px", fontWeight: 600 }}>{value}</p>
    </div>
  );
}

