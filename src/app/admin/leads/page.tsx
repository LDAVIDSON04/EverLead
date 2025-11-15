// src/app/admin/leads/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Lead = {
  id: string;
  created_at: string;
  full_name: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  buy_now_price_cents: number | null;
  price_charged_cents: number | null;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await supabaseClient
        .from("leads")
        .select(
          "id, created_at, full_name, city, urgency_level, status, buy_now_price_cents, price_charged_cents"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Failed to load leads.");
        return;
      }

      setLeads((data || []) as Lead[]);
    }

    loadLeads();
  }, []);

  const formatMoney = (cents: number | null) =>
    cents ? `$${(cents / 100).toFixed(2)}` : "-";

  return (
    <div style={{ maxWidth: "960px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        All Leads
      </h1>

      {error && (
        <p style={{ color: "#DC2626", marginBottom: "12px" }}>{error}</p>
      )}

      {leads.length === 0 ? (
        <p>No leads yet.</p>
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
                <Th>ID</Th>
                <Th>Created</Th>
                <Th>Name</Th>
                <Th>City</Th>
                <Th>Urgency</Th>
                <Th>Status</Th>
                <Th>Buy Now</Th>
                <Th>Paid</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <Td>{lead.id.slice(0, 8)}…</Td>
                  <Td>{new Date(lead.created_at).toLocaleString()}</Td>
                  <Td>{lead.full_name || "-"}</Td>
                  <Td>{lead.city || "-"}</Td>
                  <Td>{lead.urgency_level || "-"}</Td>
                  <Td>{lead.status || "-"}</Td>
                  <Td>{formatMoney(lead.buy_now_price_cents)}</Td>
                  <Td>{formatMoney(lead.price_charged_cents)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

