// src/app/admin/leads/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { MARKETPLACE_CONTACT_US_SERVICE_TYPE } from "@/lib/marketplaceContactLead";

type Lead = {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service_type: string | null;
  assigned_agent_id: string | null;
  city: string | null;
  urgency_level: string | null;
  status: string | null;
  buy_now_price_cents: number | null;
  price_charged_cents: number | null;
  // Auction fields
  auction_enabled: boolean;
  auction_ends_at: string | null;
  buy_now_price: number | null;
  current_bid_amount: number | null;
  current_bid_agent_id: string | null;
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<"all" | "marketplace_contact">("all");

  useEffect(() => {
    async function loadLeads() {
        const { data, error } = await supabaseClient
          .from("leads")
          .select(
            "id, created_at, full_name, email, phone, service_type, assigned_agent_id, city, urgency_level, status, buy_now_price_cents, price_charged_cents, auction_enabled, auction_ends_at, buy_now_price, current_bid_amount, current_bid_agent_id"
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

  const marketplaceContactCount = useMemo(
    () =>
      leads.filter((l) => l.service_type === MARKETPLACE_CONTACT_US_SERVICE_TYPE)
        .length,
    [leads]
  );

  const filteredLeads = useMemo(() => {
    if (listFilter === "marketplace_contact") {
      return leads.filter((l) => l.service_type === MARKETPLACE_CONTACT_US_SERVICE_TYPE);
    }
    return leads;
  }, [leads, listFilter]);

  const formatMoney = (cents: number | null) =>
    cents ? `$${(cents / 100).toFixed(2)}` : "-";

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      {/* Header */}
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
            <span className="text-xs text-[#6b6b6b]">Owner view</span>
            <button
              onClick={() => (window.location.href = "/logout")}
              className="rounded-md border border-[#ded3c2] bg-white px-3 py-1 text-xs font-medium text-[#6b6b6b] hover:bg-[#f7f4ef] transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1
            className="mb-2 text-2xl font-normal text-[#2a2a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            All Leads
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            Complete list of all leads in the system. Soradin search &quot;Contact Us&quot; submissions are saved as
            leads (name, email, phone, assigned agent); use &quot;Contact Us only&quot; to review them.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#2a2a2a]">
              <span className="font-semibold">{marketplaceContactCount}</span>{" "}
              <span className="text-[#6b6b6b]">marketplace Contact Us form{marketplaceContactCount === 1 ? "" : "s"}</span>
            </p>
            <div className="flex rounded-md border border-[#ded3c2] bg-white p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={`rounded px-3 py-1.5 transition-colors ${
                  listFilter === "all"
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#6b6b6b] hover:text-[#2a2a2a]"
                }`}
              >
                All leads
              </button>
              <button
                type="button"
                onClick={() => setListFilter("marketplace_contact")}
                className={`rounded px-3 py-1.5 transition-colors ${
                  listFilter === "marketplace_contact"
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#6b6b6b] hover:text-[#2a2a2a]"
                }`}
              >
                Contact Us only
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {leads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No leads yet.</p>
        ) : filteredLeads.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No leads match this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#ded3c2] bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#ded3c2] bg-[#faf8f5]">
                  <Th>ID</Th>
                  <Th>Created</Th>
                  <Th>Type</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Agent</Th>
                  <Th>City</Th>
                  <Th>Urgency</Th>
                  <Th>Status</Th>
                  <Th>Buy Now</Th>
                  <Th>Paid</Th>
                  <Th>Auction</Th>
                  <Th>Highest Bid</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[#f3f4f6] hover:bg-[#faf8f5]"
                  >
                    <Td>{lead.id.slice(0, 8)}…</Td>
                    <Td>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </Td>
                    <Td>
                      {lead.service_type === MARKETPLACE_CONTACT_US_SERVICE_TYPE ? (
                        <span className="inline-block rounded-full border border-[#c4b8a8] bg-[#faf8f5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4a4a4a]">
                          Contact Us
                        </span>
                      ) : (
                        <span className="text-[#9a9a9a]">—</span>
                      )}
                    </Td>
                    <Td>{lead.full_name || "-"}</Td>
                    <Td className="max-w-[11rem] whitespace-normal">
                      {lead.email ? (
                        <span className="block truncate font-mono text-xs" title={lead.email}>
                          {lead.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="max-w-[8rem] whitespace-normal">
                      {lead.phone ? (
                        <span className="block truncate text-xs" title={lead.phone}>
                          {lead.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="font-mono text-xs text-[#6b6b6b]">
                      {lead.assigned_agent_id ? `${lead.assigned_agent_id.slice(0, 8)}…` : "—"}
                    </Td>
                    <Td>{lead.city || "-"}</Td>
                    <Td>{lead.urgency_level || "-"}</Td>
                    <Td>{lead.status || "-"}</Td>
                    <Td>
                      {formatMoney(lead.buy_now_price_cents) ||
                        (lead.buy_now_price ? `$${lead.buy_now_price.toFixed(2)}` : "-")}
                    </Td>
                    <Td>{formatMoney(lead.price_charged_cents)}</Td>
                    <Td>
                      {lead.auction_enabled ? (
                        <span className="text-xs text-neutral-600">On</span>
                      ) : (
                        <span className="text-xs text-[#6b6b6b]">Off</span>
                      )}
                    </Td>
                    <Td>
                      {lead.current_bid_amount
                        ? `$${lead.current_bid_amount.toFixed(2)}`
                        : "-"}
                    </Td>
                    <Td>
                      <a
                        href={`/admin/leads/${lead.id}`}
                        className="text-xs font-medium text-[#6b6b6b] hover:text-[#2a2a2a] transition-colors"
                      >
                        Edit →
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 text-sm text-[#4a4a4a] ${className}`.trim()}>
      {children}
    </td>
  );
}
