"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { AgentNav } from "@/components/AgentNav";

type Lead = {
  id: string;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  created_at: string | null;
};

export default function MyLeadsPage() {
  useRequireRole("agent");

  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("assigned_agent_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
        }

        setLeads(data || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  function formatUrgency(u: string | null) {
    if (!u) return "Unknown";
    const lower = u.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return u;
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
        <h1 className="mb-2 text-lg font-semibold text-slate-900">
          My leads
        </h1>
        <p className="mb-4 text-xs text-slate-500">
          All leads currently assigned to you, regardless of status.
        </p>

        {loading ? (
          <p className="text-sm text-slate-600">Loading your leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-600">
            You don&apos;t have any leads yet.
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
                      Status
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {lead.status || "Unknown"}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
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
