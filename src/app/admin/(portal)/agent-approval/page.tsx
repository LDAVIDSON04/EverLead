"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, Mail, Phone, MapPin, Calendar, Loader2 } from "lucide-react";

type PendingAgent = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  funeral_home: string | null;
  licensed_in_province: boolean;
  licensed_funeral_director: boolean;
  notification_cities: Array<{ city: string; province: string }> | null;
  created_at: string;
  approval_status: string | null;
};

export default function AgentApprovalPage() {
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPendingAgents();
  }, []);

  async function loadPendingAgents() {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending agents from API (includes emails)
      const res = await fetch("/api/admin/pending-agents");
      if (!res.ok) {
        throw new Error("Failed to fetch pending agents");
      }

      const agentsWithEmail = await res.json();
      setPendingAgents(agentsWithEmail as PendingAgent[]);
    } catch (err: any) {
      console.error("Error loading pending agents:", err);
      setError(err.message || "Failed to load pending agents");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(agentId: string) {
    if (processing) return;

    try {
      setProcessing(agentId);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to approve agents.");
      }

      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          action: "approve",
          adminUserId: user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve agent");
      }

      // Reload pending agents
      await loadPendingAgents();
    } catch (err: any) {
      console.error("Error approving agent:", err);
      setError(err.message || "Failed to approve agent. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(agentId: string) {
    if (processing) return;

    const reason = prompt("Please provide a reason for declining (optional):");
    if (reason === null) return; // User cancelled

    try {
      setProcessing(agentId);
      setError(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to decline agents.");
      }

      const res = await fetch("/api/admin/approve-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          action: "decline",
          notes: reason || undefined,
          adminUserId: user.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to decline agent");
      }

      // Reload pending agents
      await loadPendingAgents();
    } catch (err: any) {
      console.error("Error declining agent:", err);
      setError(err.message || "Failed to decline agent. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Approval</h1>
          <p className="text-gray-600">
            Review and approve agent applications for access to the Soradin platform.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {pendingAgents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">There are no pending agent applications at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {agent.full_name?.[0]?.toUpperCase() || "A"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {agent.full_name || "No name provided"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Applied {new Date(agent.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {agent.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{agent.email}</span>
                        </div>
                      )}
                      {agent.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{agent.phone}</span>
                        </div>
                      )}
                      {agent.funeral_home && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{agent.funeral_home}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {agent.licensed_in_province ? "Licensed in province" : "Not licensed in province"}
                        </span>
                      </div>
                    </div>

                    {agent.notification_cities && agent.notification_cities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Notification Cities:</p>
                        <div className="flex flex-wrap gap-2">
                          {agent.notification_cities.map((city, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {city.city}, {city.province}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${
                          agent.licensed_funeral_director
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {agent.licensed_funeral_director
                          ? "Licensed Funeral Director"
                          : "Not a Licensed Funeral Director"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(agent.id)}
                      disabled={processing === agent.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === agent.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDecline(agent.id)}
                      disabled={processing === agent.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

