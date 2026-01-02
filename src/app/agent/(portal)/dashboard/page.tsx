"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Calendar, ChevronLeft, ChevronRight, Phone, Mail as MailIcon, Users, Plus, MoreHorizontal, ArrowUpDown, AlertCircle, Check, User, Clock } from "lucide-react";

type Stats = {
  available: number;
  myLeads: number;
  newLeads: number;
  purchased: number;
  purchasedThisMonth: number;
  totalSpent: number;
  myAppointments: number;
};

type Appointment = {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  status: string;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    available: 0,
    myLeads: 0,
    newLeads: 0,
    purchased: 0,
    purchasedThisMonth: 0,
    totalSpent: 0,
    myAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    let mounted = true;

    // Listen for profile updates
    const handleProfileUpdate = async () => {
      if (!mounted) return;
      
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && mounted) {
          setUserName(profile.full_name || 'Agent');
          const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Agent';
          setUserFirstName(firstName);
        }
      } catch (error) {
        console.error('Error refreshing profile on dashboard:', error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    async function loadDashboard() {
      setLoading(true);
      try {
        // Get user and session in parallel
        const [userResult, sessionResult] = await Promise.all([
          supabaseClient.auth.getUser(),
          supabaseClient.auth.getSession(),
        ]);

        const { data: { user } } = userResult;
        const { data: { session } } = sessionResult;

        if (!user || !session?.access_token) {
          router.push("/agent");
          return;
        }

        const agentId = user.id;
        setUserId(agentId);

        // Fetch dashboard API and profile (with metadata) in parallel
        const [dashboardRes, profileResult] = await Promise.all([
          fetch(`/api/agent/dashboard?agentId=${agentId}`),
          supabaseClient
            .from("profiles")
            .select("full_name, first_name, last_name, metadata, agent_province")
            .eq("id", agentId)
            .maybeSingle(),
        ]);
        
        // Handle profile
        const { data: profileData } = profileResult;
        if (profileData) {
          setUserName(profileData.full_name || 'Agent');
          const firstName = profileData.first_name || profileData.full_name?.split(' ')[0] || 'Agent';
          setUserFirstName(firstName);
        }

        // Handle dashboard API
        if (!dashboardRes.ok) {
          const errorData = await dashboardRes.json().catch(() => ({}));
          console.error("Dashboard API error:", errorData);
          throw new Error(errorData.error || "Failed to load dashboard");
        }

        const data = await dashboardRes.json();

        if (!data || data.error) {
          throw new Error(data.error || "Failed to load dashboard data");
        }

        // Update stats
        setStats({
          available: data.stats.availableLeads ?? 0,
          myLeads: data.stats.myLeads ?? 0,
          newLeads: data.stats.newLeadsNeedingAttention ?? 0,
          purchased: 0,
          purchasedThisMonth: data.stats.purchasedThisMonth ?? 0,
          totalSpent: (data.stats.totalSpentCents ?? 0) / 100,
          myAppointments: data.stats.myAppointments ?? 0,
        });

        // Get agent's timezone from profile data we already fetched
        let agentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Vancouver";
        
        if (profileData?.metadata?.timezone) {
          agentTimezone = profileData.metadata.timezone;
        } else if (profileData?.metadata?.availability?.timezone) {
          agentTimezone = profileData.metadata.availability.timezone;
        } else if (profileData?.agent_province) {
          const province = profileData.agent_province.toUpperCase();
          if (province === "BC" || province === "BRITISH COLUMBIA") {
            agentTimezone = "America/Vancouver";
          } else if (province === "AB" || province === "ALBERTA") {
            agentTimezone = "America/Edmonton";
          } else if (province === "SK" || province === "SASKATCHEWAN") {
            agentTimezone = "America/Regina";
          } else if (province === "MB" || province === "MANITOBA") {
            agentTimezone = "America/Winnipeg";
          } else if (province === "ON" || province === "ONTARIO") {
            agentTimezone = "America/Toronto";
          } else if (province === "QC" || province === "QUEBEC") {
            agentTimezone = "America/Montreal";
          }
        }

        // Fetch recent appointments and weekly appointments in parallel
        const [appointmentsRes, weeklyAppointmentsResult] = await Promise.all([
          fetch("/api/appointments/mine", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          supabaseClient
            .from("appointments")
            .select("requested_date, created_at")
            .eq("agent_id", agentId)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ]);
        
        if (!appointmentsRes.ok) {
          throw new Error("Failed to fetch appointments");
        }
        
        const appointmentsFromAPI = await appointmentsRes.json();
        
        // Format appointments for dashboard display and calendar widget (reuse same data)
        if (appointmentsFromAPI && Array.isArray(appointmentsFromAPI)) {
          const { DateTime } = await import('luxon');
          
          // appointmentsFromAPI already has starts_at, ends_at, family_name, and location from the API
          const formattedAppointments: Appointment[] = appointmentsFromAPI
            .slice(0, 5) // Limit to 5 most recent
            .map((apt: any) => {
              // Parse the ISO timestamps and convert to agent's timezone
              const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
              const localStart = startDate.setZone(agentTimezone);
              
              // Format date and time in agent's timezone
              const date = localStart.toLocaleString({ 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            });
              const time = localStart.toLocaleString({ 
              hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });
            
            return {
              id: apt.id,
                name: apt.family_name || 'Unknown',
                location: apt.location || 'N/A', // Location from API (lead's city, province)
              date,
              time,
                status: apt.status === 'confirmed' || apt.status === 'booked' ? 'confirmed' : 'pending',
            };
          });
          
          setAppointments(formattedAppointments);

          // Also process calendar appointments from the same data (reuse instead of fetching again)
          const appointmentsByDay: Record<number, number> = {};
          appointmentsFromAPI.forEach((apt: any) => {
            const startDate = DateTime.fromISO(apt.starts_at, { zone: "utc" });
            const localStart = startDate.setZone(agentTimezone);
            const dayOfMonth = localStart.day;
            appointmentsByDay[dayOfMonth] = (appointmentsByDay[dayOfMonth] || 0) + 1;
          });
          setCalendarAppointments(appointmentsByDay);
        }

        // Use weekly appointments we already fetched
        const { data: weeklyAppointments } = weeklyAppointmentsResult;

        // Group appointments by day of week (Mon-Fri)
        const dayCounts: Record<string, number> = {
          'Mon': 0,
          'Tue': 0,
          'Wed': 0,
          'Thu': 0,
          'Fri': 0,
        };

        (weeklyAppointments || []).forEach((apt: any) => {
          const date = apt.requested_date ? new Date(apt.requested_date) : new Date(apt.created_at);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[dayOfWeek];
          if (dayName && dayCounts[dayName] !== undefined) {
            dayCounts[dayName]++;
          }
        });

        // Calculate max value for percentage scaling
        const maxCount = Math.max(...Object.values(dayCounts), 1);
        
        setMeetingsData([
          { day: 'Mon', value: maxCount > 0 ? Math.round((dayCounts['Mon'] / maxCount) * 100) : 0 },
          { day: 'Tue', value: maxCount > 0 ? Math.round((dayCounts['Tue'] / maxCount) * 100) : 0 },
          { day: 'Wed', value: maxCount > 0 ? Math.round((dayCounts['Wed'] / maxCount) * 100) : 0 },
          { day: 'Thu', value: maxCount > 0 ? Math.round((dayCounts['Thu'] / maxCount) * 100) : 0 },
          { day: 'Fri', value: maxCount > 0 ? Math.round((dayCounts['Fri'] / maxCount) * 100) : 0 },
        ]);

        // Load appointments for calendar display - use the same API as schedule page
        // Calendar appointments already processed above from appointmentsFromAPI (no duplicate fetch needed)

        // Load availability settings (reuse profileData from above)
        if (profileData?.metadata?.availability) {
          const availability = profileData.metadata.availability;
          setAvailabilitySettings({
            locations: availability.locations || [],
            availabilityByLocation: availability.availabilityByLocation || {},
            appointmentLength: availability.appointmentLength || "30",
          });
        }
      } catch (err) {
        console.error("Error loading agent dashboard:", err);
        setError("Failed to load dashboard stats");
      } finally {
        if (mounted) {
        setLoading(false);
        }
      }
    }

    loadDashboard();

    // Check for calendar connection success message
    const urlParams = new URLSearchParams(window.location.search);
    const calendarConnected = urlParams.get("calendarConnected");
    const redirectTo = urlParams.get("redirectTo");
    
    if (calendarConnected) {
      const provider = calendarConnected === "google" ? "Google Calendar" : "Microsoft Calendar";
      alert(`Successfully connected ${provider}! You can now view it in Settings.`);
      
      // Clean up URL
      const newUrl = redirectTo === "settings" 
        ? "/agent/settings" 
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      // Redirect to settings if requested
      if (redirectTo === "settings") {
        setTimeout(() => {
          router.push("/agent/settings");
        }, 500);
      }
    }

    return () => {
      mounted = false;
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [router]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const currentDay = today.getDay();
  const calendarDates: number[] = [];
  
  // Get dates for current week
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - currentDay + i + 1);
    calendarDates.push(date.getDate());
  }

  const [meetingsData, setMeetingsData] = useState([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
  ]);
  const [calendarAppointments, setCalendarAppointments] = useState<Record<number, number>>({});
  const [availabilitySettings, setAvailabilitySettings] = useState<{
    locations: string[];
    availabilityByLocation: Record<string, any>;
    appointmentLength: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-2xl p-6">
              <div>
                <h2 className="text-2xl mb-2 text-white">
                  Welcome back, <span className="text-gray-100">{userFirstName || 'Agent'}</span>
                </h2>
                <p className="text-green-100">Have a nice day at work</p>
              </div>
            </div>
            
            {/* Weekly Reports */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900">Weekly Reports</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700">Last week</button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Appointments */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Calendar size={20} className="text-green-800" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Appointments</div>
                  <div className="text-2xl text-gray-900">{stats.myAppointments}</div>
                </div>
              </div>
            </div>
            
            {/* My Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">My appointments</h3>
              
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto md:overflow-visible">
                <div className="min-w-[600px] md:min-w-0 space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 pb-2 border-b border-gray-100">
                    <div className="col-span-3 flex items-center gap-2">
                      Name
                      <ArrowUpDown size={14} className="text-green-800" />
                    </div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-3 flex items-center gap-2">
                      Date
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      Time
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {/* Table Rows */}
                  {appointments.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No appointments yet. <Link href="/agent/appointments" className="text-green-800 hover:underline">Browse available appointments</Link>
                    </div>
                  ) : (
                    appointments.map((apt, idx) => (
                      <Link
                        key={apt.id}
                        href={`/agent/my-appointments`}
                        className={`grid grid-cols-12 gap-4 items-center py-3 rounded-lg transition-colors ${
                          apt.status === 'confirmed' ? 'bg-green-50 hover:bg-green-100' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="col-span-3">
                          <span className="text-sm text-gray-900">{apt.name || 'Unknown'}</span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">{apt.location}</div>
                        <div className="col-span-3 text-sm text-gray-600">{apt.date}</div>
                        <div className="col-span-2 text-sm text-gray-600">{apt.time}</div>
                        <div className="col-span-1">
                          {apt.status === 'confirmed' ? (
                            <Check size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-500" />
                          )}
                        </div>
                        <div className="col-span-1">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/agent/my-appointments`);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal size={16} className="text-gray-400" />
                          </button>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Hidden on mobile */}
          <div className="hidden md:block space-y-6">
            {/* Schedule Calendar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Schedule Calendar</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {today.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, idx) => {
                  const isToday = idx === currentDay - 1;
                  return (
                    <div key={day} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day}</div>
                      <div className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${
                        isToday ? 'bg-green-800 text-white' : 'bg-gray-50 text-gray-900'
                      }`}>
                        <div>{calendarDates[idx]}</div>
                        {(() => {
                          const dayNum = calendarDates[idx];
                          const appointmentCount = calendarAppointments[dayNum] || 0;
                          if (appointmentCount > 0) {
                            // Show dots for appointments (max 3 dots)
                            const dotsToShow = Math.min(appointmentCount, 3);
                            return (
                          <div className="flex gap-0.5 mt-1">
                                {Array.from({ length: dotsToShow }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`w-1 h-1 rounded-full ${
                                      isToday ? 'bg-white' : 'bg-green-600'
                                    }`}
                                  ></span>
                                ))}
                          </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Number of Meetings Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900">Number of Meetings</h3>
                <button className="text-xs text-gray-500 hover:text-gray-700">Last week</button>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-3 border-l-2 border-b-2 border-gray-200 pl-2 pb-2">
                {meetingsData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center justify-end h-40">
                      <div 
                        className="w-full bg-green-800 rounded-t hover:bg-green-900 transition-colors"
                        style={{ height: `${item.value}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600">{item.day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Overview */}
            {availabilitySettings && availabilitySettings.locations.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability Overview
                </h3>
                <div className="space-y-4 text-sm">
                  {/* Locations */}
                  <div>
                    <span className="text-gray-600 block mb-2">Locations</span>
                    <div className="space-y-1">
                      {availabilitySettings.locations.map((location, idx) => (
                        <div key={idx} className="text-gray-900 font-medium">{location}</div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule for first location */}
                  {availabilitySettings.locations.length > 0 && (() => {
                    const firstLocation = availabilitySettings.locations[0];
                    const locationSchedule = availabilitySettings.availabilityByLocation[firstLocation] || {};
                    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                    const enabledDays = days.filter(day => locationSchedule[day]?.enabled);
                    
                    if (enabledDays.length > 0) {
                      return (
                        <div>
                          <span className="text-gray-600 block mb-2">Schedule ({firstLocation})</span>
                          <div className="space-y-1">
                            {enabledDays.map((day, idx) => {
                              const dayData = locationSchedule[day];
                              const dayLabel = dayLabels[days.indexOf(day)];
                              const formatTime = (timeStr: string) => {
                                const [hours, minutes] = timeStr.split(":").map(Number);
                                const period = hours >= 12 ? "PM" : "AM";
                                const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
                                return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
                              };
                              return (
                                <div key={idx} className="text-gray-900">
                                  {dayLabel}: {formatTime(dayData.start)} - {formatTime(dayData.end)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Appointment Length */}
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600">Appointment Length</span>
                    <span className="text-gray-900 font-medium">{availabilitySettings.appointmentLength} minutes</span>
                  </div>

                  <Link
                    href="/agent/schedule?openAvailability=true"
                    className="w-full mt-4 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm flex items-center justify-center"
                  >
                    Edit Availability
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability Overview
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-500 text-xs">No availability set up yet</p>
                  <Link
                    href="/agent/settings"
                    className="w-full mt-4 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm flex items-center justify-center"
                  >
                    Set Availability
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
