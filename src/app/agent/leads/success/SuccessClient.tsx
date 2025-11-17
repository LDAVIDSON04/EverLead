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
    const sessionId = searchParams.get("session_id");
    const leadId = searchParams.get("leadId");
    const free = searchParams.get("free");

    // Free lead path: we already updated DB in /api/leads/free-purchase
    if (free === "1" && leadId) {
      setStatus("success");
      setTimeout(() => {
        router.push("/agent/leads/mine");
      }, 1500);
      return;
    }

    // Paid path: confirm with backend
    if (!sessionId || !leadId) {
      setStatus("error");
      setMessage("Missing payment information. Please contact support.");
      return;
    }

    const run = async () => {
      try {
        setStatus("loading");
        const res = await fetch("/api/agent/leads/confirm-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, leadId }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          console.error("confirm-purchase failed", data);
          setStatus("error");
          setMessage(
            data?.error ??
              "We processed your payment but had trouble assigning the lead. Please contact support."
          );
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/agent/leads/mine");
        }, 1500);
      } catch (err) {
        console.error("confirm-purchase crashed", err);
        setStatus("error");
        setMessage(
          "We processed your payment but had trouble assigning the lead. Please contact support."
        );
      }
    };

    run();
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
              Redirecting to My Leads...
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
              Something went wrong
            </h1>
            <p className="mb-6 text-sm text-red-700">
              {message || "We couldn't confirm your lead purchase. Please contact support or try again."}
            </p>
            <button
              onClick={() => router.push("/agent/leads/available")}
              className="rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Back to Available Leads
            </button>
          </div>
        )}
        </div>
      </section>
    </main>
  );
}



