"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type Lead = {
  id: string;
  created_at: string | null;
  city: string | null;
  urgency_level: string | null; // "hot" | "warm" | "cold" | null
  status: string | null;
  service_type: string | null;
  suggested_price_cents: number | null;
};

export default function AvailableLeadsPage() {
  // Make sure only agents can be here
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
        // 1) Get current user
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

        // 2) Check if they already used their free lead
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

        // 3) Load available leads (status = "new")
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
        // Backend already enforces only one free lead; surface helpful message
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

      // Success: mark free flag off, remove that lead from the list, and redirect to success page
      setFirstFreeAvailable(false);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      router.push(`/agent/leads/success?leadId=${leadId}&free=1`);
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

      // Redirect to Stripe Checkout
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">Available Leads</h1>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {/* One-time free lead banner */}
        {firstFreeAvailable && (
          <div className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <p className="font-semibold">
              First lead free for new agents 🎉
            </p>
            <p className="mt-1">
              You can claim <span className="font-semibold">one</span> lead for
              free. After you use this once, this offer will disappear and all
              future leads are pay-per-lead.
            </p>
          </div>
        )}

        {error && (
          <p className="mb-3 text-xs text-red-600">
            {error}
          </p>
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
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    <div className="text-xs text-slate-500">Suggested price</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatPrice(lead.suggested_price_cents)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Buy now always available */}
                  <button
                    onClick={() =>
                      handleBuyNow(lead.id, lead.suggested_price_cents)
                    }
                    disabled={buyingId === lead.id}
                    className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {buyingId === lead.id ? "Starting checkout…" : "Buy now"}
                  </button>

                  {/* Free button only if firstFreeAvailable is true */}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
