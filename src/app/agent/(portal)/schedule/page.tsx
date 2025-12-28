"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, Clock, User, X, Loader2, ChevronLeft, ChevronRight, Search, Settings, Bell, Check, Eye, Download, Plus } from "lucide-react";
import { DateTime } from "luxon";
import Link from "next/link";
import { ClientInfoModal } from "../my-appointments/components/ClientInfoModal";
import { downloadClientInfo } from "@/lib/downloadClientInfo";

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

type ViewType = 'upcoming' | 'week';
type FilterType = 'all' | 'today' | 'next7' | 'next30';

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
  const [userName, setUserName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewType>('upcoming');
  const [filter, setFilter] = useState<FilterType>('next7');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [availabilityOverview, setAvailabilityOverview] = useState<{
    workingHours: string;
    slotLength: string;
    bufferTime: string;
    timeZone: string;
  } | null>(null);
  const [agentTimezone, setAgentTimezone] = useState<string>("America/Vancouver"); // Default to PST
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

        // Get user name
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
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

        // Load availability settings
        if (user) {
          const { data: profileData } = await supabaseClient
            .from("profiles")
            .select("metadata")
            .eq("id", user.id)
            .maybeSingle();

          if (profileData?.metadata?.availability) {
            const availability = profileData.metadata.availability;
            const locations = availability.locations || [];
            const availabilityByLocation = availability.availabilityByLocation || {};
            const appointmentLength = availability.appointmentLength || "30";
            
            // Get first location's schedule as default
            if (locations.length > 0) {
              const firstLocation = locations[0];
              const locationSchedule = availabilityByLocation[firstLocation] || {};
              
              // Find common working hours across enabled days
              const enabledDays = Object.keys(locationSchedule).filter(
                (day) => locationSchedule[day]?.enabled
              );
              
              if (enabledDays.length > 0) {
                const times = enabledDays.map((day) => ({
                  start: locationSchedule[day].start,
                  end: locationSchedule[day].end,
                }));
                
                // Find earliest start and latest end
                const allStarts = times.map((t) => {
                  const [hours, minutes] = t.start.split(":").map(Number);
                  return hours * 60 + minutes;
                });
                const allEnds = times.map((t) => {
                  const [hours, minutes] = t.end.split(":").map(Number);
                  return hours * 60 + minutes;
                });
                
                const earliestStart = Math.min(...allStarts);
                const latestEnd = Math.max(...allEnds);
                
                const startHour = Math.floor(earliestStart / 60);
                const startMin = earliestStart % 60;
                const endHour = Math.floor(latestEnd / 60);
                const endMin = latestEnd % 60;
                
                const formatTime = (hour: number, min: number) => {
                  const period = hour >= 12 ? "PM" : "AM";
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
                };
                
                // Get timezone from metadata or use browser detection
                const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const timezoneFromMetadata = availability.timezone || detectedTimezone || "America/Vancouver";
                setAgentTimezone(timezoneFromMetadata);
                
                setAvailabilityOverview({
                  workingHours: `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`,
                  slotLength: `${appointmentLength} minutes`,
                  bufferTime: "10 minutes", // Default, could be added to settings later
                  timeZone: timezoneFromMetadata,
                });
              }
            }
          }
          
          // Fallback to defaults if no availability set
          if (!availabilityOverview || !profileData?.metadata?.availability) {
            const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Vancouver";
            setAgentTimezone(detectedTimezone);
            setAvailabilityOverview({
              workingHours: "9 AM - 5 PM",
              slotLength: "30 minutes",
              bufferTime: "10 minutes",
              timeZone: detectedTimezone,
            });
          }
        }

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
        setHasCalendarConnection(false);
        setShowCalendarModal(true);
        return;
      }

      if (connections && connections.length > 0) {
        setHasCalendarConnection(true);
        setShowCalendarModal(false);
        localStorage.removeItem(`calendar_modal_dismissed_${specialistId}`);
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

  useEffect(() => {
    if (!checkingConnection && !hasCalendarConnection) {
      const id = specialist?.id || 'new';
      const dismissed = localStorage.getItem(`calendar_modal_dismissed_${id}`);
      if (dismissed === "true") {
        setShowCalendarModal(false);
      } else {
        setShowCalendarModal(true);
      }
    }
  }, [checkingConnection, hasCalendarConnection, specialist]);

  // Calculate the current week's dates
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (offset * 7);
    const sunday = new Date(today.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(currentWeekOffset);

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
  const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
  const goToToday = () => setCurrentWeekOffset(0);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Filter appointments based on selected filter
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let filtered = appointments;

    if (filter === 'today') {
      filtered = filtered.filter(apt => {
        const aptDate = DateTime.fromISO(apt.starts_at, { zone: "utc" }).toJSDate();
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
      });
    } else if (filter === 'next7') {
      const next7Days = new Date(today);
      next7Days.setDate(today.getDate() + 7);
      filtered = filtered.filter(apt => {
        const aptDate = DateTime.fromISO(apt.starts_at, { zone: "utc" }).toJSDate();
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && aptDate <= next7Days;
      });
    } else if (filter === 'next30') {
      const next30Days = new Date(today);
      next30Days.setDate(today.getDate() + 30);
      filtered = filtered.filter(apt => {
        const aptDate = DateTime.fromISO(apt.starts_at, { zone: "utc" }).toJSDate();
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today && aptDate <= next30Days;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.family_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => 
      DateTime.fromISO(a.starts_at).toMillis() - DateTime.fromISO(b.starts_at).toMillis()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appointments for week view
  const getAppointmentsForWeek = () => {
    return appointments.map(apt => {
      const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
      const localStart = startDate.setZone(agentTimezone); // Use agent's timezone
      const weekStart = weekDates[0];
      const weekEnd = weekDates[6];
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      
      if (localStart.toJSDate() >= weekStart && localStart.toJSDate() <= weekEnd) {
        const day = localStart.weekday % 7; // Convert to 0-6 (Sun-Sat)
        const hour = localStart.hour;
        const duration = DateTime.fromISO(apt.ends_at, { zone: "utc" })
          .diff(startDate, 'hours').hours;
        
        return {
          ...apt,
          day,
          startTime: hour,
          duration,
          color: apt.status === 'confirmed' ? '#16a34a' : apt.status === 'pending' ? '#059669' : '#ef4444',
          lead_id: apt.lead_id,
        };
      }
      return null;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const filteredAppointments = getFilteredAppointments();
  const weekAppointments = getAppointmentsForWeek();
  
  // Calculate dynamic hours based on appointments in the week
  const calculateHours = () => {
    if (view !== 'week' || weekAppointments.length === 0) {
      // Default hours if no appointments or not in week view
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
    }
    
    // Find earliest and latest appointment times in the week
    const appointmentHours = weekAppointments.map((apt: any) => {
      const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
      const localStart = startDate.setZone(agentTimezone);
      return localStart.hour;
    });
    
    const earliestHour = Math.min(...appointmentHours);
    const latestHour = Math.max(...appointmentHours);
    
    // Start 1 hour before earliest appointment, but not earlier than 6 AM
    const startHour = Math.max(6, earliestHour - 1);
    // End 1 hour after latest appointment, but not later than 11 PM
    const endHour = Math.min(23, latestHour + 1);
    
    // Generate hours array
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  };
  
  const hours = calculateHours();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#064e3b] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-black">Schedule</h1>
                <p className="text-sm text-gray-500">Manage your appointments and availability</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Time Off
              </button>
              <button className="px-5 py-2.5 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Edit Availability
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setView('upcoming')}
              className={`px-6 py-2.5 rounded-lg transition-all ${
                view === 'upcoming'
                  ? 'bg-[#064e3b] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-6 py-2.5 rounded-lg transition-all ${
                view === 'week'
                  ? 'bg-[#064e3b] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Filters and Search (only for upcoming view) */}
          {view === 'upcoming' && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('today')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    filter === 'today' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setFilter('next7')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    filter === 'next7' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Next 7 Days
                </button>
                <button
                  onClick={() => setFilter('next30')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    filter === 'next30' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Next 30 Days
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by family name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent w-80"
                />
              </div>
            </div>
          )}

          {/* Week Navigation (only for week view) */}
          {view === 'week' && (
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousWeek}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{formatDateRange()}</span>
                <button
                  onClick={goToToday}
                  className="px-5 py-2 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-all text-sm"
                >
                  Today
                </button>
              </div>

              <button
                onClick={goToNextWeek}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className={`grid grid-cols-1 ${view === 'week' ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-6`}>
          {/* Main Content Area */}
          <div className={view === 'week' ? 'lg:col-span-1' : 'lg:col-span-3'}>
            {view === 'upcoming' ? (
              <div className="space-y-4">
                {loadingAppointments ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Loading appointments...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 mb-2">No upcoming appointments</h3>
                    <p className="text-gray-500 mb-6">Get started by setting your availability and connecting your calendar</p>
                    <div className="flex gap-3 justify-center">
                      <button className="px-5 py-2.5 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-all">
                        Set Availability
                      </button>
                      <button 
                        onClick={() => setShowCalendarModal(true)}
                        className="px-5 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        Connect Calendar
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => {
                    const startDate = DateTime.fromISO(appointment.starts_at, { zone: "utc" });
                    const endDate = DateTime.fromISO(appointment.ends_at, { zone: "utc" });
                    const localStart = startDate.setZone(agentTimezone); // Use agent's timezone
                    const localEnd = endDate.setZone(agentTimezone); // Use agent's timezone
                    const aptDate = localStart.toJSDate();

                    return (
                      <div
                        key={appointment.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-6 flex-1">
                            {/* Date & Time */}
                            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 min-w-[100px]">
                              <div className="text-xs text-gray-500 uppercase">
                                {aptDate.toLocaleDateString('en-US', { month: 'short' })}
                              </div>
                              <div className="text-2xl text-gray-900 mt-1">
                                {aptDate.getDate()}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {localStart.toLocaleString(DateTime.TIME_SIMPLE)}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-gray-900">
                                  {appointment.is_external 
                                    ? appointment.family_name || 'External Meeting'
                                    : `Appointment with ${appointment.family_name || 'Family'}`}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                                  {appointment.is_external ? 'External' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {localStart.toLocaleString(DateTime.TIME_SIMPLE)} - {localEnd.toLocaleString(DateTime.TIME_SIMPLE)}
                                </span>
                                {appointment.is_external && appointment.provider && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs text-gray-500">{appointment.provider === 'google' ? 'Google' : appointment.provider === 'microsoft' ? 'Microsoft' : 'External'}</span>
                                  </>
                                )}
                                {!appointment.is_external && (
                                  <>
                                    <span>•</span>
                                    <span>{appointment.family_name || 'Unknown'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!appointment.is_external && (
                              <>
                                <button
                                  onClick={() => {
                                    if (appointment.lead_id) {
                                      setViewingLeadId(appointment.lead_id);
                                      setViewingAppointmentId(appointment.id);
                                    }
                                  }}
                                  disabled={!appointment.lead_id}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={appointment.lead_id ? "View client information" : "No client information available"}
                                >
                                  <Eye className={`w-5 h-5 ${appointment.lead_id ? '' : 'text-gray-300'}`} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (appointment.lead_id) {
                                      try {
                                        await downloadClientInfo(appointment.lead_id, appointment.family_name);
                                      } catch (error) {
                                        console.error('Error downloading client info:', error);
                                        alert('Failed to download client information. Please try again.');
                                      }
                                    }
                                  }}
                                  disabled={!appointment.lead_id}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={appointment.lead_id ? "Download client information" : "No client information available"}
                                >
                                  <Download className={`w-5 h-5 ${appointment.lead_id ? '' : 'text-gray-300'}`} />
                                </button>
                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Cancel">
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {appointment.is_external && (
                              <span className="text-xs text-gray-500 italic">Booked externally</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Week View
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                {/* Day Headers */}
                <div className="grid grid-cols-8 border-b border-gray-200 bg-white sticky top-0 z-20">
                  <div className="p-4"></div>
                  {weekDates.map((date, index) => {
                    const today = isToday(date);
                    return (
                      <div
                        key={index}
                        className="p-4 text-center border-l border-gray-200"
                      >
                        <div className={`text-xs uppercase tracking-wide ${today ? 'text-[#064e3b]' : 'text-gray-500'}`}>
                          {dayNames[index]}
                        </div>
                        <div className={`mt-2 inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                          today ? 'bg-[#064e3b] text-white' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="divide-y divide-gray-100">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 group">
                      {/* Time Label */}
                      <div className="p-4 flex items-start justify-end pr-6 text-xs text-gray-500 bg-gray-50/50">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>

                      {/* Day Cells */}
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <div
                          key={day}
                          className="border-l border-gray-200 p-3 min-h-[90px] relative bg-white hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          {/* Render appointments for this time slot */}
                          {weekAppointments
                            .filter((apt: any) => apt.day === day && apt.startTime === hour)
                            .map((apt: any) => (
                              <div
                                key={apt.id}
                                onClick={() => {
                                  if (apt.lead_id) {
                                    setViewingLeadId(apt.lead_id);
                                    setViewingAppointmentId(apt.id);
                                  }
                                }}
                                className="absolute left-2 right-2 rounded-lg p-3 text-white shadow-md cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] z-10"
                                style={{
                                  backgroundColor: apt.color,
                                  height: `${apt.duration * 90 - 16}px`,
                                  top: '12px',
                                }}
                              >
                                <div className="text-xs opacity-90">
                                  {DateTime.fromISO(apt.starts_at, { zone: "utc" })
                                    .setZone(agentTimezone) // Use agent's timezone
                                    .toLocaleString(DateTime.TIME_SIMPLE)}
                                </div>
                                <div className="mt-1">{apt.family_name || 'Appointment'}</div>
                                {apt.is_external && (
                                  <div className="mt-1 text-xs opacity-75">External</div>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Only show in upcoming view */}
          {view === 'upcoming' && (
          <div className="lg:col-span-1 space-y-6">
            {/* Connected Calendars */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Connected Calendars
              </h3>
              <div className="space-y-3">
                {hasCalendarConnection ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-900">Calendar Connected</div>
                        <div className="text-xs text-gray-500">Synced</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">Not connected</div>
                        <div className="text-xs text-gray-500">Connect a calendar</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => setShowCalendarModal(true)}
                    className="w-full px-4 py-2 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-all text-sm"
                  >
                    {hasCalendarConnection ? 'Reconnect' : 'Connect Calendar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Availability Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Availability Overview
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Working Hours</span>
                  <span className="text-gray-900">{availabilityOverview?.workingHours || "9 AM - 5 PM"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slot Length</span>
                  <span className="text-gray-900">{availabilityOverview?.slotLength || "30 minutes"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Buffer Time</span>
                  <span className="text-gray-900">{availabilityOverview?.bufferTime || "10 minutes"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Zone</span>
                  <span className="text-gray-900">{availabilityOverview?.timeZone || "MST"}</span>
                </div>
                <Link
                  href="/agent/settings"
                  className="w-full mt-4 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm flex items-center justify-center"
                >
                  Edit Settings
                </Link>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Calendar Sync Modal */}
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-[#064e3b] hover:bg-green-50 transition-colors font-medium"
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-[#064e3b] hover:bg-green-50 transition-colors font-medium"
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
    </div>
  );
}
