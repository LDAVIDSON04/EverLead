// src/app/agent/leads/available/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type Lead = {
  id: string;
  city: string | null;
  urgency_level: string | null;
  service_type: string | null;
  buy_now_price_cents: number | null;
  status: string | null;
};

type HighestBidsMap = Record<string, number>; // leadId -> amount_cents

export default function AvailableLeads() {
  const { loading, ok } = useRequireRole("agent");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [highestBids, setHighestBids] = useState<HighestBidsMap>({});
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;

    async function loadLeadsAndBids() {
      setError(null);

      // 1) Load leads that are still purchasable
      const { data: leadData, error: leadError } = await supabaseClient
        .from("leads")
        .select(
          "id, city, urgency_level, service_type, buy_now_price_cents, status"
        )
        .eq("status", "new")
        .not("buy_now_price_cents", "is", null)
        .order("created_at", { ascending: false });

      if (leadError) {
        console.error(leadError);
        setError("Failed to load leads.");
        return;
      }

      const typedLeads = (leadData || []) as Lead[];
      setLeads(typedLeads);

      if (typedLeads.length === 0) {
        setHighestBids({});
        return;
      }

      // 2) Load all bids for these leads
      const leadIds = typedLeads.map((l) => l.id);

      const { data: bidData, error: bidError } = await supabaseClient
        .from("bids")
        .select("lead_id, amount_cents")
        .in("lead_id", leadIds);

      if (bidError) {
        console.error(bidError);
        setHighestBids({});
        return;
      }

      const bids = bidData || [];

      const map: HighestBidsMap = {};
      for (const b of bids as any[]) {
        const leadId: string = b.lead_id;
        const amount: number = b.amount_cents;
        if (!map[leadId] || amount > map[leadId]) {
          map[leadId] = amount;
        }
      }

      setHighestBids(map);
    }

    loadLeadsAndBids();
  }, [ok]);

  if (loading) {
    return <p>Checking access…</p>;
  }

  if (!ok) {
    return null;
  }

  async function handleBuyNow(leadId: string) {
    try {
      setBuyingId(leadId);
      setError(null);

      // Get current agent
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        setError("You must be logged in to purchase leads.");
        setBuyingId(null);
        return;
      }

      const agentId = user.id;

      // 1) Try to use free lead first
      const freeRes = await fetch("/api/leads/free-purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId, agentId }),
      });

      if (freeRes.ok) {
        // Free lead success – go straight to success page
        window.location.href = `/agent/leads/success?leadId=${leadId}&free=1`;
        return;
      } else {
        // Not eligible for free, or some other error - read error code
        let errorCode: string | undefined;
        try {
          const data = await freeRes.json();
          errorCode = data?.error;
        } catch {
          // ignore parse errors
        }

        if (errorCode && errorCode !== "FIRST_LEAD_ALREADY_USED") {
          // Some unexpected error – show message and abort
          setError("Could not use free lead. Please try again or contact support.");
          setBuyingId(null);
          return;
        }
        // If FIRST_LEAD_ALREADY_USED or free not available, we fall through to Stripe
      }

      // 2) Fall back to Stripe Checkout
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to start checkout.");
        setBuyingId(null);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned.");
        setBuyingId(null);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting checkout.");
      setBuyingId(null);
    }
  }

  function handleBidInputChange(leadId: string, value: string) {
    setBidInputs((prev) => ({
      ...prev,
      [leadId]: value,
    }));
  }

  async function handlePlaceBid(leadId: string) {
    setError(null);

    const raw = bidInputs[leadId];
    if (!raw) {
      setError("Enter a bid amount first.");
      return;
    }

    const amountFloat = parseFloat(raw);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError("Bid amount must be a positive number.");
      return;
    }

    const amountCents = Math.round(amountFloat * 100);

    try {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        setError("You must be logged in to place a bid.");
        return;
      }

      const currentHighest = highestBids[leadId] || 0;
      if (amountCents <= currentHighest) {
        setError("Your bid must be higher than the current highest bid.");
        return;
      }

      const { error: bidError } = await supabaseClient.from("bids").insert({
        lead_id: leadId,
        agent_id: user.id,
        amount_cents: amountCents,
      });

      if (bidError) {
        console.error(bidError);
        setError("Failed to place bid.");
        return;
      }

      setHighestBids((prev) => ({
        ...prev,
        [leadId]: amountCents,
      }));

      setBidInputs((prev) => ({
        ...prev,
        [leadId]: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Something went wrong placing your bid.");
    }
  }

  function formatMoney(cents: number | null | undefined) {
    if (!cents) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>
        Available Leads
      </h1>

      {error && (
        <p style={{ color: "#DC2626", marginBottom: "12px" }}>{error}</p>
      )}

      {leads.length === 0 ? (
        <p>No purchasable leads right now.</p>
      ) : (
        leads.map((lead) => {
          const highest = highestBids[lead.id] || 0;

          return (
            <div
              key={lead.id}
              style={{
                border: "1px solid #E5E7EB",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                {lead.city || "Unknown city"}
              </h3>

              <p style={{ marginBottom: "4px" }}>
                <strong>Status:</strong> {lead.status}
              </p>

              <p style={{ marginBottom: "4px" }}>
                <strong>Urgency:</strong> {lead.urgency_level || "n/a"}
              </p>

              <p style={{ marginBottom: "4px" }}>
                <strong>Service:</strong> {lead.service_type || "Unknown"}
              </p>

              <p style={{ marginBottom: "4px" }}>
                <strong>Buy Now:</strong> {formatMoney(lead.buy_now_price_cents)}
              </p>

              <p style={{ marginBottom: "8px" }}>
                <strong>Current highest bid:</strong>{" "}
                {highest > 0 ? formatMoney(highest) : "No bids yet"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter bid (e.g. 25)"
                    value={bidInputs[lead.id] ?? ""}
                    onChange={(e) =>
                      handleBidInputChange(lead.id, e.target.value)
                    }
                    style={{
                      flex: 1,
                      padding: "6px",
                      borderRadius: "4px",
                      border: "1px solid #E5E7EB",
                    }}
                  />
                  <span style={{ fontSize: "14px" }}>$ CAD</span>
                  <button
                    onClick={() => handlePlaceBid(lead.id)}
                    style={{
                      background: "#F59E0B",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Place bid
                  </button>
                </div>

                <button
                  onClick={() => handleBuyNow(lead.id)}
                  disabled={buyingId === lead.id}
                  style={{
                    background: "#2563EB",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    opacity: buyingId === lead.id ? 0.7 : 1,
                    alignSelf: "flex-start",
                  }}
                >
                  {buyingId === lead.id
                    ? "Processing..."
                    : "Buy Now (first lead free)"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
