"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

type Lead = {
  id: string;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  service_type: string | null;
  created_at: string | null;
};

export default function PurchasedLeadsPage() {
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
          router.push("/agent");
          return;
        }

        const { data, error } = await supabaseClient
          .from("leads")
          .select("*")
          .eq("assigned_agent_id", user.id)
          .eq("status", "purchased_by_agent")
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
    <>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Purchased leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Leads you&apos;ve bought through EverLead, ready to be worked and
            tracked.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading purchased leads…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">
            You haven&apos;t purchased any leads yet.
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
                      Status
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#2a2a2a]">
                      {lead.status || "purchased_by_agent"}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
