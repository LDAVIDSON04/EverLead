"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";

type Lead = {
  id: string;
  created_at: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  suggested_price_cents: number | null;
};

export default function AvailableLeadsPage() {
  useRequireRole("agent");

  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [firstFreeAvailable, setFirstFreeAvailable] = useState(false);

  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError) {
          console.error(userError);
          setError("Failed to load user.");
          setLoading(false);
          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const currentUserId = user.id;
        setUserId(currentUserId);

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("first_free_redeemed")
          .eq("id", currentUserId)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
        }

        const alreadyRedeemed = profile?.first_free_redeemed === true;
        setFirstFreeAvailable(!alreadyRedeemed);

        const { data: leadsData, error: leadsError } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("status", "new")
          .order("created_at", { ascending: false });

        if (leadsError) {
          console.error(leadsError);
          setError("Failed to load leads.");
          setLoading(false);
          return;
        }

        setLeads(leadsData || []);
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading available leads.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleClaimFree(leadId: string) {
    if (!userId) return;
    setError(null);
    setClaimingId(leadId);

    try {
      const res = await fetch("/api/leads/free-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, agentId: userId }),
      });

      const body = await res.json();

      if (!res.ok) {
        console.error("Free purchase error:", body);
        if (body?.error === "FIRST_LEAD_ALREADY_USED") {
          setError("You have already used your first free lead.");
          setFirstFreeAvailable(false);
        } else if (body?.error === "LEAD_NOT_AVAILABLE") {
          setError("That lead is no longer available.");
        } else {
          setError(body?.error || "Failed to claim free lead.");
        }
        return;
      }

      setFirstFreeAvailable(false);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err) {
      console.error(err);
      setError("Unexpected error claiming free lead.");
    } finally {
      setClaimingId(null);
    }
  }

  async function handleBuyNow(leadId: string, priceCents?: number | null) {
    if (!userId) return;
    setError(null);
    setBuyingId(leadId);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const body = await res.json();

      if (!res.ok || !body?.url) {
        console.error("Checkout create error:", body);
        setError(body?.error || "Failed to start checkout.");
        setBuyingId(null);
        return;
      }

      window.location.href = body.url;
    } catch (err) {
      console.error(err);
      setError("Unexpected error starting checkout.");
      setBuyingId(null);
    }
  }

  function formatUrgency(urgency: string | null) {
    if (!urgency) return "Unknown";
    const lower = urgency.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return urgency;
  }

  function formatPrice(priceCents: number | null | undefined) {
    if (!priceCents || priceCents <= 0) return "Set at checkout";
    return `$${(priceCents / 100).toFixed(2)}`;
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
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
        </div>
      </header>

      <AgentNav />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Available leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            New pre-need inquiries you can buy or use your one-time free lead on.
          </p>
        </div>

        {firstFreeAvailable && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">First lead free for new agents 🎉</p>
            <p className="mt-1">
              You can claim <span className="font-semibold">one</span> lead for
              free. After you use this once, this offer disappears and all
              future leads are pay-per-lead.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">
            There are no available leads right now. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                      {formatUrgency(lead.urgency_level)} lead
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#2a2a2a]">
                      {lead.city || "Unknown location"}
                    </div>
                    <div className="text-xs text-[#6b6b6b]">
                      {lead.service_type || "Pre-need planning"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.15em] text-[#6b6b6b]">
                      Suggested price
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#2a2a2a]">
                      {formatPrice(lead.suggested_price_cents)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      handleBuyNow(lead.id, lead.suggested_price_cents)
                    }
                    disabled={buyingId === lead.id}
                    className="rounded-full bg-[#2a2a2a] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                  >
                    {buyingId === lead.id ? "Starting checkout…" : "Buy now"}
                  </button>

                  {firstFreeAvailable && (
                    <button
                      onClick={() => handleClaimFree(lead.id)}
                      disabled={claimingId === lead.id}
                      className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                    >
                      {claimingId === lead.id
                        ? "Claiming free lead…"
                        : "Use my one free lead"}
                    </button>
                  )}

                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="ml-auto text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
