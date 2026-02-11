"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type DeclinedPayment = {
  id: string;
  agentId: string;
  appointmentId: string;
  amountCents: number;
  amountDollars: string;
  declineReason: string | null;
  stripeErrorCode: string | null;
  stripeErrorMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
  status: string;
  agent: {
    id: string;
    fullName: string;
    email: string | null;
    funeralHome: string | null;
    city: string | null;
    province: string | null;
  } | null;
  appointment: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
  } | null;
  lead: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    province: string | null;
  } | null;
};

export default function DeclinedPaymentsPage() {
  const [declinedPayments, setDeclinedPayments] = useState<DeclinedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeclinedPayments() {
      try {
        const res = await fetch("/api/admin/declined-payments");
        if (!res.ok) {
          throw new Error("Failed to fetch declined payments");
        }
        const data = await res.json();
        setDeclinedPayments(data.declinedPayments || []);
      } catch (err: any) {
        console.error("Error loading declined payments:", err);
        setError(err.message || "Failed to load declined payments");
      } finally {
        setLoading(false);
      }
    }

    loadDeclinedPayments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAppointmentDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-neutral-600">Loading declined payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Declined Payments</h1>
        <p className="text-sm text-neutral-600">
          Agents with failed payment attempts. Their accounts are paused until payment is updated.
        </p>
      </div>

      {declinedPayments.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
          <p className="text-sm text-neutral-600">No declined payments at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {declinedPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white border border-red-200 rounded-lg p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Agent & Payment Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Agent Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium text-neutral-700">Name:</span>{" "}
                        <span className="text-neutral-900">{payment.agent?.fullName || "Unknown"}</span>
                      </p>
                      {payment.agent?.email && (
                        <p>
                          <span className="font-medium text-neutral-700">Email:</span>{" "}
                          <span className="text-neutral-900">{payment.agent.email}</span>
                        </p>
                      )}
                      {payment.agent?.funeralHome && (
                        <p>
                          <span className="font-medium text-neutral-700">Work Place:</span>{" "}
                          <span className="text-neutral-900">{payment.agent.funeralHome}</span>
                        </p>
                      )}
                      {payment.agent?.city && payment.agent?.province && (
                        <p>
                          <span className="font-medium text-neutral-700">Location:</span>{" "}
                          <span className="text-neutral-900">
                            {payment.agent.city}, {payment.agent.province}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">Payment Details</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium text-neutral-700">Amount:</span>{" "}
                        <span className="text-red-600 font-semibold">${payment.amountDollars} CAD</span>
                      </p>
                      <p>
                        <span className="font-medium text-neutral-700">Declined:</span>{" "}
                        <span className="text-neutral-900">{formatDate(payment.createdAt)}</span>
                      </p>
                      {payment.declineReason && (
                        <p>
                          <span className="font-medium text-neutral-700">Reason:</span>{" "}
                          <span className="text-neutral-900">{payment.declineReason}</span>
                        </p>
                      )}
                      {payment.stripeErrorCode && (
                        <p>
                          <span className="font-medium text-neutral-700">Stripe Error Code:</span>{" "}
                          <span className="text-neutral-900 font-mono text-xs">{payment.stripeErrorCode}</span>
                        </p>
                      )}
                      {payment.stripeErrorMessage && (
                        <p>
                          <span className="font-medium text-neutral-700">Stripe Error:</span>{" "}
                          <span className="text-neutral-900">{payment.stripeErrorMessage}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Appointment & Lead Info */}
                <div className="space-y-4">
                  {payment.appointment && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Appointment Information</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium text-neutral-700">Appointment ID:</span>{" "}
                          <span className="text-neutral-900 font-mono text-xs">{payment.appointment.id}</span>
                        </p>
                        <p>
                          <span className="font-medium text-neutral-700">Start Time:</span>{" "}
                          <span className="text-neutral-900">
                            {formatAppointmentDate(payment.appointment.startsAt)}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-neutral-700">End Time:</span>{" "}
                          <span className="text-neutral-900">
                            {formatAppointmentDate(payment.appointment.endsAt)}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-neutral-700">Status:</span>{" "}
                          <span className="text-neutral-900 capitalize">{payment.appointment.status}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {payment.lead && (
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Family Information</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium text-neutral-700">Name:</span>{" "}
                          <span className="text-neutral-900">{payment.lead.fullName || "Not provided"}</span>
                        </p>
                        {payment.lead.email && (
                          <p>
                            <span className="font-medium text-neutral-700">Email:</span>{" "}
                            <span className="text-neutral-900">{payment.lead.email}</span>
                          </p>
                        )}
                        {payment.lead.phone && (
                          <p>
                            <span className="font-medium text-neutral-700">Phone:</span>{" "}
                            <span className="text-neutral-900">{payment.lead.phone}</span>
                          </p>
                        )}
                        {payment.lead.city && payment.lead.province && (
                          <p>
                            <span className="font-medium text-neutral-700">Location:</span>{" "}
                            <span className="text-neutral-900">
                              {payment.lead.city}, {payment.lead.province}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-500">
                  Agent account is paused. They will not appear in search results until payment method is updated and outstanding payment is processed.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

