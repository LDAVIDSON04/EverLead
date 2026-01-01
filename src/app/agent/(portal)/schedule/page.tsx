"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, Clock, User, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { DateTime } from "luxon";
import { ClientInfoModal } from "../my-appointments/components/ClientInfoModal";
import { downloadClientInfo } from "@/lib/downloadClientInfo";
import { getCityColor } from "@/lib/cityColors";
import { AddAvailabilityModal } from "./components/AddAvailabilityModal";

type Specialist = {
  id: string;
  display_name: string;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
};

type Appointment = {
  id: string;
  lead_id?: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  family_name: string;
  location?: string;
  is_external?: boolean;
  provider?: string;
};

export default function SchedulePage() {
  useRequireRole("agent");
  const router = useRouter();

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [icsUrl, setIcsUrl] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [hasCalendarConnection, setHasCalendarConnection] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [agentTimezone, setAgentTimezone] = useState<string>("America/Vancouver");
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);
  const [viewingExternalAppointment, setViewingExternalAppointment] = useState<any | null>(null);
  const [showAddAvailabilityModal, setShowAddAvailabilityModal] = useState(false);

  // Calculate Monday-Sunday week starting from Monday of the current week
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    // Calculate Monday of current week (Monday = 1, so if today is Sunday (0), go back 6 days)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (offset * 7));
    monday.setHours(0, 0, 0, 0);

    // Return Monday through Sunday (7 days)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
  const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
  const goToToday = () => setCurrentWeekOffset(0);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  useEffect(() => {
    async function loadSpecialist() {
      try {
        setLoading(true);
        setError(null);

        const [sessionResult, userResult] = await Promise.all([
          supabaseClient.auth.getSession(),
          supabaseClient.auth.getUser(),
        ]);

        const { data: { session } } = sessionResult;
        const { data: { user } } = userResult;

        if (!session?.access_token || !user) {
          router.push("/agent");
          return;
        }

        const [profileResult, specialistRes, appointmentsData] = await Promise.all([
          supabaseClient
            .from("profiles")
            .select("full_name, metadata")
            .eq("id", user.id)
            .maybeSingle(),
          fetch("/api/specialists/me", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch("/api/appointments/mine", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).then(res => res.ok ? res.json() : []).catch(() => []),
        ]);

        const profileData = profileResult.data;
        if (profileData?.full_name) {
          setUserName(profileData.full_name);
        }

        if (profileData?.metadata?.timezone) {
          setAgentTimezone(profileData.metadata.timezone);
        } else if (profileData?.metadata?.availability?.timezone) {
          setAgentTimezone(profileData.metadata.availability.timezone);
        }

        let specialistData = null;
        if (specialistRes.ok) {
          specialistData = await specialistRes.json();
          setSpecialist(specialistData);
        }

        setAppointments(appointmentsData || []);

        if (specialistData?.id) {
          Promise.all([
            checkCalendarConnections(specialistData.id, session.access_token),
            loadIcsUrl(specialistData.id),
          ]).catch(err => console.error("Error loading calendar data:", err));
        } else {
          setHasCalendarConnection(false);
          setCheckingConnection(false);
          const dismissed = localStorage.getItem(`calendar_modal_dismissed_new`);
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
      const { data: connections, error } = await supabaseClient
        .from("calendar_connections")
        .select("id, provider")
        .eq("specialist_id", specialistId)
        .in("provider", ["google", "microsoft"]);

      if (error) {
        console.error("Error checking calendar connections:", error);
        setHasCalendarConnection(false);
        return;
      }

      if (connections && connections.length > 0) {
        setHasCalendarConnection(true);
        setShowCalendarModal(false);
      } else {
        setHasCalendarConnection(false);
        const dismissed = localStorage.getItem(`calendar_modal_dismissed_${specialistId}`);
        if (dismissed !== "true") {
          setShowCalendarModal(true);
        }
      }
    } catch (err) {
      console.error("Error checking connections:", err);
      setHasCalendarConnection(false);
    } finally {
      setCheckingConnection(false);
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
    }
  }

  async function handleConnectCalendar(provider: "google" | "microsoft") {
    let specialistId = specialist?.id;
    if (!specialistId) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        specialistId = user.id;
      }
    }
    if (!specialistId) {
      console.error("Cannot connect calendar: no specialist ID available");
      return;
    }
    window.location.href = `/api/integrations/${provider}/connect?specialistId=${specialistId}`;
  }

  function handleDismissModal() {
    const id = specialist?.id || 'new';
    localStorage.setItem(`calendar_modal_dismissed_${id}`, "true");
    setShowCalendarModal(false);
  }

  // Get appointments for the week (Monday-Friday only)
  const getWeekAppointments = () => {
    return appointments
      .map(apt => {
        const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
        const localStart = startDate.setZone(agentTimezone);
        const aptDate = localStart.toJSDate();
        
        // Check if appointment is in the current week (Monday-Sunday)
        // Include past appointments too - show all appointments in the week
        const weekStart = weekDates[0];
        const weekEnd = weekDates[6];
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Include appointments from the week, including past days
        if (aptDate >= weekStart && aptDate <= weekEnd) {
          // Find which day index this appointment belongs to (0-6 for Mon-Sun)
          const dayIndex = weekDates.findIndex((date, idx) => {
            const dateStr = date.toDateString();
            const aptDateStr = aptDate.toDateString();
            return dateStr === aptDateStr;
          });
          
          if (dayIndex >= 0 && dayIndex < 7) {
            const endDate = DateTime.fromISO(apt.ends_at, { zone: "utc" });
            const localEnd = endDate.setZone(agentTimezone);
            const durationMinutes = localEnd.diff(localStart, 'minutes').minutes;
            
            return {
              ...apt,
              day: dayIndex,
              hour: localStart.hour,
              minute: localStart.minute,
              durationMinutes,
              startTime: `${String(localStart.hour).padStart(2, '0')}:${String(localStart.minute).padStart(2, '0')}`,
              endTime: `${String(localEnd.hour).padStart(2, '0')}:${String(localEnd.minute).padStart(2, '0')}`,
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  };

  const weekAppointments = getWeekAppointments();

  // Calculate hours for display (8 AM to 8 PM, or based on appointments)
  const calculateHours = () => {
    if (weekAppointments.length === 0) {
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
    }
    
    const appointmentHours = weekAppointments.map((apt: any) => apt.hour);
    const earliestHour = Math.min(...appointmentHours);
    const latestHour = Math.max(...appointmentHours);
    
    const startHour = Math.max(8, earliestHour - 1);
    const endHour = Math.min(20, latestHour + 1);
    
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  };

  const hours = calculateHours();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white" style={{ padding: '32px', paddingTop: '56px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8" style={{ marginTop: '0', paddingTop: '0' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold" style={{ lineHeight: '1.2', marginTop: '0', paddingTop: '0' }}>{formatDate(weekDates[0])}</h1>
          <button 
            onClick={goToToday}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex gap-2">
            <button 
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAddAvailabilityModal(true)}
            className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Add availability
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          {/* Day Headers */}
          <div className="flex sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
            <div className="w-24 flex-shrink-0"></div>
            {weekDays.map((day, index) => {
              const date = weekDates[index];
              const today = isToday(date);
              return (
                <div key={`${day}-${index}`} className="flex-1 min-w-[120px] px-3 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-600 ${
                      today ? 'bg-green-600 text-white' : 'bg-gray-100'
                    }`}>
                      {day.substring(0, 1)}
                    </div>
                    <span className={`text-gray-700 ${today ? 'font-semibold' : ''}`}>{day}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {hours.map((hour) => {
              return (
                <div key={hour} className="flex border-t border-gray-200">
                  <div className="w-24 flex-shrink-0 pr-4 pt-2 text-sm text-gray-500 text-right">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    // Find appointments that start in this hour for this day
                    const cellAppointments = weekAppointments.filter((apt: any) => {
                      return apt.day === dayIndex && apt.hour === hour;
                    });

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="flex-1 min-w-[120px] border-l border-gray-200 relative h-32 overflow-visible"
                      >
                        {cellAppointments.map((apt: any) => {
                          // Calculate top offset within this hour (based on minutes)
                          const topOffset = (apt.minute / 60) * 120; // 120px per hour
                          // Calculate height based on duration
                          const height = (apt.durationMinutes / 60) * 120;
                          const color = getCityColor(apt.location, apt.is_external);

                          return (
                            <div
                              key={apt.id}
                              onClick={() => {
                                if (apt.lead_id && !apt.is_external) {
                                  setViewingLeadId(apt.lead_id);
                                  setViewingAppointmentId(apt.id);
                                } else if (apt.is_external) {
                                  setViewingExternalAppointment(apt);
                                }
                              }}
                              className={`absolute inset-x-1 ${color} rounded-lg p-2.5 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all border border-gray-200`}
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(height, 60)}px`,
                                zIndex: 5,
                              }}
                            >
                              <div className="h-full flex flex-col gap-1.5">
                                {/* Customer Name */}
                                <div className="text-sm font-medium text-gray-700 truncate">
                                  {apt.family_name || 'Appointment'}
                                </div>
                                
                                {/* Time */}
                                <div className="text-xs text-gray-600">
                                  {apt.startTime} - {apt.endTime}
                                </div>
                                
                                {/* Location with pin - filter out provider names */}
                                {(() => {
                                  // Filter out provider names and invalid locations
                                  const validLocation = apt.location && 
                                    apt.location !== "N/A" && 
                                    apt.location !== "External Calendar" &&
                                    !apt.location.match(/^(Google Calendar|Microsoft Calendar|ICS Calendar)$/i);
                                  
                                  // Clean the location string (remove provider names if they're part of the string)
                                  const cleanLocation = validLocation 
                                    ? apt.location.replace(/Google Calendar|Microsoft Calendar|ICS Calendar/gi, '').trim()
                                    : null;
                                  
                                  return cleanLocation && cleanLocation.length > 0 ? (
                                    <div className="flex items-center gap-1 mt-auto">
                                      <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                      <span className="text-xs text-gray-600 truncate">{cleanLocation}</span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Connection Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Connect Your Calendar</h2>
              <button
                onClick={handleDismissModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Connect your calendar to sync external appointments and avoid double bookings.
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

      {/* Add Availability Modal */}
      <AddAvailabilityModal
        isOpen={showAddAvailabilityModal}
        onClose={() => setShowAddAvailabilityModal(false)}
        onSave={() => {
          // Optionally refresh data here
          setShowAddAvailabilityModal(false);
        }}
      />

      {/* Client Info Modal */}
      <ClientInfoModal
        isOpen={viewingLeadId !== null}
        onClose={() => {
          setViewingLeadId(null);
          setViewingAppointmentId(null);
        }}
        leadId={viewingLeadId}
        appointmentId={viewingAppointmentId}
      />

      {/* External Appointment Modal */}
      {viewingExternalAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setViewingExternalAppointment(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Appointment Details</h2>
              <button
                onClick={() => setViewingExternalAppointment(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Title</div>
                <div className="text-base text-gray-900 font-medium">
                  {viewingExternalAppointment.family_name || 'External Meeting'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Date & Time</div>
                <div className="text-base text-gray-900">
                  {DateTime.fromISO(viewingExternalAppointment.starts_at, { zone: "utc" })
                    .setZone(agentTimezone)
                    .toLocaleString({ 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {DateTime.fromISO(viewingExternalAppointment.ends_at, { zone: "utc" })
                    .setZone(agentTimezone)
                    .toLocaleString(DateTime.TIME_SIMPLE)}
                </div>
              </div>
              {viewingExternalAppointment.location && viewingExternalAppointment.location !== "N/A" && viewingExternalAppointment.location !== "External Calendar" && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="text-base text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {viewingExternalAppointment.location}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 mb-1">Source</div>
                <div className="text-base text-gray-900">
                  {viewingExternalAppointment.provider === 'google' ? 'Google Calendar' : 
                   viewingExternalAppointment.provider === 'microsoft' ? 'Microsoft Calendar' : 
                   'External Calendar'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  External
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setViewingExternalAppointment(null)}
                className="w-full px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

