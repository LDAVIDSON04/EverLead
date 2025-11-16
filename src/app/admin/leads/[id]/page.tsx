// src/app/admin/leads/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type Lead = {
  id: string;
  created_at: string;
  full_name: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  buy_now_price_cents: number | null;
  // Auction fields
  auction_enabled: boolean;
  auction_ends_at: string | null;
  buy_now_price: number | null;
  current_bid_amount: number | null;
  current_bid_agent_id: string | null;
};

export default function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [auctionEnabled, setAuctionEnabled] = useState(false);
  const [buyNowPrice, setBuyNowPrice] = useState<string>("");
  const [auctionEndsAt, setAuctionEndsAt] = useState<string>("");

  useEffect(() => {
    async function loadLead() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: leadError } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (leadError) {
          console.error(leadError);
          setError("Failed to load lead.");
          setLoading(false);
          return;
        }

        if (!data) {
          setError("Lead not found.");
          setLoading(false);
          return;
        }

        const leadData = data as Lead;
        setLead(leadData);
        setAuctionEnabled(leadData.auction_enabled || false);
        setBuyNowPrice(
          leadData.buy_now_price
            ? leadData.buy_now_price.toString()
            : leadData.buy_now_price_cents
            ? (leadData.buy_now_price_cents / 100).toString()
            : ""
        );
        setAuctionEndsAt(
          leadData.auction_ends_at
            ? new Date(leadData.auction_ends_at)
                .toISOString()
                .slice(0, 16)
            : ""
        );
      } catch (err) {
        console.error(err);
        setError("Unexpected error loading lead.");
      } finally {
        setLoading(false);
      }
    }

    loadLead();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      const updateData: any = {
        auction_enabled: auctionEnabled,
      };

      if (buyNowPrice) {
        const price = parseFloat(buyNowPrice);
        if (!isNaN(price) && price > 0) {
          updateData.buy_now_price = price;
          updateData.buy_now_price_cents = Math.round(price * 100);
        }
      }

      if (auctionEndsAt) {
        updateData.auction_ends_at = new Date(auctionEndsAt).toISOString();
      } else {
        updateData.auction_ends_at = null;
      }

      const { error: updateError } = await supabaseClient
        .from("leads")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        setError("Failed to update lead.");
        setSaving(false);
        return;
      }

      // Reload lead
      const { data } = await supabaseClient
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        const leadData = data as Lead;
        setLead(leadData);
        setAuctionEnabled(leadData.auction_enabled || false);
        setBuyNowPrice(
          leadData.buy_now_price
            ? leadData.buy_now_price.toString()
            : leadData.buy_now_price_cents
            ? (leadData.buy_now_price_cents / 100).toString()
            : ""
        );
        setAuctionEndsAt(
          leadData.auction_ends_at
            ? new Date(leadData.auction_ends_at).toISOString().slice(0, 16)
            : ""
        );
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error saving lead.");
    } finally {
      setSaving(false);
    }
  }

  const formatMoney = (cents: number | null) =>
    cents ? `$${(cents / 100).toFixed(2)}` : "-";

  const formatPriceDollars = (price: number | null) =>
    price ? `$${price.toFixed(2)}` : "-";

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
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
            <button
              onClick={() => router.push("/admin/leads")}
              className="text-xs text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
            >
              ← Back to leads
            </button>
            <button
              onClick={() => (window.location.href = "/logout")}
              className="rounded-md border border-[#ded3c2] bg-white px-3 py-1 text-xs font-medium text-[#6b6b6b] hover:bg-[#f7f4ef] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Lead Details
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading lead…</p>
        ) : !lead ? (
          <p className="text-sm text-[#6b6b6b]">Lead not found.</p>
        ) : (
          <div className="space-y-6">
            {/* Lead Info */}
            <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-normal text-[#2a2a2a]">Lead Information</h2>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Name
                  </dt>
                  <dd className="mt-1 text-[#2a2a2a]">{lead.full_name || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    City
                  </dt>
                  <dd className="mt-1 text-[#2a2a2a]">{lead.city || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Status
                  </dt>
                  <dd className="mt-1 text-[#2a2a2a]">{lead.status || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                    Urgency
                  </dt>
                  <dd className="mt-1 text-[#2a2a2a]">{lead.urgency_level || "-"}</dd>
                </div>
              </dl>
            </div>

            {/* Auction Settings */}
            <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-normal text-[#2a2a2a]">Auction Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={auctionEnabled}
                      onChange={(e) => setAuctionEnabled(e.target.checked)}
                      className="rounded border-[#ded3c2] text-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                    />
                    <span className="text-sm font-medium text-[#2a2a2a]">
                      Enable auction for this lead
                    </span>
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Buy Now Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyNowPrice}
                    onChange={(e) => setBuyNowPrice(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#4a4a4a]">
                    Auction End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={auctionEndsAt}
                    onChange={(e) => setAuctionEndsAt(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full bg-[#2a2a2a] px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Auction Status */}
            {lead.auction_enabled && (
              <div className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-normal text-[#2a2a2a]">Current Auction Status</h2>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Auction Status
                    </dt>
                    <dd className="mt-1 text-[#2a2a2a]">
                      {lead.auction_enabled ? "On" : "Off"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Buy Now Price
                    </dt>
                    <dd className="mt-1 text-[#2a2a2a]">
                      {formatPriceDollars(lead.buy_now_price) ||
                        formatMoney(lead.buy_now_price_cents) ||
                        "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Highest Bid
                    </dt>
                    <dd className="mt-1 text-[#2a2a2a]">
                      {formatPriceDollars(lead.current_bid_amount) || "No bids yet"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Auction Ends At
                    </dt>
                    <dd className="mt-1 text-[#2a2a2a]">
                      {lead.auction_ends_at
                        ? new Date(lead.auction_ends_at).toLocaleString()
                        : "No end date set"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

