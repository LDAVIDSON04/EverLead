"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Search, Bell, Calendar, ChevronLeft, ChevronRight, Phone, Mail as MailIcon, Users, Plus, MoreHorizontal, ArrowUpDown, AlertCircle, Check, User, Clock } from "lucide-react";

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
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          router.push("/agent");
          return;
        }

        const agentId = user.id;
        setUserId(agentId);

        // Get user name
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name, first_name, last_name")
          .eq("id", agentId)
          .maybeSingle();
        
        if (profile) {
          setUserName(profile.full_name || 'Agent');
          const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'Agent';
          setUserFirstName(firstName);
        }

        // Fetch dashboard data from API
        const res = await fetch(`/api/agent/dashboard?agentId=${agentId}`);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Dashboard API error:", errorData);
          throw new Error(errorData.error || "Failed to load dashboard");
        }

        const data = await res.json();

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

        // Fetch recent appointments
        const { data: appointmentsData } = await supabaseClient
          .from("appointments")
          .select(`
            id,
            status,
            requested_date,
            created_at,
            lead_id,
            agent_id
          `)
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch leads for these appointments
        const leadIds = (appointmentsData || [])
          .map((apt: any) => apt.lead_id)
          .filter(Boolean);
        
        let leadsMap: Record<string, any> = {};
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabaseClient
            .from("leads")
            .select("id, first_name, last_name, city, province")
            .in("id", leadIds);
          
          (leadsData || []).forEach((lead: any) => {
            leadsMap[lead.id] = lead;
          });
        }

        if (appointmentsData) {
          const formattedAppointments: Appointment[] = appointmentsData.map((apt: any) => {
            const lead = apt.lead_id ? leadsMap[apt.lead_id] : null;
            const name = lead ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : 'Unknown';
            const location = lead ? `${lead.city || ''}, ${lead.province || ''}`.trim() : 'N/A';
            const dateObj = apt.requested_date ? new Date(apt.requested_date) : new Date(apt.created_at);
            const date = dateObj.toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            });
            const time = dateObj.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return {
              id: apt.id,
              name,
              location,
              date,
              time,
              status: apt.status === 'confirmed' || apt.status === 'booked' ? 'confirmed' : 'pending',
            };
          });
          setAppointments(formattedAppointments);
        }

        // Generate meetings chart data from last week's appointments
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: weeklyAppointments } = await supabaseClient
          .from("appointments")
          .select("requested_date, created_at")
          .eq("agent_id", agentId)
          .gte("created_at", oneWeekAgo.toISOString());

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

        // Load appointments for calendar display (current week)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - currentDay + 1);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const { data: weekAppointments } = await supabaseClient
          .from("appointments")
          .select("requested_date, created_at")
          .eq("agent_id", agentId)
          .gte("requested_date", weekStart.toISOString().split("T")[0])
          .lte("requested_date", weekEnd.toISOString().split("T")[0])
          .in("status", ["pending", "confirmed", "booked"]);

        // Count appointments per day of the week
        const appointmentsByDay: Record<number, number> = {};
        (weekAppointments || []).forEach((apt: any) => {
          const date = apt.requested_date ? new Date(apt.requested_date) : new Date(apt.created_at);
          const dayOfMonth = date.getDate();
          appointmentsByDay[dayOfMonth] = (appointmentsByDay[dayOfMonth] || 0) + 1;
        });
        setCalendarAppointments(appointmentsByDay);

        // Load availability settings
        const { data: profileData } = await supabaseClient
          .from("profiles")
          .select("metadata")
          .eq("id", agentId)
          .maybeSingle();

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search appointments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-800"
              />
            </div>
            <Link
              href="/agent/my-appointments"
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Appointment History
            </Link>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="col-span-2 space-y-6">
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
              
              <div className="grid grid-cols-5 gap-4">
                {/* Total Families */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Users size={20} className="text-green-800" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Total Families</div>
                  <div className="text-2xl text-gray-900">{stats.myLeads}</div>
                </div>
                
                {/* Phone Calls */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Phone size={20} className="text-gray-700" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Phone Calls</div>
                  <div className="text-2xl text-gray-900">{stats.myAppointments}</div>
                </div>
                
                {/* Appointments */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Calendar size={20} className="text-green-800" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Appointments</div>
                  <div className="text-2xl text-gray-900">{stats.myAppointments}</div>
                </div>
                
                {/* Unread Mail */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <MailIcon size={20} className="text-gray-700" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Unread Mail</div>
                  <div className="text-2xl text-gray-900">0</div>
                </div>
                
                {/* Add More */}
                <Link
                  href="/agent/appointments"
                  className="bg-white rounded-xl p-4 border border-gray-200 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Plus size={32} className="text-gray-400" />
                </Link>
              </div>
            </div>
            
            {/* My Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg text-gray-900 mb-4">My appointments</h3>
              
              <div className="space-y-2">
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
                      <div className="col-span-3 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          idx === 0 ? 'bg-gray-200 text-gray-700' : 
                          idx === 1 ? 'bg-green-100 text-green-800' : 
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {apt.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                        </div>
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
          
          {/* Right Column */}
          <div className="space-y-6">
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
                    href="/agent/settings"
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
