"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Download } from "lucide-react";

type AdminPayment = {
  id: string;
  created_at: string;
  appointment_id: string | null;
  amount_cents: number;
  fee_cents: number | null;
  status: string;
  family_name?: string | null;
  specialist_name?: string | null;
};

export default function AdminPaymentsPage() {
  useRequireRole("admin");

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: paymentsData, error: paymentsError } = await supabaseClient
          .from("payments")
          .select(`
            id,
            created_at,
            appointment_id,
            amount_cents,
            fee_cents,
            status
          `)
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;

        // Fetch appointment data if we have appointment_ids
        const appointmentIds = allPayments.map((p: any) => p.appointment_id).filter(Boolean);
        let appointmentsMap: Record<string, any> = {};
        let leadIds: string[] = [];
        let agentIds: string[] = [];

        if (appointmentIds.length > 0) {
          const { data: appointmentsData } = await supabaseClient
            .from("appointments")
            .select("id, lead_id, agent_id")
            .in("id", appointmentIds);
          
          (appointmentsData || []).forEach((apt: any) => {
            appointmentsMap[apt.id] = apt;
            if (apt.lead_id) leadIds.push(apt.lead_id);
            if (apt.agent_id) agentIds.push(apt.agent_id);
          });
        }

        // Fetch leads data
        let leadsMap: Record<string, any> = {};
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabaseClient
            .from("leads")
            .select("id, full_name")
            .in("id", leadIds);
          
          (leadsData || []).forEach((lead: any) => {
            leadsMap[lead.id] = lead;
          });
        }

        // Fetch agent/specialist data
        let agentsMap: Record<string, any> = {};
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabaseClient
            .from("profiles")
            .select("id, full_name")
            .in("id", agentIds);
          
          (agentsData || []).forEach((agent: any) => {
            agentsMap[agent.id] = agent;
          });
        }

        const rows: AdminPayment[] = allPayments.map((p: any) => {
          const appointment = appointmentsMap[p.appointment_id];
          const lead = appointment?.lead_id ? leadsMap[appointment.lead_id] : null;
          const agent = appointment?.agent_id ? agentsMap[appointment.agent_id] : null;
          
          return {
            id: p.id,
            created_at: p.created_at,
            appointment_id: p.appointment_id,
            amount_cents: p.amount_cents,
            fee_cents: p.fee_cents,
            status: p.status,
            family_name: lead?.full_name || null,
            specialist_name: agent?.full_name || null,
          };
        });

        setPayments(rows);
      } catch (err: any) {
        console.error("Error loading payments:", err);
        setError(err.message || "Failed to load payments");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalRevenue =
    payments.reduce((sum, p) => sum + (p.status === "completed" ? p.amount_cents : 0), 0) / 100;
  const totalFees =
    payments.reduce(
      (sum, p) => sum + (p.status === "completed" ? p.fee_cents ?? 0 : 0),
      0
    ) / 100;
  const totalRefunds =
    payments.reduce((sum, p) => sum + (p.status === "refunded" ? p.amount_cents : 0), 0) / 100;

  const statusClass = (status: string) => {
    if (status === "completed") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "failed") return "bg-red-100 text-red-700";
    if (status === "refunded") return "bg-neutral-100 text-neutral-700";
    return "bg-neutral-100 text-neutral-700";
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-600">Loading payments…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl mb-2 text-black">Payments</h1>
          <p className="text-neutral-600">View transactions and revenue</p>
        </div>
        <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-neutral-600 mb-1">Total Revenue</p>
          <p className="text-3xl text-black">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-neutral-600 mb-1">Platform Fees Collected</p>
          <p className="text-3xl text-black">${totalFees.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <p className="text-sm text-neutral-600 mb-1">Refunds Issued</p>
          <p className="text-3xl text-black">${totalRefunds.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Appointment</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Specialist</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Platform Fee</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {payments.map((txn) => (
                <tr key={txn.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm text-black">{txn.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {new Date(txn.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {txn.appointment_id ? txn.appointment_id.slice(0, 8) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {txn.family_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {txn.specialist_name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    ${(txn.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-700">
                    ${((txn.fee_cents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs ${statusClass(
                        txn.status
                      )}`}
                    >
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-6 text-sm text-neutral-600 text-center"
                  >
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
