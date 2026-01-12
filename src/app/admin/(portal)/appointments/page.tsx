"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, DollarSign, Eye, XCircle, X, Search } from "lucide-react";

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
  agent_id: string | null;
  lead_id: string | null;
};

export default function AdminAppointmentsPage() {
  useRequireRole("admin");

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [appointmentsThisMonth, setAppointmentsThisMonth] = useState<number>(0);
  const [agentSearch, setAgentSearch] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalData, setViewModalData] = useState<any>(null);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [appointmentToRefund, setAppointmentToRefund] = useState<AdminAppointment | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Check if appointments table has new structure (family_id) or old structure (lead_id)
        // Old structure uses requested_date, new structure uses starts_at/ends_at
        // Only fetch Soradin-created appointments (those with lead_id)
        // This excludes appointments agents added themselves manually
        let query = supabaseClient
          .from("appointments")
          .select(
            `
              id,
              requested_date,
              status,
              price_cents,
              lead_id,
              agent_id,
              created_at
            `
          )
          .not("lead_id", "is", null) // Only appointments created through Soradin (have a lead_id)
          .order("created_at", { ascending: false }) // Sort by booking date (most recent first)
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
            agent_id: apt.agent_id || null,
            lead_id: apt.lead_id || null,
          };
        });

        setAppointments(rows);

        // Calculate appointments this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const thisMonthCount = rows.filter((apt) => {
          const aptDate = new Date(apt.starts_at);
          return aptDate >= firstDayOfMonth && aptDate <= lastDayOfMonth;
        }).length;
        
        setAppointmentsThisMonth(thisMonthCount);
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
    if (agentSearch) {
      const searchLower = agentSearch.toLowerCase();
      const agentName = (apt.specialist_name || "").toLowerCase();
      if (!agentName.includes(searchLower)) return false;
    }
    return true;
  });

  const handleView = async (appointment: AdminAppointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
    setViewModalLoading(true);
    setViewModalData(null);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointment details");
      }
      const data = await response.json();
      setViewModalData(data);
    } catch (error: any) {
      console.error("Error fetching appointment details:", error);
      setError(error.message || "Failed to load appointment details");
    } finally {
      setViewModalLoading(false);
    }
  };

  const handleRefundClick = (appointment: AdminAppointment) => {
    setAppointmentToRefund(appointment);
    setShowRefundConfirm(true);
  };

  const handleRefundConfirm = async () => {
    if (!appointmentToRefund) return;

    setShowRefundConfirm(false);
    setRefunding(appointmentToRefund.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentToRefund.id}/refund`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refund appointment");
      }

      // Refresh appointments
      window.location.reload();
    } catch (error: any) {
      console.error("Error refunding appointment:", error);
      setError(error.message || "Failed to refund appointment");
      setAppointmentToRefund(null);
    } finally {
      setRefunding(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-600">Loading appointments…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
        <h1 className="text-3xl mb-2 text-black">Appointments</h1>
        <p className="text-neutral-600">View and manage appointment disputes</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-6 py-4 min-w-[200px]">
          <p className="text-sm text-emerald-700 font-medium mb-1">Appointments This Month</p>
          <p className="text-3xl font-bold text-emerald-900">{appointmentsThisMonth}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by agent name..."
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
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
                        <button
                          onClick={() => handleView(apt)}
                          className="px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => handleRefundClick(apt)}
                          disabled={refunding === apt.id || apt.status === "cancelled"}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          {refunding === apt.id ? "Processing..." : "Cancel & Refund"}
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

      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Appointment Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedAppointment(null);
                  setViewModalData(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {viewModalLoading ? (
                <p className="text-sm text-neutral-600">Loading appointment details...</p>
              ) : viewModalData ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-2">Appointment Information</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-neutral-500">Status</dt>
                        <dd>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs border ${getStatusColor(viewModalData.status)}`}>
                            {viewModalData.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Date</dt>
                        <dd className="text-black">{viewModalData.formatted_date || new Date(viewModalData.starts_at).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Time</dt>
                        <dd className="text-black">{viewModalData.time_display || "Not specified"}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Payment</dt>
                        <dd className="text-black">
                          {selectedAppointment?.amount_cents ? `$${((selectedAppointment.amount_cents) / 100).toFixed(2)}` : "$0.00"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {viewModalData.lead && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-700 mb-2">Client Information</h3>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-neutral-500">Name</dt>
                          <dd className="text-black">{viewModalData.lead.full_name || "Unknown"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Email</dt>
                          <dd className="text-black">{viewModalData.lead.email || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">City</dt>
                          <dd className="text-black">{viewModalData.lead.city || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Province</dt>
                          <dd className="text-black">{viewModalData.lead.province || "—"}</dd>
                        </div>
                      </dl>
                      {viewModalData.lead.additional_notes && (
                        <div className="mt-4">
                          <dt className="text-neutral-500 text-sm mb-1">Notes</dt>
                          <dd className="text-black text-sm">{viewModalData.lead.additional_notes}</dd>
                        </div>
                      )}
                    </div>
                  )}

                  {viewModalData.agent && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-700 mb-2">Agent Information</h3>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-neutral-500">Name</dt>
                          <dd className="text-black">{viewModalData.agent.full_name || "Unknown"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Location</dt>
                          <dd className="text-black">
                            {viewModalData.agent.agent_city && viewModalData.agent.agent_province
                              ? `${viewModalData.agent.agent_city}, ${viewModalData.agent.agent_province}`
                              : "—"}
                          </dd>
                        </div>
                        {viewModalData.agent.funeral_home && (
                          <div>
                            <dt className="text-neutral-500">Funeral Home</dt>
                            <dd className="text-black">{viewModalData.agent.funeral_home}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {viewModalData.office_location && (
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-700 mb-2">Office Location</h3>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-neutral-500">Name</dt>
                          <dd className="text-black">{viewModalData.office_location.name || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Address</dt>
                          <dd className="text-black">
                            {viewModalData.office_location.street_address || "—"}
                            {viewModalData.office_location.city && viewModalData.office_location.province && (
                              <span className="block text-xs text-neutral-500">
                                {viewModalData.office_location.city}, {viewModalData.office_location.province}
                                {viewModalData.office_location.postal_code && ` ${viewModalData.office_location.postal_code}`}
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">Failed to load appointment details</p>
              )}
            </div>
            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedAppointment(null);
                  setViewModalData(null);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
              >
                Close
              </button>
              {selectedAppointment && selectedAppointment.status !== "cancelled" && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleRefundClick(selectedAppointment);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Cancel & Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundConfirm && appointmentToRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-black">Confirm Refund</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-neutral-700 mb-4">
                Are you sure you want to cancel and refund this appointment?
              </p>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Client:</span>
                  <span className="text-black font-medium">{appointmentToRefund.family_name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Agent:</span>
                  <span className="text-black font-medium">{appointmentToRefund.specialist_name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Amount:</span>
                  <span className="text-black font-medium">
                    {appointmentToRefund.amount_cents ? `$${((appointmentToRefund.amount_cents) / 100).toFixed(2)}` : "$0.00"}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRefundConfirm(false);
                  setAppointmentToRefund(null);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
