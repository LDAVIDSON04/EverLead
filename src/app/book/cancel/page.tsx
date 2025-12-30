"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CancelAppointmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rebooking">("idle");
  const [message, setMessage] = useState<string>("");
  const [agentId, setAgentId] = useState<string | null>(null);

  // Fetch appointment details on mount to get agent ID
  useEffect(() => {
    if (!appointmentId) return;

    async function fetchAppointment() {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.agent_id) {
            setAgentId(data.agent_id);
          }
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      }
    }

    fetchAppointment();
  }, [appointmentId]);

  const handleCancel = async (action: "cancel" | "rebook") => {
    if (!appointmentId) {
      setStatus("error");
      setMessage("Invalid appointment ID");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to process request");
        return;
      }

      if (action === "rebook") {
        // Get agent ID from response if not already set
        const responseAgentId = data.agentId || agentId;
        setStatus("rebooking");
        // Redirect to agent portfolio page where they can see available dates and book
        if (responseAgentId) {
          setTimeout(() => {
            router.push(`/agentportfolio/${responseAgentId}?reschedule=true`);
          }, 1000);
        } else {
          setTimeout(() => {
            router.push("/search");
          }, 1000);
        }
      } else {
        setStatus("success");
        setMessage("Your appointment has been cancelled successfully.");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage("An error occurred. Please try again or contact support.");
      console.error("Error processing request:", error);
    }
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This cancellation link is invalid or missing the appointment ID.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#2a2a2a] text-white px-6 py-2 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cancel Appointment</h1>
        
        {status === "idle" && (
          <>
            <p className="text-gray-600 mb-6">
              Would you like to cancel this appointment or reschedule it for another time?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleCancel("rebook")}
                className="w-full bg-[#0D5C3D] text-white px-6 py-3 rounded hover:bg-[#0A4A30] transition-colors font-medium"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={() => handleCancel("cancel")}
                className="w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors font-medium"
              >
                Cancel Appointment
              </button>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors text-center"
              >
                Keep Appointment
              </Link>
            </div>
          </>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {status === "rebooking" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C3D] mb-4"></div>
            <p className="text-gray-600">Redirecting to reschedule...</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 text-center mb-6">{message}</p>
            </div>
            <Link
              href="/"
              className="block w-full bg-[#2a2a2a] text-white px-6 py-2 rounded hover:bg-[#1a1a1a] transition-colors text-center"
            >
              Return to Home
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 text-center mb-6">{message}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleCancel("cancel")}
                className="flex-1 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors text-center"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CancelAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CancelAppointmentContent />
    </Suspense>
  );
}

