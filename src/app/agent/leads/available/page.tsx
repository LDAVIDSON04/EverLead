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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Agent portal
            </span>
          </div>
        </div>
      </header>

      <AgentNav />

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Available leads
            </h1>
            <p className="text-xs text-slate-500">
              New pre-need inquiries you can buy or use your one-time free
              lead on.
            </p>
          </div>
        </div>

        {firstFreeAvailable && (
          <div className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">First lead free for new agents 🎉</p>
            <p className="mt-1">
              You can claim <span className="font-semibold">one</span> lead for
              free. After you use this once, this offer disappears and all
              future leads are pay-per-lead.
            </p>
          </div>
        )}

        {error && (
          <p className="mb-3 text-xs text-red-600">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-600">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-600">
            There are no available leads right now. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {formatUrgency(lead.urgency_level)} lead
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {lead.city || "Unknown location"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lead.service_type || "Pre-need planning"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Suggested price
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatPrice(lead.suggested_price_cents)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleBuyNow(lead.id, lead.suggested_price_cents)
                    }
                    disabled={buyingId === lead.id}
                    className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {buyingId === lead.id ? "Starting checkout…" : "Buy now"}
                  </button>

                  {firstFreeAvailable && (
                    <button
                      onClick={() => handleClaimFree(lead.id)}
                      disabled={claimingId === lead.id}
                      className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {claimingId === lead.id
                        ? "Claiming free lead…"
                        : "Use my one free lead"}
                    </button>
                  )}

                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="text-[11px] font-medium text-slate-500 hover:text-brand-600"
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
