"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import clsx from "clsx";

type Lead = {
  id: string;
  city: string | null;
  urgency_level: string | null;
  agent_status: string | null;
  service_type: string | null;
  created_at: string | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_followup", label: "In follow-up" },
  { value: "closed_won", label: "Closed – won" },
  { value: "closed_lost", label: "Closed – lost" },
];

export default function MyLeadsPage() {
  useRequireRole("agent");

  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "in_followup" | "closed_won" | "closed_lost">("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(100); // Load 100 leads at a time (agents may have many)
  const [totalLeads, setTotalLeads] = useState(0);
  const [hasMoreLeads, setHasMoreLeads] = useState(false);

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

        // Fetch leads for this agent with pagination
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error, count } = await supabaseClient
          .from("leads")
          .select("*", { count: 'exact' })
          .eq("assigned_agent_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error(error);
        }

        // Set pagination state
        const totalCount = count || 0;
        setTotalLeads(totalCount);
        setHasMoreLeads((from + (data?.length || 0)) < totalCount);

        // Append or replace leads based on page
        if (currentPage === 0) {
          setLeads(data || []);
        } else {
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const uniqueNewLeads = (data || []).filter((l: Lead) => !existingIds.has(l.id));
            return [...prev, ...uniqueNewLeads];
          });
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router, currentPage, pageSize]); // Reload when page changes

  // Function to load more leads
  const loadMoreLeads = () => {
    setCurrentPage(prev => prev + 1);
  };

  function formatUrgency(u: string | null) {
    if (!u) return "Unknown";
    const lower = u.toLowerCase();
    if (lower === "hot") return "Hot";
    if (lower === "warm") return "Warm";
    if (lower === "cold") return "Cold";
    return u;
  }

  function formatStatus(status: string | null): string {
    if (!status) return "New";
    const option = STATUS_OPTIONS.find((opt) => opt.value === status);
    return option ? option.label : status;
  }

  function getStatusColors(status: string | null): { bg: string; text: string } {
    const s = (status ?? "new").toLowerCase();
    if (s === "new") return { bg: "bg-blue-100", text: "text-blue-700" };
    if (s === "contacted") return { bg: "bg-slate-100", text: "text-slate-700" };
    if (s.includes("follow")) return { bg: "bg-amber-100", text: "text-amber-700" };
    if (s.includes("won")) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (s.includes("lost")) return { bg: "bg-rose-100", text: "text-rose-700" };
    return { bg: "bg-slate-100", text: "text-slate-700" };
  }

  return (
    <>
      <section className="w-full">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            My leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            All leads currently assigned to you, regardless of status.
          </p>
        </div>

        {/* Status filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "new", label: "New" },
            { key: "contacted", label: "Contacted" },
            { key: "in_followup", label: "In follow-up" },
            { key: "closed_won", label: "Closed – won" },
            { key: "closed_lost", label: "Closed – lost" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setStatusFilter(option.key as typeof statusFilter)
              }
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === option.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Loading your leads…</p>
        ) : (() => {
          // Apply client-side status filter
          const filteredMyLeads = leads.filter((lead) => {
            if (statusFilter === "all") return true;
            
            const s = (lead.agent_status ?? "").toLowerCase();
            
            if (statusFilter === "new") return s === "new";
            if (statusFilter === "contacted") return s === "contacted";
            if (statusFilter === "in_followup") return s.includes("follow");
            if (statusFilter === "closed_won") return s.includes("won");
            if (statusFilter === "closed_lost") return s.includes("lost");
            
            return true;
          });

          if (filteredMyLeads.length === 0) {
            return (
              <p className="text-sm text-[#6b6b6b]">
                {leads.length === 0
                  ? "You don't have any leads yet."
                  : "No leads match your filter."}
              </p>
            );
          }

          return (
            <div className="space-y-3">
              {filteredMyLeads.map((lead) => {
                const status = (lead.agent_status ?? "new") as string;
                const { bg, text } = getStatusColors(status);
                
                return (
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
                      <div className="flex items-center gap-3">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            bg,
                            text
                          )}
                        >
                          {formatStatus(lead.agent_status)}
                        </span>
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
                );
              ))}
              
              {/* Load More Button */}
              {hasMoreLeads && !loading && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMoreLeads}
                    className="px-6 py-2 bg-[#0C6F3C] text-white rounded-lg hover:bg-[#0C6F3C]/90 transition-colors"
                  >
                    Load More ({totalLeads - filteredMyLeads.length} remaining)
                  </button>
                </div>
              )}
              
              {loading && currentPage > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Loading more leads...
                </div>
              )}
            </div>
          );
        })()}
      </section>
    </>
  );
}
