// src/app/admin/bids/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type BidRow = {
  id: string;
  created_at: string;
  amount_cents: number;
  lead_id: string;
  agent_id: string;
};

export default function AdminBidsPage() {
  const { loading, ok } = useRequireRole("admin");
  const [bids, setBids] = useState<BidRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;

    async function loadBids() {
      const { data, error } = await supabaseClient
        .from("bids")
        .select("id, created_at, amount_cents, lead_id, agent_id")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error(error);
        setError("Failed to load bids.");
        return;
      }

      setBids((data || []) as BidRow[]);
    }

    loadBids();
  }, [ok]);

  if (loading) {
    return <p>Checking access…</p>;
  }

  if (!ok) {
    return null;
  }

  const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div style={{ maxWidth: "960px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        All Bids (Admin)
      </h1>

      {error && (
        <p style={{ color: "#DC2626", marginBottom: "12px" }}>{error}</p>
      )}

      {bids.length === 0 ? (
        <p>No bids yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Lead</Th>
                <Th>Agent</Th>
                <Th>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id}>
                  <Td>{new Date(b.created_at).toLocaleString()}</Td>
                  <Td>{b.lead_id.slice(0, 8)}…</Td>
                  <Td>{b.agent_id.slice(0, 8)}…</Td>
                  <Td>{formatMoney(b.amount_cents)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: "12px", fontSize: "13px", color: "#4B5563" }}>
        Later, you can add controls here to &quot;award&quot; a lead to the
        highest bidder or trigger a Stripe checkout link for the winner. For
        now, this gives you visibility into bidding activity.
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "8px",
        borderBottom: "1px solid #E5E7EB",
        background: "#F9FAFB",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "8px",
        borderBottom: "1px solid #F3F4F6",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}




