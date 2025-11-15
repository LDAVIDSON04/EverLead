// src/app/agent/leads/success/SuccessClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Status = "checking" | "ok" | "error";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const leadId = searchParams.get("leadId");
    const free = searchParams.get("free");

    // Free lead path: we already updated DB in /api/leads/free-purchase
    if (free === "1" && leadId) {
      setStatus("ok");
      return;
    }

    // Paid path: confirm with backend
    if (!sessionId || !leadId) {
      setStatus("error");
      return;
    }

    async function confirm() {
      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          setStatus("error");
          return;
        }

        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            leadId,
            agentId: user.id,
          }),
        });

        if (res.ok) {
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    }

    confirm();
  }, [searchParams]);

  return (
    <div style={{ maxWidth: "640px" }}>
      {status === "checking" && <p>Confirming your purchase...</p>}

      {status === "ok" && (
        <>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Lead acquired successfully ✅
          </h1>
          <p style={{ color: "#4B5563", marginBottom: "12px" }}>
            You now have access to this lead in your account.
          </p>
          <button
            onClick={() => router.push("/agent/leads/mine")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#2563EB",
              color: "white",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go to My Leads
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#DC2626", marginBottom: "12px" }}>
            We couldn&apos;t confirm your lead. Please contact support or try
            again.
          </p>
          <button
            onClick={() => router.push("/agent/leads/available")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#6B7280",
              color: "white",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Available Leads
          </button>
        </>
      )}
    </div>
  );
}

