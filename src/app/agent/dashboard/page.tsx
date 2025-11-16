// src/app/agent/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type Stats = {
  available: number;
  mine: number;
  purchased: number;
};

export default function AgentDashboard() {
  const { loading, ok } = useRequireRole("agent");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;

    async function loadStats() {
      try {
        setError(null);

        // Current user (agent)
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          setError("No user found.");
          return;
        }

        const agentId = user.id;

        // Available leads (status=new)
        const { data: available, error: availableError } = await supabaseClient
          .from("leads")
          .select("id")
          .eq("status", "new");

        if (availableError) {
          console.error(availableError);
          setError("Failed to load available leads.");
          return;
        }

        // My leads (assigned to this agent)
        const { data: mine, error: mineError } = await supabaseClient
          .from("leads")
          .select("id")
          .eq("assigned_agent_id", agentId);

        if (mineError) {
          console.error(mineError);
          setError("Failed to load your leads.");
          return;
        }

        // All purchased_by_agent (for quick overview)
        const { data: purchased, error: purchasedError } =
          await supabaseClient
            .from("leads")
            .select("id")
            .eq("status", "purchased_by_agent");

        if (purchasedError) {
          console.error(purchasedError);
          setError("Failed to load purchased leads.");
          return;
        }

        setStats({
          available: available?.length ?? 0,
          mine: mine?.length ?? 0,
          purchased: purchased?.length ?? 0,
        });
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading stats.");
      }
    }

    loadStats();
  }, [ok]);

  if (loading) {
    return <p>Checking access…</p>;
  }

  if (!ok) {
    // useRequireRole will redirect to login / correct dashboard
    return null;
  }

  if (error) {
    return <p style={{ color: "#DC2626" }}>{error}</p>;
  }

  if (!stats) {
    return <p>Loading dashboard…</p>;
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h1
          style={{ fontSize: "24px", fontWeight: 600, marginBottom: "0px" }}
        >
          Agent Dashboard
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

      <div style={{ display: "flex", gap: "16px" }}>
        <div
          style={{
            padding: "16px",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            width: "33%",
          }}
        >
          <h3 style={{ fontSize: "14px", color: "#6B7280" }}>
            Available Leads
          </h3>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>
            {stats.available}
          </p>
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
          <h3 style={{ fontSize: "14px", color: "#6B7280" }}>
            Purchased Leads
          </h3>
          <p style={{ fontSize: "20px", fontWeight: 700 }}>
            {stats.purchased}
          </p>
        </div>
      </div>
    </div>
  );
}
