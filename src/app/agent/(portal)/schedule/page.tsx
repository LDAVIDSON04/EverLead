"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import Link from "next/link";
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

        // If approved and active, load appointments and ICS URL
        if (data && data.status === "approved" && data.is_active) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No specialist record
  if (!specialist) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              No Specialist Account
            </h1>
            <p className="text-gray-600 mb-6">
              You need to create your specialist account before you can view your schedule.
            </p>
            <Link
              href="/agent/become-specialist"
              className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create Specialist Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval
  if (specialist.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-yellow-900 mb-2">
              Account Pending Approval
            </h1>
            <p className="text-yellow-700">
              Your specialist account is pending approval. You'll see your schedule here once you've been approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected
  if (specialist.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-red-900 mb-2">
              Account Rejected
            </h1>
            <p className="text-red-700 mb-6">
              Your specialist account application was rejected. Please contact support if you have questions.
            </p>
            <Link
              href="/agent/become-specialist"
              className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Update Application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Approved but not active
  if (specialist.status === "approved" && !specialist.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Account Inactive
            </h1>
            <p className="text-gray-600">
              Your specialist account is approved but currently inactive. Please contact support to activate your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Approved and active - show schedule
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Calendar Integration */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Schedule</h1>
            <p className="text-gray-600">Your upcoming appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/integrations/google/connect"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <ExternalLink size={16} />
              <span>Connect Google Calendar</span>
            </a>
            <a
              href="/api/integrations/microsoft/connect"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <ExternalLink size={16} />
              <span>Connect Microsoft Calendar</span>
            </a>
            {icsUrl && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                <span className="text-gray-600">ICS Feed:</span>
                <a
                  href={icsUrl}
                  className="text-green-700 hover:underline"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Appointments</h2>
            <p className="text-gray-600">You don't have any scheduled appointments yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appointment) => {
                    const startDate = DateTime.fromISO(appointment.starts_at, { zone: "utc" });
                    const endDate = DateTime.fromISO(appointment.ends_at, { zone: "utc" });
                    // Convert to specialist's timezone (default to America/Edmonton)
                    const localStart = startDate.setZone("America/Edmonton");
                    const localEnd = endDate.setZone("America/Edmonton");

                    return (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {localStart.toLocaleString(DateTime.DATE_MED)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {localStart.toLocaleString(DateTime.TIME_SIMPLE)} - {localEnd.toLocaleString(DateTime.TIME_SIMPLE)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{appointment.family_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

