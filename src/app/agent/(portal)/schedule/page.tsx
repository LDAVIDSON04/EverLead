"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { Calendar, Clock, User, X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { DateTime } from "luxon";
import { ClientInfoModal } from "../my-appointments/components/ClientInfoModal";
import { downloadClientInfo } from "@/lib/downloadClientInfo";
import { AddAvailabilityModal } from "./components/AddAvailabilityModal";
import { CalendarSyncModal } from "./components/CalendarSyncModal";
import { CreateEventModal } from "./components/CreateEventModal";

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

type ViewType = 'day' | 'week' | 'month';

export default function SchedulePage() {
  useRequireRole("agent");
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [currentDayOffset, setCurrentDayOffset] = useState(0);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [view, setView] = useState<ViewType>('week');
  const [agentTimezone, setAgentTimezone] = useState<string>("America/Vancouver");
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);
  const [viewingExternalAppointment, setViewingExternalAppointment] = useState<any | null>(null);
  const [showAddAvailabilityModal, setShowAddAvailabilityModal] = useState(false);
  const [showCalendarSyncModal, setShowCalendarSyncModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    date: Date;
    hour: number;
    minute: number;
  } | null>(null);
  const [appointmentLength, setAppointmentLength] = useState(60); // Default 60 minutes
  const [editingEvent, setEditingEvent] = useState<{
    appointmentId: string;
    leadId: string;
  } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect if we're on desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Check for query parameter to open availability modal
  useEffect(() => {
    const openAvailability = searchParams.get('openAvailability');
    if (openAvailability === 'true') {
      setShowAddAvailabilityModal(true);
      // Clean up URL by removing the query parameter
      router.replace('/agent/schedule', { scroll: false });
    }
  }, [searchParams, router]);

  // Calculate Sunday-Saturday week starting from Sunday of the current week
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate Sunday of current week (go back currentDay days)
    const sundayOffset = -currentDay;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + sundayOffset + (offset * 7));
    sunday.setHours(0, 0, 0, 0);

    // Return Sunday through Saturday (7 days)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      return date;
    });
  };

  // Calculate single day date
  const getDayDate = (offset: number) => {
    const today = new Date();
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    day.setHours(0, 0, 0, 0);
    return day;
  };

  // Calculate month dates (first day of month and all days in month grid)
  const getMonthDates = (offset: number) => {
    const today = new Date();
    const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    month.setHours(0, 0, 0, 0);
    
    // Get first day of month and what day of week it falls on
    const firstDay = new Date(month);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Start from the Sunday before the first day (or the first day if it's Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDayOfWeek);
    
    // Generate 42 days (6 weeks) to fill the grid
    const dates: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return {
      monthStart: month,
      gridDates: dates,
      currentMonth: month.getMonth(),
      currentYear: month.getFullYear(),
    };
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const dayDate = getDayDate(currentDayOffset);
  const monthData = getMonthDates(currentMonthOffset);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get day-based color for appointments (0 = Sunday, 1 = Monday, etc.)
  const getDayColor = (dayIndex: number): string => {
    const dayColors = [
      'bg-blue-200',      // Sunday - blue
      'bg-cyan-200',      // Monday - cyan
      'bg-orange-200',    // Tuesday - orange
      'bg-amber-200',     // Wednesday - amber
      'bg-emerald-200',   // Thursday - emerald/green
      'bg-purple-200',    // Friday - purple
      'bg-pink-200',      // Saturday - pink
    ];
    return dayColors[dayIndex] || 'bg-gray-200';
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    // If same month, show: "Dec 29 - Jan 4, 2025"
    // If different months/years, show full dates
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${formatDate(start)} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const formatDayDate = () => {
    return dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatMonthDate = () => {
    return monthData.monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDateRange = () => {
    if (view === 'day') return formatDayDate();
    if (view === 'week') return formatWeekRange();
    if (view === 'month') return formatMonthDate();
    return formatWeekRange();
  };

  // Navigation functions
  const goToPrevious = () => {
    if (view === 'day') setCurrentDayOffset(currentDayOffset - 1);
    else if (view === 'week') setCurrentWeekOffset(currentWeekOffset - 1);
    else if (view === 'month') setCurrentMonthOffset(currentMonthOffset - 1);
  };

  const goToNext = () => {
    if (view === 'day') setCurrentDayOffset(currentDayOffset + 1);
    else if (view === 'week') setCurrentWeekOffset(currentWeekOffset + 1);
    else if (view === 'month') setCurrentMonthOffset(currentMonthOffset + 1);
  };

  const goToToday = () => {
    setCurrentDayOffset(0);
    setCurrentWeekOffset(0);
    setCurrentMonthOffset(0);
  };

  // Legacy functions for backward compatibility
  const goToPreviousWeek = () => goToPrevious();
  const goToNextWeek = () => goToNext();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === monthData.currentMonth && date.getFullYear() === monthData.currentYear;
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

        // Get appointment length from metadata
        const metadata = profileData?.metadata || {};
        const availability = (metadata as any)?.availability || {};
        const length = availability.appointmentLength ? parseInt(availability.appointmentLength, 10) : 60;
        setAppointmentLength(length);

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

  // Helper function to process appointments
  const processAppointment = (apt: Appointment, dateRange: { start: Date; end: Date }, dayIndex?: number) => {
    const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
    const localStart = startDate.setZone(agentTimezone);
    const aptDate = localStart.toJSDate();
    
    if (aptDate >= dateRange.start && aptDate <= dateRange.end) {
      const endDate = DateTime.fromISO(apt.ends_at, { zone: "utc" });
      const localEnd = endDate.setZone(agentTimezone);
      const durationMinutes = localEnd.diff(localStart, 'minutes').minutes;
      
      return {
        ...apt,
        day: dayIndex !== undefined ? dayIndex : 0,
        hour: localStart.hour,
        minute: localStart.minute,
        durationMinutes,
        startTime: `${String(localStart.hour).padStart(2, '0')}:${String(localStart.minute).padStart(2, '0')}`,
        endTime: `${String(localEnd.hour).padStart(2, '0')}:${String(localEnd.minute).padStart(2, '0')}`,
        date: aptDate,
      };
    }
    return null;
  };

  // Get appointments for the week (Sunday-Saturday)
  const getWeekAppointments = () => {
    const weekStart = new Date(weekDates[0]);
    const weekEnd = new Date(weekDates[6]);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    return appointments
      .map(apt => {
        const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
        const localStart = startDate.setZone(agentTimezone);
        const aptDate = localStart.toJSDate();
        
        if (aptDate >= weekStart && aptDate <= weekEnd) {
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

  // Get appointments for a single day
  const getDayAppointments = () => {
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    return appointments
      .map(apt => {
        const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
        const localStart = startDate.setZone(agentTimezone);
        const aptDate = localStart.toJSDate();
        
        if (aptDate >= dayStart && aptDate <= dayEnd) {
          const endDate = DateTime.fromISO(apt.ends_at, { zone: "utc" });
          const localEnd = endDate.setZone(agentTimezone);
          const durationMinutes = localEnd.diff(localStart, 'minutes').minutes;
          
          return {
            ...apt,
            day: 0,
            hour: localStart.hour,
            minute: localStart.minute,
            durationMinutes,
            startTime: `${String(localStart.hour).padStart(2, '0')}:${String(localStart.minute).padStart(2, '0')}`,
            endTime: `${String(localEnd.hour).padStart(2, '0')}:${String(localEnd.minute).padStart(2, '0')}`,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // Get appointments for the month
  const getMonthAppointments = () => {
    const monthStart = new Date(monthData.monthStart);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthData.monthStart.getFullYear(), monthData.monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const appointmentsByDate: { [key: string]: any[] } = {};

    appointments.forEach(apt => {
      const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
      const localStart = startDate.setZone(agentTimezone);
      const aptDate = localStart.toJSDate();
      const dateKey = aptDate.toDateString();
      
      if (aptDate >= monthStart && aptDate <= monthEnd) {
        const endDate = DateTime.fromISO(apt.ends_at, { zone: "utc" });
        const localEnd = endDate.setZone(agentTimezone);
        
        if (!appointmentsByDate[dateKey]) {
          appointmentsByDate[dateKey] = [];
        }
        
        appointmentsByDate[dateKey].push({
          ...apt,
          hour: localStart.hour,
          minute: localStart.minute,
          startTime: `${String(localStart.hour).padStart(2, '0')}:${String(localStart.minute).padStart(2, '0')}`,
          endTime: `${String(localEnd.hour).padStart(2, '0')}:${String(localEnd.minute).padStart(2, '0')}`,
        });
      }
    });

    // Sort appointments within each day by start time
    Object.keys(appointmentsByDate).forEach(dateKey => {
      appointmentsByDate[dateKey].sort((a, b) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
      });
    });

    return appointmentsByDate;
  };

  const weekAppointments = getWeekAppointments();
  const dayAppointments = getDayAppointments();
  const monthAppointments = getMonthAppointments();

  // Calculate hours for display (8 AM to 8 PM, or based on appointments)
  const calculateHours = (appts: any[]) => {
    if (appts.length === 0) {
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
    }
    
    const appointmentHours = appts.map((apt: any) => apt.hour);
    const earliestHour = Math.min(...appointmentHours);
    const latestHour = Math.max(...appointmentHours);
    
    const startHour = Math.max(8, earliestHour - 1);
    const endHour = Math.min(20, latestHour + 1);
    
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  };

  const weekHours = calculateHours(weekAppointments);
  const dayHours = calculateHours(dayAppointments);

  // Handle empty time block click
  const handleEmptyBlockClick = (date: Date, hour: number, minute: number = 0) => {
    setSelectedTimeSlot({ date, hour, minute });
    setShowCreateEventModal(true);
  };

  // Handle event save
  const handleEventSave = async (eventData: {
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string;
    description?: string;
  }) => {
    const session = await supabaseClient.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error("Not authenticated");
    }

    // If editing, use PUT to update; otherwise POST to create
    const isEditing = editingEvent !== null;
    const url = isEditing
      ? `/api/agent/events/${editingEvent?.appointmentId}`
      : "/api/agent/events/create";
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to ${isEditing ? "update" : "create"} event`);
    }

    // Reload appointments to show the updated/new event
    const appointmentsRes = await fetch("/api/appointments/mine", {
      headers: { Authorization: `Bearer ${session.data.session.access_token}` },
    });
    if (appointmentsRes.ok) {
      const newAppointments = await appointmentsRes.json();
      setAppointments(newAppointments || []);
    }

    // Close edit mode if we were editing
    if (isEditing) {
      setEditingEvent(null);
    }
  };

  // Render appointment box (shared across views)
  const renderAppointmentBox = (apt: any, color: string, showLocation: boolean = true) => {
    const cleanLocation = apt.location && 
      apt.location !== "N/A" && 
      apt.location !== "External Calendar" &&
      !apt.location.match(/^(Google Calendar|Microsoft Calendar|ICS Calendar)$/i)
      ? apt.location.replace(/Google Calendar|Microsoft Calendar|ICS Calendar/gi, '').trim()
      : null;

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
        className={`${color} rounded p-0.5 md:p-1 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all border border-gray-200`}
      >
        <div className="h-full flex flex-col gap-0.5 px-0.5 md:px-1 py-0.5">
          <div className="text-[9px] md:text-xs font-medium text-gray-700 leading-tight line-clamp-1 break-words">
            {apt.family_name || 'Appointment'}
          </div>
          {showLocation && cleanLocation && cleanLocation.length > 0 && (
            <div className="flex items-center gap-0.5 mt-auto">
              <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5 text-gray-600 flex-shrink-0" />
              <span className="text-[8px] md:text-[10px] text-gray-600 truncate leading-tight">{cleanLocation}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-white relative overflow-hidden p-8 pt-[56px] md:pt-8">
      {/* Header */}
      <div className="mb-4 md:mb-8">
        {/* Date range and View Selector */}
        <div className="mb-3 md:mb-0 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg md:text-3xl font-semibold">{formatDateRange()}</h1>
          
          {/* View Selector - Modern Button Group */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                view === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                view === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                view === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
          </div>
        </div>
        
        {/* Navigation row */}
        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-0 md:inline-flex">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button 
            onClick={goToPrevious}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={goToNext}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 md:gap-4 md:justify-end">
          <button 
            onClick={() => setShowCalendarSyncModal(true)}
            className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            Calendar sync
          </button>
          <button 
            onClick={() => setShowAddAvailabilityModal(true)}
            className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Add availability
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="flex-1 overflow-auto overflow-x-hidden">
        {/* Week View - EXACTLY AS BEFORE */}
        {view === 'week' && (
          <div className="inline-block min-w-full">
            {/* Day Headers */}
            <div className="flex sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
              <div className="w-20 flex-shrink-0"></div>
              {weekDays.map((day, index) => {
                const date = weekDates[index];
                const today = isToday(date);
                return (
                  <div key={`${day}-${index}`} className="flex-1 min-w-[100px] px-2 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs text-gray-700 ${today ? 'font-semibold' : ''}`}>{day}</span>
                      <span className={`text-xs text-gray-500 ${today ? 'font-medium' : ''}`}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {weekHours.map((hour) => {
                return (
                  <div key={hour} className="flex border-t border-gray-200" style={{ overflow: 'visible', position: 'relative' }}>
                    <div className="w-12 md:w-20 flex-shrink-0 pr-1 md:pr-3 pt-1 md:pt-1.5 text-[10px] md:text-xs text-gray-500 text-right">
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
                          className="flex-1 min-w-[50px] md:min-w-[100px] border-l border-gray-200 relative h-12 md:h-20"
                          style={{ overflow: 'visible' }}
                        >
                          {cellAppointments.length === 0 ? (
                            <div
                              className="absolute inset-0 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleEmptyBlockClick(weekDates[dayIndex], hour, 0)}
                            />
                          ) : (
                            cellAppointments.map((apt: any) => {
                            // Calculate top offset within this hour (based on minutes)
                            // Hour cells are h-12 (48px) on mobile, h-20 (80px) on desktop
                            const pxPerHourMobile = 48;
                            const pxPerHourDesktop = 80;
                            const topOffsetMobile = (apt.minute / 60) * pxPerHourMobile;
                            const topOffsetDesktop = (apt.minute / 60) * pxPerHourDesktop;
                            
                            // Log all appointments to debug
                            if (apt.family_name?.includes('Seminar') || apt.family_name?.includes('seminar')) {
                              console.log(`📅 SEMINAR appointment found:`, {
                                title: apt.family_name,
                                durationMinutes: apt.durationMinutes,
                                startsAt: apt.starts_at,
                                endsAt: apt.ends_at,
                                hour: apt.hour,
                                minute: apt.minute,
                              });
                            }
                            
                            // Calculate height based on duration - for 2 hours = 2 * 80px = 160px on desktop
                            const heightMobile = (apt.durationMinutes / 60) * pxPerHourMobile;
                            const heightDesktop = (apt.durationMinutes / 60) * pxPerHourDesktop;
                            const color = getDayColor(dayIndex);
                            
                            // Debug log for any appointment with duration > 60 minutes
                            if (apt.durationMinutes > 60) {
                              console.log(`📅 Multi-hour appointment:`, {
                                title: apt.family_name,
                                durationMinutes: apt.durationMinutes,
                                heightMobile: `${heightMobile}px`,
                                heightDesktop: `${heightDesktop}px`,
                                calculatedHeight: `${(apt.durationMinutes / 60) * pxPerHourDesktop}px`,
                              });
                            }

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
                                className={`absolute inset-x-0.5 ${color} rounded p-0.5 md:p-1 shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-200`}
                                style={{
                                  top: `${topOffsetMobile}px`,
                                  height: `${heightMobile}px`,
                                  zIndex: 5,
                                } as React.CSSProperties}
                                data-top-desktop={topOffsetDesktop}
                                data-height-desktop={heightDesktop}
                              >
                                <div className="h-full flex flex-col gap-0.5 px-0.5 md:px-1 py-0.5">
                                  {/* Customer Name */}
                                  <div className="text-[9px] md:text-xs font-medium text-gray-700 leading-tight line-clamp-1 break-words">
                                    {apt.family_name || 'Appointment'}
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
                                      <div className="flex items-center gap-0.5 mt-auto">
                                        <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5 text-gray-600 flex-shrink-0" />
                                        <span className="text-[8px] md:text-[10px] text-gray-600 truncate leading-tight">{cleanLocation}</span>
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="inline-block min-w-full">
            {/* Day Header */}
            <div className="flex sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
              <div className="w-20 flex-shrink-0"></div>
              <div className="flex-1 px-2 py-3">
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-xs text-gray-700 ${isToday(dayDate) ? 'font-semibold' : ''}`}>
                    {dayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                  <span className={`text-xs text-gray-500 ${isToday(dayDate) ? 'font-medium' : ''}`}>
                    {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Time Grid */}
            <div className="relative">
              {dayHours.map((hour) => {
                const cellAppointments = dayAppointments.filter((apt: any) => apt.hour === hour);
                const dayIndex = dayDate.getDay();

                return (
                  <div key={hour} className="flex border-t border-gray-200" style={{ overflow: 'visible', position: 'relative' }}>
                    <div className="w-12 md:w-20 flex-shrink-0 pr-1 md:pr-3 pt-1 md:pt-1.5 text-[10px] md:text-xs text-gray-500 text-right">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                    <div className="flex-1 min-w-[50px] md:min-w-[100px] border-l border-gray-200 relative h-12 md:h-20"
                      style={{ overflow: 'visible' }}
                    >
                      {cellAppointments.length === 0 ? (
                        <div
                          className="absolute inset-0 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleEmptyBlockClick(dayDate, hour, 0)}
                        />
                      ) : (
                        cellAppointments.map((apt: any) => {
                            // Hour cells are h-12 (48px) on mobile, h-20 (80px) on desktop
                            const pxPerHourMobile = 48;
                            const pxPerHourDesktop = 80;
                            const topOffsetMobile = (apt.minute / 60) * pxPerHourMobile;
                            const topOffsetDesktop = (apt.minute / 60) * pxPerHourDesktop;
                            const heightMobile = (apt.durationMinutes / 60) * pxPerHourMobile;
                            const heightDesktop = (apt.durationMinutes / 60) * pxPerHourDesktop;
                            const color = getDayColor(dayIndex);

                            // Use desktop values if on desktop, mobile otherwise
                            const finalTop = isDesktop ? topOffsetDesktop : topOffsetMobile;
                            const finalHeight = isDesktop ? heightDesktop : heightMobile;

                            // Debug log for ALL appointments
                            if (apt.family_name?.includes('Seminar') || apt.durationMinutes > 60) {
                              console.log(`📅 Appointment rendering:`, {
                                title: apt.family_name,
                                durationMinutes: apt.durationMinutes,
                                isDesktop,
                                finalHeight: `${finalHeight}px`,
                                heightMobile: `${heightMobile}px`,
                                heightDesktop: `${heightDesktop}px`,
                                calculation: `${apt.durationMinutes}min / 60 * ${isDesktop ? 80 : 48}px = ${finalHeight}px`,
                              });
                            }

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
                                className={`absolute inset-x-0.5 ${color} rounded p-0.5 md:p-1 shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-200`}
                                style={{
                                  top: `${finalTop}px`,
                                  height: `${finalHeight}px`,
                                  zIndex: 5,
                                } as React.CSSProperties}
                          >
                            <div className="h-full flex flex-col gap-0.5 px-0.5 md:px-1 py-0.5">
                              <div className="text-[9px] md:text-xs font-medium text-gray-700 leading-tight line-clamp-1 break-words">
                                {apt.family_name || 'Appointment'}
                              </div>
                              {(() => {
                                const validLocation = apt.location && 
                                  apt.location !== "N/A" && 
                                  apt.location !== "External Calendar" &&
                                  !apt.location.match(/^(Google Calendar|Microsoft Calendar|ICS Calendar)$/i);
                                const cleanLocation = validLocation 
                                  ? apt.location.replace(/Google Calendar|Microsoft Calendar|ICS Calendar/gi, '').trim()
                                  : null;
                                return cleanLocation && cleanLocation.length > 0 ? (
                                  <div className="flex items-center gap-0.5 mt-auto">
                                    <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5 text-gray-600 flex-shrink-0" />
                                    <span className="text-[8px] md:text-[10px] text-gray-600 truncate leading-tight">{cleanLocation}</span>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month View */}
        {view === 'month' && (
          <div className="inline-block min-w-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center">
                  <span className="text-xs font-medium text-gray-700">{day}</span>
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7">
              {monthData.gridDates.map((date, index) => {
                const dateKey = date.toDateString();
                const dayAppts = monthAppointments[dateKey] || [];
                const today = isToday(date);
                const isCurrentMonthDay = isCurrentMonth(date);
                const maxVisible = 3;
                const visibleAppts = dayAppts.slice(0, maxVisible);
                const remainingCount = Math.max(0, dayAppts.length - maxVisible);

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-r border-b border-gray-200 p-1 ${
                      !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
                    } ${today ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-xs mb-1 ${today ? 'font-bold text-blue-600' : isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {visibleAppts.map((apt: any) => {
                        const dayIndex = date.getDay();
                        const color = getDayColor(dayIndex);
                        const hour = apt.hour;
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        const timeStr = `${displayHour}${apt.minute > 0 ? `:${String(apt.minute).padStart(2, '0')}` : ''} ${ampm}`;

                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (apt.lead_id && !apt.is_external) {
                                setViewingLeadId(apt.lead_id);
                                setViewingAppointmentId(apt.id);
                              } else if (apt.is_external) {
                                setViewingExternalAppointment(apt);
                              }
                            }}
                            className={`${color} rounded px-1.5 py-0.5 text-[10px] cursor-pointer hover:opacity-80 transition-opacity border border-gray-300 truncate`}
                            title={`${timeStr} - ${apt.family_name || 'Appointment'}`}
                          >
                            <span className="font-medium">{timeStr}</span>
                            <span className="ml-1">{apt.family_name || 'Appointment'}</span>
                          </div>
                        );
                      })}
                      {remainingCount > 0 && (
                        <div className="text-[10px] text-gray-600 px-1.5 py-0.5 cursor-pointer hover:text-gray-900">
                          +{remainingCount} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

      {/* Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={showCalendarSyncModal}
        onClose={() => setShowCalendarSyncModal(false)}
      />

      {/* Add Availability Modal */}
      <AddAvailabilityModal
        isOpen={showAddAvailabilityModal}
        onClose={() => setShowAddAvailabilityModal(false)}
        onSave={(message) => {
          if (message) {
            alert(message);
          }
          setShowAddAvailabilityModal(false);
        }}
      />

      {/* Create/Edit Event Modal */}
      {(selectedTimeSlot || editingEvent) && (
        <CreateEventModal
          isOpen={showCreateEventModal || editingEvent !== null}
          onClose={() => {
            setShowCreateEventModal(false);
            setSelectedTimeSlot(null);
            setEditingEvent(null);
          }}
          initialDate={selectedTimeSlot?.date || new Date()}
          initialHour={selectedTimeSlot?.hour || 9}
          initialMinute={selectedTimeSlot?.minute || 0}
          agentTimezone={agentTimezone}
          appointmentLength={appointmentLength}
          editingEvent={editingEvent}
          onSave={handleEventSave}
        />
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
        onEdit={(appointmentId, leadId) => {
          setEditingEvent({ appointmentId, leadId });
          setShowCreateEventModal(true);
        }}
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
