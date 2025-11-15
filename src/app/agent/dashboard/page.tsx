// src/app/agent/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AgentDashboard() {
  const [stats, setStats] = useState({
    available: 0,
    mine: 0,
    purchased: 0,
  });

  useEffect(() => {
    async function loadStats() {
      // Count available leads
      const { data: available } = await supabaseClient
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new")
        .in("urgency_level", ["hot", "warm"]);

      // Count leads assigned to this agent (MVP: not agent-specific yet)
      const { data: mine } = await supabaseClient
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "purchased_by_agent");

      setStats({
        available: available?.length ?? 0,
        mine: mine?.length ?? 0,
        purchased: mine?.length ?? 0,
      });
    }

    loadStats();
  }, []);

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        Agent Dashboard
      </h1>

      <div style={{ display: "flex", gap: "16px" }}>
        <div
          style={{
            padding: "16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            width: "33%",
          }}
        >
          <h3 style={{ fontSize: "14px", color: "#6B7280" }}>Available Leads</h3>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>{stats.available}</p>
        </div>

        <div
          style={{
            padding: "16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            width: "33%",
          }}
        >
          <h3 style={{ fontSize: "14px", color: "#6B7280" }}>My Leads</h3>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>{stats.mine}</p>
        </div>

        <div
          style={{
            padding: "16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            width: "33%",
          }}
        >
          <h3 style={{ fontSize: "14px", color: "#6B7280" }}>Purchased Leads</h3>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>{stats.purchased}</p>
        </div>
      </div>
    </div>
  );
}

