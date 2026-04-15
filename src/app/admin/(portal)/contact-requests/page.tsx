"use client";

import { useEffect, useMemo, useState } from "react";
import { getAdminAuthHeaders } from "@/lib/adminAuth";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import type { MarketplaceContactRequestRow } from "@/app/api/admin/marketplace-contact-requests/route";
import { MessageSquare } from "lucide-react";

function channelLabel(c: string): string {
  if (c === "reveal") return "Contact me";
  if (c === "phone") return "Phone";
  if (c === "email") return "Email";
  return c;
}

function sourceLabel(s: string): string {
  if (s === "search") return "Search";
  if (s === "agent_profile") return "Profile";
  return s;
}

export default function AdminContactRequestsPage() {
  useRequireRole("admin");

  const [events, setEvents] = useState<MarketplaceContactRequestRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; reveal: number; phone: number; email: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch("/api/admin/marketplace-contact-requests?limit=500", { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load");
        }
        if (cancelled) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
        setSummary(data.summary ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = agentFilter.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        (e.agent_name && e.agent_name.toLowerCase().includes(q)) ||
        e.agent_id.toLowerCase().includes(q)
    );
  }, [events, agentFilter]);

  const byAgent = useMemo(() => {
    const m = new Map<string, { name: string | null; reveal: number; phone: number; email: number }>();
    for (const e of events) {
      const cur = m.get(e.agent_id) ?? {
        name: e.agent_name,
        reveal: 0,
        phone: 0,
        email: 0,
      };
      if (e.channel === "reveal") cur.reveal += 1;
      else if (e.channel === "phone") cur.phone += 1;
      else if (e.channel === "email") cur.email += 1;
      cur.name = e.agent_name ?? cur.name;
      m.set(e.agent_id, cur);
    }
    return Array.from(m.entries())
      .map(([agentId, v]) => ({ agentId, ...v, total: v.reveal + v.phone + v.email }))
      .sort((a, b) => b.total - a.total);
  }, [events]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start gap-3 mb-8">
        <div className="rounded-lg bg-neutral-100 p-2">
          <MessageSquare className="h-6 w-6 text-neutral-800" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Contact Requests</h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Taps on <strong>Contact me</strong>, <strong>phone</strong>, and <strong>email</strong> for agents who use
            contact-only listings (not calendar booking). Each row is one event.
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total events</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{summary.total}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contact me</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{summary.reveal}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Phone taps</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{summary.phone}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Email taps</p>
              <p className="text-2xl font-semibold text-neutral-900 mt-1">{summary.email}</p>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="agentFilter" className="sr-only">
              Filter by agent
            </label>
            <input
              id="agentFilter"
              type="search"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Filter table by agent name or ID…"
              className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <h2 className="text-lg font-semibold text-neutral-900 mb-3">By agent</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm mb-10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-700">Agent</th>
                  <th className="px-4 py-3 font-medium text-neutral-700 text-right">Contact me</th>
                  <th className="px-4 py-3 font-medium text-neutral-700 text-right">Phone</th>
                  <th className="px-4 py-3 font-medium text-neutral-700 text-right">Email</th>
                  <th className="px-4 py-3 font-medium text-neutral-700 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {byAgent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  byAgent.map((row) => (
                    <tr key={row.agentId} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{row.name || "—"}</div>
                        <div className="text-xs text-neutral-500 font-mono">{row.agentId}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.reveal}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.phone}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.email}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{row.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Recent events</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <th className="px-4 py-3 font-medium text-neutral-700">Time (UTC)</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Agent</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Action</th>
                  <th className="px-4 py-3 font-medium text-neutral-700">Where</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                      {events.length === 0 ? "No events yet." : "No rows match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                        {new Date(e.created_at).toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{e.agent_name || "—"}</div>
                        <div className="text-xs text-neutral-500 font-mono">{e.agent_id}</div>
                      </td>
                      <td className="px-4 py-3">{channelLabel(e.channel)}</td>
                      <td className="px-4 py-3">{sourceLabel(e.source)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
