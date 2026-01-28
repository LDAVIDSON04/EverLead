"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { CreditCard, AlertCircle, FileText } from "lucide-react";
import { StatementModal } from "@/components/billing/StatementModal";
import { MonthSelectorModal } from "@/components/billing/MonthSelectorModal";

function Badge({ className = "", children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Modern confirm modal for removing a payment method
function RemovePaymentButton({ paymentMethodId, onRemoved }: { paymentMethodId: string; onRemoved: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/agent/settings/payment-methods", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to remove payment method");
      }

      await onRemoved();
      setOpen(false);
    } catch (err: any) {
      console.error("Error removing payment method:", err);
      alert(err.message || "Failed to remove payment method. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
      >
        Remove
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !loading && setOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Remove payment method?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                You must keep at least one payment method on file. Removing this card will stop charges to it for new appointments.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={handleRemove}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [pricePerAppointment, setPricePerAppointment] = useState(0);
  const [pastPayments, setPastPayments] = useState<any[]>([]);
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statementData, setStatementData] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const loadBilling = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      // Load billing data
      const billingRes = await fetch("/api/agent/settings/billing", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!billingRes.ok) throw new Error("Failed to load billing data");

      const billingData = await billingRes.json();
      setPricePerAppointment(billingData.pricePerAppointment);
      setPastPayments(billingData.pastPayments || []);

      // Load payment methods
      const pmRes = await fetch("/api/agent/settings/payment-methods/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPaymentMethods(pmData.paymentMethods || []);
      }
    } catch (err) {
      console.error("Error loading billing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();

    // Check for payment method success/cancel in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentMethodStatus = params.get('payment_method');
      
      if (paymentMethodStatus === 'success') {
        // Call the payment-method-updated API to charge outstanding payments and unpause account
        const handlePaymentMethodUpdated = async () => {
          try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch("/api/agent/payment-method-updated", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (res.ok) {
              const data = await res.json();
              if (data.allCharged) {
                console.log("✅ All outstanding payments charged. Account unpaused.");
              } else if (data.chargedPayments && data.chargedPayments.length > 0) {
                console.log(`⚠️ ${data.chargedPayments.length} payments charged, but some failed. Account remains paused.`);
              }
            }
          } catch (err) {
            console.error("Error processing payment method update:", err);
            // Don't block the UI - just log the error
          }
        };

        // Process outstanding payments and unpause account
        handlePaymentMethodUpdated();
        
        // Reload payment methods, then clean URL — no onboarding popup here
        setTimeout(() => {
          loadBilling();
          window.history.replaceState({}, '', window.location.pathname);
        }, 1000);
      } else if (paymentMethodStatus === 'cancelled') {
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600 text-sm">Manage your payment method and view billing history</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Payment Method</h3>

          {paymentMethods.length === 0 ? (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">No payment method</div>
                  <div className="text-sm text-gray-500">Add a payment method to get started</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setAddingPaymentMethod(true);
                  try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (!session?.access_token) return;

                    const res = await fetch("/api/agent/settings/payment-methods/setup", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    });

                    if (!res.ok) {
                      const error = await res.json();
                      throw new Error(error.error || "Failed to start payment method setup");
                    }

                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (err: any) {
                    console.error("Error setting up payment method:", err);
                    alert(err.message || "Failed to add payment method. Please try again.");
                    setAddingPaymentMethod(false);
                  }
                }}
                disabled={addingPaymentMethod}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingPaymentMethod ? "Loading..." : "Add Payment Method"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {paymentMethods.map((pm: any) => (
                <div key={pm.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} •••• {pm.card.last4}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expires {pm.card.exp_month}/{pm.card.exp_year}
                        {pm.isDefault && " • Default"}
                      </div>
                    </div>
                  </div>
                  {paymentMethods.length > 1 && (
                    <RemovePaymentButton paymentMethodId={pm.id} onRemoved={loadBilling} />
                  )}
                </div>
              ))}
              <button
                onClick={async () => {
                  setAddingPaymentMethod(true);
                  try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (!session?.access_token) return;

                    const res = await fetch("/api/agent/settings/payment-methods/setup", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    });

                    if (!res.ok) {
                      const error = await res.json();
                      throw new Error(error.error || "Failed to start payment method setup");
                    }

                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (err: any) {
                    console.error("Error setting up payment method:", err);
                    alert(err.message || "Failed to add payment method. Please try again.");
                    setAddingPaymentMethod(false);
                  }
                }}
                disabled={addingPaymentMethod}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingPaymentMethod ? "Loading..." : "Add Another Payment Method"}
              </button>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>How billing works:</strong> You are charged ${pricePerAppointment.toFixed(2)} per appointment
              booked through the platform. Your saved payment method is automatically charged immediately when an appointment is confirmed.
            </div>
          </div>
        </div>

        {/* Monthly Statements Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Monthly Statements</h3>
          <button
            onClick={() => setMonthSelectorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <FileText size={18} />
            View your statements
          </button>
        </div>

        {pastPayments.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Payment History</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-600">Date</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-600">Appointments</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-600">Amount</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm">{payment.date}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm">{payment.appointments}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm font-medium">{payment.amount}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm">
                        <Badge className="bg-neutral-100 text-neutral-800 text-[9px] md:text-xs">{payment.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Month Selector Modal */}
      <MonthSelectorModal
        open={monthSelectorOpen}
        onClose={() => setMonthSelectorOpen(false)}
        selectedYear={selectedYear}
        onYearChange={(year) => setSelectedYear(year)}
        onMonthSelect={async (year, month) => {
          setMonthSelectorOpen(false);
          setStatementModalOpen(true);
          setLoadingStatement(true);

          try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session?.access_token) return;

            const res = await fetch(`/api/agent/statements/${year}/${month}`, {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

            if (res.ok) {
              const data = await res.json();
              setStatementData(data);
            } else {
              console.error("Failed to load statement");
              setStatementData(null);
            }
          } catch (err) {
            console.error("Error loading statement:", err);
            setStatementData(null);
          } finally {
            setLoadingStatement(false);
          }
        }}
        loadingStatement={loadingStatement}
      />

      {/* Statement Modal */}
      <StatementModal
        open={statementModalOpen}
        onClose={() => {
          setStatementModalOpen(false);
        }}
        data={statementData}
        loading={loadingStatement}
      />
    </div>
  );
}
