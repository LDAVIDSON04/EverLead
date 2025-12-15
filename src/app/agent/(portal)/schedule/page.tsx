"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, Clock, User, X, Loader2 } from "lucide-react";
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

type CalendarConnection = {
  id: string;
  provider: "google" | "microsoft" | "ics";
  specialist_id: string;
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
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [hasCalendarConnection, setHasCalendarConnection] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

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

        // Load appointments regardless of specialist record
        await loadAppointments(session.access_token);

        // Check if specialist has any calendar connections (only if specialist exists)
        if (data && data.id) {
          await checkCalendarConnections(data.id, session.access_token);
          await loadIcsUrl(data.id);
        } else {
          // No specialist record yet - show modal to encourage setup
          setHasCalendarConnection(false);
          setCheckingConnection(false);
          // Check localStorage to see if user dismissed it before
          const dismissed = localStorage.getItem(`calendar_modal_dismissed_${data?.id || 'new'}`);
          if (dismissed !== "true") {
            setShowCalendarModal(true);
          }
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

  async function checkCalendarConnections(specialistId: string, accessToken: string) {
    try {
      setCheckingConnection(true);
      
      // Check if specialist has any calendar connections (Google or Microsoft, not ICS)
      const { data: connections, error } = await supabaseClient
        .from("calendar_connections")
        .select("id, provider")
        .eq("specialist_id", specialistId)
        .in("provider", ["google", "microsoft"]);

      if (error) {
        console.error("Error checking calendar connections:", error);
        // If error, show modal (better to ask than to block)
        setHasCalendarConnection(false);
        setShowCalendarModal(true);
        return;
      }

      if (connections && connections.length > 0) {
        // Has a connection, don't show modal
        setHasCalendarConnection(true);
        setShowCalendarModal(false);
        // Clear any dismissal flag since they now have a connection
        localStorage.removeItem(`calendar_modal_dismissed_${specialistId}`);
      } else {
        // No connection - check if user dismissed before showing
        setHasCalendarConnection(false);
        const dismissed = localStorage.getItem(`calendar_modal_dismissed_${specialistId}`);
        if (dismissed !== "true") {
          setShowCalendarModal(true);
        }
      }
    } catch (err) {
      console.error("Error checking connections:", err);
      // On error, show modal
      setHasCalendarConnection(false);
      setShowCalendarModal(true);
    } finally {
      setCheckingConnection(false);
    }
  }

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

  async function handleConnectCalendar(provider: "google" | "google" | "microsoft") {
    // Get specialist ID from session if not available
    let specialistId = specialist?.id;
    
    if (!specialistId) {
      // Try to get user ID from session as fallback
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        specialistId = user.id;
      }
    }
    
    if (!specialistId) {
      console.error("Cannot connect calendar: no specialist ID available");
      return;
    }
    
    // Redirect to OAuth flow
    window.location.href = `/api/integrations/${provider}/connect?specialistId=${specialistId}`;
  }

  function handleDismissModal() {
    // Store in localStorage that user dismissed the modal
    const id = specialist?.id || 'new';
    localStorage.setItem(`calendar_modal_dismissed_${id}`, "true");
    setShowCalendarModal(false);
  }

  // Check localStorage when connection check completes
  useEffect(() => {
    if (!checkingConnection && !hasCalendarConnection) {
      const id = specialist?.id || 'new';
      const dismissed = localStorage.getItem(`calendar_modal_dismissed_${id}`);
      if (dismissed === "true") {
        setShowCalendarModal(false);
      } else {
        // Show modal if not dismissed and no connection
        setShowCalendarModal(true);
      }
    }
  }, [checkingConnection, hasCalendarConnection, specialist]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show schedule
  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg text-gray-900 mb-1">Schedule</h3>
          <p className="text-sm text-gray-500">Your upcoming appointments</p>
        </div>

        {/* Calendar Sync Modal - Only show if no connection and not dismissed */}
        {showCalendarModal && !hasCalendarConnection && !checkingConnection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Sync Your Calendar</h2>
                <button
                  onClick={handleDismissModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Connect your calendar to automatically sync your Soradin appointments with Google Calendar or Microsoft Outlook.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleConnectCalendar("google")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-green-800 hover:bg-green-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Connect Google Calendar</span>
                </button>

                <button
                  onClick={() => handleConnectCalendar("microsoft")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-green-800 hover:bg-green-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  <span>Connect Microsoft Calendar</span>
                </button>
              </div>

              <button
                onClick={handleDismissModal}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

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
