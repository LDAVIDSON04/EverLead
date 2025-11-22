// src/app/agent/leads/success/SuccessClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AgentNav } from "@/components/AgentNav";

type Status = "idle" | "loading" | "success" | "error";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Wrap everything in try-catch to prevent any crashes
    try {
      const sessionId = searchParams.get("session_id");
      const leadId = searchParams.get("leadId");
      const free = searchParams.get("free");

      // Free lead path: we already updated DB in /api/leads/free-purchase
      if (free === "1" && leadId) {
        setStatus("success");
        setTimeout(() => {
          try {
            router.replace("/agent/dashboard");
          } catch (navError) {
            console.error("Navigation error (non-fatal):", navError);
            // Don't crash - user can click button manually
          }
        }, 1500);
        return;
      }

      // Paid path: confirm with backend
      if (!sessionId || !leadId) {
        setStatus("error");
        setMessage(
          "Missing payment information. Please contact support with your payment confirmation email and the time of payment."
        );
        return;
      }

      const run = async () => {
        try {
          setStatus("loading");
          
          // Make the API call with timeout protection
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          let res: Response;
          try {
            res = await fetch("/api/agent/leads/confirm-purchase", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId, leadId }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === "AbortError") {
              throw new Error("Request timed out. Please check your connection and try again.");
            }
            throw fetchError;
          }

          // Parse response safely
          let responseData: any = {};
          try {
            const responseText = await res.text();
            if (responseText) {
              responseData = JSON.parse(responseText);
            }
          } catch (parseError) {
            console.error("Failed to parse response JSON (non-fatal):", parseError);
            responseData = { error: "Invalid response from server" };
          }

          if (!res.ok) {
            console.error("confirm-purchase API error", {
              status: res.status,
              statusText: res.statusText,
              data: responseData,
            });
            setStatus("error");
            setMessage(
              responseData?.error ||
                "We processed your payment but had trouble assigning the lead. Please contact support with your payment confirmation email and the time of payment."
            );
            return;
          }

          // Success - lead was assigned
          setStatus("success");
          setTimeout(() => {
            try {
              router.replace("/agent/dashboard");
            } catch (navError) {
              console.error("Navigation error (non-fatal):", navError);
              // Don't crash - user can click button manually
            }
          }, 1500);
        } catch (err: any) {
          // Catch ALL errors - never let this crash the page
          console.error("confirm-purchase error (handled gracefully):", err);
          setStatus("error");
          setMessage(
            err.message ||
              "We processed your payment but encountered an error. Please contact support with your payment confirmation email and the time of payment."
          );
        }
      };

      run();
    } catch (outerError: any) {
      // Catch any errors in the useEffect itself
      console.error("SuccessClient useEffect error (handled gracefully):", outerError);
      setStatus("error");
      setMessage(
        "An error occurred while processing your purchase. Please contact support with your payment confirmation email and the time of payment."
      );
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-[#f7f4ef]">
      <header className="border-b border-[#ded3c2] bg-[#1f2933] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-white">
              EverLead
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              Agent Portal
            </span>
          </div>
        </div>
      </header>

      <AgentNav />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mx-auto max-w-2xl">
        {status === "idle" && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-[#6b6b6b]">Loading...</p>
          </div>
        )}

        {status === "loading" && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-[#6b6b6b]">Confirming your purchase...</p>
          </div>
        )}

        {status === "success" && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1
              className="mb-4 text-2xl font-semibold text-[#2a2a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Lead acquired successfully ✅
            </h1>
            <p className="mb-6 text-sm text-[#6b6b6b]">
              You now have access to this lead in your account. It has been added to your dashboard.
            </p>
            <p className="mb-4 text-xs text-[#6b6b6b] italic">
              Redirecting to Dashboard...
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/agent/dashboard")}
                className="rounded-full bg-[#2a2a2a] px-6 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/agent/leads/mine")}
                className="rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View My Leads
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <h1
              className="mb-4 text-2xl font-semibold text-red-900"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Payment Processed, But Assignment Failed
            </h1>
            <p className="mb-4 text-sm text-red-700">
              {message || "We couldn't confirm your lead purchase. Please contact support or try again."}
            </p>
            <div className="mb-6 rounded-md bg-red-100 p-4 text-xs text-red-800">
              <p className="font-semibold mb-1">Important:</p>
              <p>Your payment was successful. If you see a charge on your card, the payment went through. Please contact support with:</p>
              <ul className="mt-2 ml-4 list-disc">
                <li>Your payment confirmation email from Stripe</li>
                <li>The time of payment</li>
                <li>Your account email address</li>
              </ul>
              <p className="mt-2">We will manually assign the lead to your account.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  try {
                    router.push("/agent/leads/available");
                  } catch (e) {
                    window.location.href = "/agent/leads/available";
                  }
                }}
                className="rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Back to Available Leads
              </button>
              <button
                onClick={() => {
                  try {
                    router.push("/agent/dashboard");
                  } catch (e) {
                    window.location.href = "/agent/dashboard";
                  }
                }}
                className="rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
        </div>
      </section>
    </main>
  );
}



