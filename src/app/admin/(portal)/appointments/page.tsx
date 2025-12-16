"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, DollarSign, Eye, XCircle } from "lucide-react";

type AdminAppointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount_cents: number | null;
  family_name: string | null;
  family_email: string | null;
  specialist_name: string | null;
  specialist_region: string | null;
};

export default function AdminAppointmentsPage() {
  useRequireRole("admin");

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Check if appointments table has new structure (family_id) or old structure (lead_id)
        // Old structure uses requested_date, new structure uses starts_at/ends_at
        let query = supabaseClient
          .from("appointments")
          .select(
            `
              id,
              requested_date,
              status,
              price_cents,
              lead_id,
              agent_id
            `
          )
          .order("requested_date", { ascending: false })
          .limit(100);

        const { data, error } = await query;

        if (error) throw error;

        // Fetch related data if available
        const appointmentIds = (data || []).map((apt: any) => apt.id);
        const leadIds = (data || []).map((apt: any) => apt.lead_id).filter(Boolean);
        const agentIds = (data || []).map((apt: any) => apt.agent_id).filter(Boolean);

        // Fetch leads data if we have lead_ids
        let leadsMap: Record<string, any> = {};
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabaseClient
            .from("leads")
            .select("id, full_name, email")
            .in("id", leadIds);
          
          (leadsData || []).forEach((lead: any) => {
            leadsMap[lead.id] = lead;
          });
        }

        // Fetch agent/specialist data if we have agent_ids
        let agentsMap: Record<string, any> = {};
        if (agentIds.length > 0) {
          const { data: agentsData } = await supabaseClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", agentIds);
          
          (agentsData || []).forEach((agent: any) => {
            agentsMap[agent.id] = agent;
          });
        }

        const rows: AdminAppointment[] = (data || []).map((apt: any) => {
          const lead = apt.lead_id ? leadsMap[apt.lead_id] : null;
          const agent = apt.agent_id ? agentsMap[apt.agent_id] : null;
          
          // Handle old structure: requested_date is a date, not a timestamp
          // Convert to ISO string for starts_at/ends_at
          const requestedDate = apt.requested_date 
            ? new Date(apt.requested_date).toISOString() 
            : new Date().toISOString();
          
          return {
            id: apt.id,
            starts_at: requestedDate,
            ends_at: requestedDate, // Old structure doesn't have end time, use same as start
            status: apt.status,
            amount_cents: apt.price_cents ?? null,
            family_name: lead?.full_name || null,
            family_email: lead?.email || null,
            specialist_name: agent?.full_name || null,
            specialist_region: null,
          };
        });

        setAppointments(rows);
      } catch (err: any) {
        console.error("Error loading admin appointments:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "booked":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getPaymentColor = (hasAmount: boolean) => {
    return hasAmount ? "text-emerald-700" : "text-neutral-600";
  };

  const filtered = appointments.filter((apt) => {
    if (statusFilter !== "all" && apt.status !== statusFilter) return false;
    if (paymentFilter === "paid" && !apt.amount_cents) return false;
    if (paymentFilter === "unpaid" && apt.amount_cents) return false;
    if (dateFilter) {
      const aptDate = new Date(apt.starts_at).toISOString().split("T")[0];
      if (aptDate !== dateFilter) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-600">Loading appointments…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-black">Appointments</h1>
        <p className="text-neutral-600">View and manage appointment disputes</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
        >
          <option value="all">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Specialist</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs text-neutral-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filtered.map((apt) => {
                const start = new Date(apt.starts_at);
                const end = new Date(apt.ends_at);
                const hasAmount = (apt.amount_cents ?? 0) > 0;
                return (
                  <tr key={apt.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-black">{apt.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="text-sm text-black">{start.toLocaleDateString()}</p>
                          <p className="text-xs text-neutral-500">
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                            –{" "}
                            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-black">{apt.family_name || "Unknown"}</p>
                        <p className="text-xs text-neutral-500">{apt.family_email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-black">{apt.specialist_name || "Unknown"}</p>
                        <p className="text-xs text-neutral-400">{apt.specialist_region || "—"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">Consultation</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs border ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${getPaymentColor(hasAmount)}`} />
                        <div>
                          <p className={`text-sm ${getPaymentColor(hasAmount)}`}>
                            {hasAmount ? `$${((apt.amount_cents ?? 0) / 100).toFixed(2)}` : "$0.00"}
                          </p>
                          <p className="text-xs text-neutral-500">{hasAmount ? "paid" : "unpaid"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Cancel & Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-neutral-600">
                    No appointments found
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
