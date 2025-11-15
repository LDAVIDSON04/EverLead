// src/app/agent/leads/mine/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function MyLeads() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeads() {
      // NOTE: MVP – we don't have agent auth yet
      // We'll just show purchased leads
      const { data, error } = await supabaseClient
        .from("leads")
        .select("*")
        .eq("status", "purchased_by_agent");

      if (!error && data) setLeads(data);
    }

    loadLeads();
  }, []);

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        My Leads
      </h1>

      {leads.length === 0 ? (
        <p>You have not purchased any leads yet.</p>
      ) : (
        leads.map((lead) => (
          <div
            key={lead.id}
            style={{
              border: "1px solid #E5E7EB",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
              {lead.full_name}
            </h3>
            <p><strong>Email:</strong> {lead.email}</p>
            <p><strong>Phone:</strong> {lead.phone}</p>
            <p><strong>City:</strong> {lead.city}</p>
            <p><strong>Service:</strong> {lead.service_type}</p>
            <p><strong>Notes:</strong> {lead.additional_notes}</p>
          </div>
        ))
      )}
    </div>
  );
}

