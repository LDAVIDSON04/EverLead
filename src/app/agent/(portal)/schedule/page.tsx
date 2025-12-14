"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, Clock, User, ExternalLink, Loader2 } from "lucide-react";
import { DateTime } from "luxon";

type Specialist = {
  id: string;
  display_name: string;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
};

type Appointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  family_name: string;
};

export default function SchedulePage() {
  useRequireRole("agent");
  const router = useRouter();

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecialist() {
      try {
        setLoading(true);
        setError(null);

        // Get access token
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) {
          router.push("/agent");
          return;
        }

        // Fetch specialist record
        const res = await fetch("/api/specialists/me", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/agent");
            return;
          }
          throw new Error("Failed to fetch specialist record");
        }

        const data = await res.json();
        setSpecialist(data);

        // Load appointments and ICS URL if specialist exists
        if (data && data.id) {
          await loadAppointments(session.access_token);
          await loadIcsUrl(data.id);
        }
      } catch (err: any) {
        console.error("Error loading specialist:", err);
        setError(err.message || "Failed to load specialist information");
      } finally {
        setLoading(false);
      }
    }

    loadSpecialist();
  }, [router]);

  async function loadAppointments(accessToken: string) {
    try {
      setLoadingAppointments(true);
      const res = await fetch("/api/appointments/mine", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await res.json();
      setAppointments(data);
    } catch (err: any) {
      console.error("Error loading appointments:", err);
      setError(err.message || "Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  }

  async function loadIcsUrl(specialistId: string) {
    try {
      const res = await fetch(`/api/calendar/ics-url?specialistId=${specialistId}`);
      if (res.ok) {
        const data = await res.json();
        setIcsUrl(data.url);
      }
    } catch (err) {
      console.error("Error loading ICS URL:", err);
      // Non-fatal, continue without ICS URL
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show schedule (removed approval checks)
  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header with Calendar Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg text-gray-900 mb-1">Schedule</h3>
            <p className="text-sm text-gray-500">Your upcoming appointments</p>
          </div>
          <div className="flex items-center gap-3">
            {specialist?.id ? (
              <>
                <a
                  href={`/api/integrations/google/connect?specialistId=${specialist.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  <ExternalLink size={16} />
                  <span>Connect Google Calendar</span>
                </a>
                <a
                  href={`/api/integrations/microsoft/connect?specialistId=${specialist.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  <ExternalLink size={16} />
                  <span>Connect Microsoft Calendar</span>
                </a>
              </>
            ) : (
              <>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  <ExternalLink size={16} />
                  <span>Connect Google Calendar</span>
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed text-sm"
                >
                  <ExternalLink size={16} />
                  <span>Connect Microsoft Calendar</span>
                </button>
              </>
            )}
            {icsUrl && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                <span className="text-gray-600">ICS Feed:</span>
                <a
                  href={icsUrl}
                  className="text-green-800 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Copy URL
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Appointments List */}
        {loadingAppointments ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg text-gray-900 mb-2">No Upcoming Appointments</h2>
            <p className="text-sm text-gray-500">You don't have any scheduled appointments yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 pb-2 border-b border-gray-100">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Time</div>
                <div className="col-span-4">Client</div>
                <div className="col-span-2">Status</div>
              </div>
              
              {/* Table Rows */}
              {appointments.map((appointment) => {
                const startDate = DateTime.fromISO(appointment.starts_at, { zone: "utc" });
                const endDate = DateTime.fromISO(appointment.ends_at, { zone: "utc" });
                const localStart = startDate.setZone("America/Edmonton");
                const localEnd = endDate.setZone("America/Edmonton");

                return (
                  <div
                    key={appointment.id}
                    className="grid grid-cols-12 gap-4 items-center py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {localStart.toLocaleString(DateTime.DATE_MED)}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {localStart.toLocaleString(DateTime.TIME_SIMPLE)} - {localEnd.toLocaleString(DateTime.TIME_SIMPLE)}
                      </span>
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{appointment.family_name}</span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : appointment.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
