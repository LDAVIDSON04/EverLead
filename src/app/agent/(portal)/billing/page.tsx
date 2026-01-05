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
        
        // Reload payment methods
        setTimeout(() => {
          loadBilling();
          // Dispatch onboarding step completion event
          window.dispatchEvent(new CustomEvent("onboardingStepCompleted", { detail: { step: 3 } }));
          
          // Show completion popup
          if (typeof window !== 'undefined') {
            const popupDiv = document.createElement('div');
            popupDiv.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
            popupDiv.innerHTML = `
              <div class="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl transform transition-all">
                <div class="text-center">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h3>
                  <p class="text-gray-600 mb-6">You're now ready to accept appointments and will appear in family search results.</p>
                  <button onclick="this.closest('.fixed').remove()" class="w-full px-6 py-3 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium">
                    Get Started
                  </button>
                </div>
              </div>
            `;
            document.body.appendChild(popupDiv);
            // Auto-close after 10 seconds
            setTimeout(() => {
              if (popupDiv.parentElement) {
                popupDiv.style.opacity = '0';
                setTimeout(() => popupDiv.remove(), 300);
              }
            }, 10000);
          }
          
          // Clean up URL
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
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <button
                      onClick={async () => {
                        if (!confirm("Are you sure you want to remove this payment method? You must have at least one payment method on file.")) {
                          return;
                        }
                        
                        try {
                          const { data: { session } } = await supabaseClient.auth.getSession();
                          if (!session?.access_token) return;

                          const res = await fetch("/api/agent/settings/payment-methods", {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${session.access_token}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ paymentMethodId: pm.id }),
                          });

                          if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.error || "Failed to remove payment method");
                          }

                          // Reload payment methods
                          await loadBilling();
                        } catch (err: any) {
                          console.error("Error removing payment method:", err);
                          alert(err.message || "Failed to remove payment method. Please try again.");
                        }
                      }}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
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
            className="flex items-center gap-2 px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
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
                        <Badge className="bg-green-100 text-green-800 text-[9px] md:text-xs">{payment.status}</Badge>
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
