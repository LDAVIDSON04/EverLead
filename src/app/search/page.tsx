"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { Search, Star, MapPin, Calendar, Clock, Stethoscope, Video, SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  city: string | null;
  province: string | null;
  service_type: string | null;
  price_cents: number | null;
  leads: {
    first_name: string | null;
    last_name: string | null;
    city: string | null;
    province: string | null;
  } | null;
  agent?: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    job_title: string | null;
  } | null;
};

type AppointmentData = {
  id: any;
  requested_date: any;
  requested_window: any;
  status: any;
  city: any;
  province: any;
  service_type: any;
  price_cents: any;
  leads: {
    first_name: any;
    last_name: any;
    city: any;
    province: any;
  } | null | Array<{
    first_name: any;
    last_name: any;
    city: any;
    province: any;
  }>;
};

type AvailabilitySlot = {
  date: string;
  spots: number;
};

type AvailabilityDay = {
  date: string;
  slots: { startsAt: string; endsAt: string }[];
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const service = searchParams.get("service") || "";
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchLocation, setSearchLocation] = useState(location);
  const [searchService, setSearchService] = useState(service);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showMoreAvailability, setShowMoreAvailability] = useState(false);
  const [agentAvailability, setAgentAvailability] = useState<Record<string, AvailabilityDay[]>>({});

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchQuery(query);
    setSearchLocation(location);
    setSearchService(service);
  }, [query, location, service]);

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        // Build query params for agent search
        const params = new URLSearchParams();
        if (searchLocation) params.set("location", searchLocation);
        if (searchService) params.set("service", searchService);
        if (searchQuery) params.set("q", searchQuery);

        const res = await fetch(`/api/agents/search?${params.toString()}`);
        
        if (!res.ok) {
          console.error("Error loading agents:", res.statusText);
          return;
        }

        const { agents } = await res.json();

        // Map agents to appointment-like format for compatibility with existing UI
        const mappedAppointments: Appointment[] = (agents || []).map((agent: any) => ({
          id: agent.id,
          requested_date: new Date().toISOString().split("T")[0], // Placeholder
          requested_window: "flexible",
          status: "pending",
          city: agent.agent_city,
          province: agent.agent_province,
          service_type: agent.specialty || agent.job_title || "Pre-need Planning",
          price_cents: null,
          leads: {
            first_name: agent.first_name,
            last_name: agent.last_name,
            city: agent.agent_city,
            province: agent.agent_province,
          },
          agent: agent, // Store full agent data
        }));

        setAppointments(mappedAppointments);

        // Load availability for each agent to show accurate availability counts
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const availabilityPromises = mappedAppointments.map(async (apt) => {
          if (!apt.agent?.id) return null;
          try {
            const res = await fetch(
              `/api/agents/availability?agentId=${apt.agent.id}&startDate=${startDate}&endDate=${endDate}`
            );
            if (res.ok) {
              const data: AvailabilityDay[] = await res.json();
              return { agentId: apt.agent.id, availability: data };
            }
          } catch (err) {
            console.error(`Error loading availability for agent ${apt.agent.id}:`, err);
          }
          return null;
        });

        const availabilityResults = await Promise.all(availabilityPromises);
        const availabilityMap: Record<string, AvailabilityDay[]> = {};
        availabilityResults.forEach((result) => {
          if (result) {
            availabilityMap[result.agentId] = result.availability;
          }
        });
        setAgentAvailability(availabilityMap);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, [searchQuery, searchLocation, searchService]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with new search params and reload
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchLocation) params.set("location", searchLocation);
    if (searchService) params.set("service", searchService);
    window.history.pushState({}, "", `/search?${params.toString()}`);
    // Trigger reload by updating state
    setSearchQuery(searchQuery);
    setSearchLocation(searchLocation);
    setSearchService(searchService);
  };

  // Generate availability slots for the next 8 days
  const generateAvailability = (appointment: Appointment): AvailabilitySlot[] => {
    const slots: AvailabilitySlot[] = [];
    const today = new Date();
    
    // Get real availability if we have it
    const agentId = appointment.agent?.id;
    const realAvailability = agentId ? agentAvailability[agentId] : null;
    
    if (realAvailability && realAvailability.length > 0) {
      // Use real availability data from agent's settings
      return realAvailability.slice(0, 8).map((day) => {
        const date = new Date(day.date + "T00:00:00");
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = date.getDate();
        
        return {
          date: `${dayName}\n${monthName} ${dayNum}`,
          spots: day.slots.length,
        };
      });
    }
    
    // Fallback: generate placeholder slots if availability not loaded yet
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = date.getDate();
      
      // Show 0 spots until real data loads
      slots.push({
        date: `${dayName}\n${monthName} ${dayNum}`,
        spots: 0,
      });
    }
    
    return slots;
  };

  // Generate time slots for a selected date
  const generateTimeSlots = (dateString: string): string[] => {
    // Generate time slots (9 AM to 5 PM, every hour)
    const times = [];
    for (let hour = 9; hour <= 17; hour++) {
      const time = hour <= 12 
        ? `${hour === 12 ? 12 : hour}:00 ${hour < 12 ? 'AM' : 'PM'}`
        : `${hour - 12}:00 PM`;
      times.push(time);
    }
    
    // Randomly remove some times to simulate availability (keep 60-80% of slots)
    return times.filter(() => Math.random() > 0.25);
  };

  const handleDayClick = async (appointment: Appointment, slot: AvailabilitySlot, index: number) => {
    if (slot.spots > 0 && appointment.agent?.id) {
      setSelectedAppointment(appointment);
      setSelectedAppointmentIndex(index);
      setSelectedDate(slot.date);
      setShowMoreAvailability(false);
      
      // Load real availability for this agent and date
      try {
        const agentId = appointment.agent.id;
        // Parse the date from the slot (format: "Mon\nDec 16")
        const dateMatch = slot.date.match(/(\w+)\s+(\d+)/);
        if (dateMatch) {
          const dayNum = parseInt(dateMatch[2]);
          const today = new Date();
          const targetDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
          // If the day number is less than today's day, it's next month
          if (dayNum < today.getDate()) {
            targetDate.setMonth(today.getMonth() + 1);
          }
          const dateStr = targetDate.toISOString().split("T")[0];
          const endDateStr = dateStr; // Same day
          
          const res = await fetch(
            `/api/agents/availability?agentId=${agentId}&startDate=${dateStr}&endDate=${endDateStr}`
          );
          
          if (res.ok) {
            const availabilityData: AvailabilityDay[] = await res.json();
            const dayData = availabilityData.find((day) => day.date === dateStr);
            if (dayData) {
              // Store the availability data for this agent
              setAgentAvailability((prev) => ({
                ...prev,
                [agentId]: availabilityData,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error loading availability:", err);
      }
    }
  };

  const handleBookAgent = (agentId: string) => {
    // Navigate to agent booking page
    window.location.href = `/book/agent/${agentId}`;
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setSelectedAppointmentIndex(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowMoreAvailability(false);
  };

  const filters = [
    { icon: Calendar, label: "I'm flexible" },
    { icon: Clock, label: "Time of day" },
    { icon: Stethoscope, label: "Service type" },
    { icon: MapPin, label: "Distance" },
    { icon: Video, label: "In-person/video" },
    { icon: SlidersHorizontal, label: "More filters" },
  ];

  const avatarColors = [
    'bg-green-700',
    'bg-green-800',
    'bg-green-900',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Appointment Booking Modal */}
      {selectedAppointment && selectedDate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-black text-xl font-semibold">Book an appointment</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Agent Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                {selectedAppointment.agent?.profile_picture_url ? (
                  <img
                    src={selectedAppointment.agent.profile_picture_url}
                    alt={selectedAppointment.agent.full_name || "Agent"}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-16 h-16 ${avatarColors[selectedAppointmentIndex % avatarColors.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-2xl">
                      {selectedAppointment.agent?.full_name?.[0]?.toUpperCase() ||
                       selectedAppointment.leads?.first_name?.[0]?.toUpperCase() ||
                       'A'}
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-black mb-1 text-lg font-semibold">
                    {selectedAppointment.agent?.full_name ||
                     (selectedAppointment.leads 
                       ? `${selectedAppointment.leads.first_name || ''} ${selectedAppointment.leads.last_name || ''}`.trim() || 'Pre-need Specialist'
                       : 'Pre-need Specialist')}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {selectedAppointment.agent?.job_title ||
                     selectedAppointment.service_type || 
                     'Pre-need Planning Specialist'}
                  </p>
                  {selectedAppointment.agent?.funeral_home && (
                    <p className="text-gray-500 text-xs mb-2">{selectedAppointment.agent.funeral_home}</p>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-green-600 text-green-600" />
                    <span className="text-sm text-black">4.9</span>
                    <span className="text-sm text-gray-500">· {Math.floor(Math.random() * 200 + 50)} reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Appointments */}
            <div className="p-6">
              <h3 className="text-black mb-4 font-semibold">Available appointments</h3>
              
              {/* Selected Date */}
              <div className="mb-6">
                <p className="text-black mb-3 font-medium">{selectedDate.replace('\n', ', ')}</p>
                {(() => {
                  // Get real availability slots if available
                  const agentId = selectedAppointment?.agent?.id;
                  let timeSlots: string[] = [];
                  
                  if (agentId && selectedDate) {
                    // Try to parse the date from selectedDate (format: "Mon\nDec 16")
                    const dateMatch = selectedDate.match(/(\w+)\s+(\d+)/);
                    if (dateMatch) {
                      const dayNum = parseInt(dateMatch[2]);
                      const today = new Date();
                      const targetDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
                      if (dayNum < today.getDate()) {
                        targetDate.setMonth(today.getMonth() + 1);
                      }
                      const dateStr = targetDate.toISOString().split("T")[0];
                      // Get availability for this agent
                      const agentAvailabilityData = agentAvailability[agentId];
                      if (agentAvailabilityData) {
                        const dayData = agentAvailabilityData.find((day) => day.date === dateStr);
                        if (dayData && dayData.slots.length > 0) {
                          // Convert real slots to time strings
                          timeSlots = dayData.slots.map((slot) => {
                            const date = new Date(slot.startsAt);
                            const hours = date.getUTCHours();
                            const minutes = date.getUTCMinutes();
                            const ampm = hours >= 12 ? "PM" : "AM";
                            const displayHours = hours % 12 || 12;
                            return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
                          });
                        }
                      }
                    }
                  }
                  
                  // Fallback to generated slots if no real data
                  if (timeSlots.length === 0) {
                    timeSlots = generateTimeSlots(selectedDate);
                  }
                  
                  return (
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((time, timeIdx) => {
                        const isSelected = selectedTime === `${selectedDate}-${time}`;
                        return (
                          <button
                            key={timeIdx}
                            onClick={() => {
                              setSelectedTime(`${selectedDate}-${time}`);
                              // Navigate to booking page when time is selected
                              const agentId = selectedAppointment?.agent?.id;
                              if (agentId) {
                                setTimeout(() => {
                                  window.location.href = `/book/agent/${agentId}`;
                                }, 300);
                              }
                            }}
                            className={`px-4 py-2 rounded-md text-sm transition-colors ${
                              isSelected
                                ? 'bg-green-600 text-white'
                                : 'bg-green-100 text-black hover:bg-green-200'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* More Availability */}
              {!showMoreAvailability ? (
                <button 
                  onClick={() => setShowMoreAvailability(true)}
                  className="text-black underline hover:no-underline text-sm"
                >
                  More availability
                </button>
              ) : (
                <>
                  {generateAvailability(selectedAppointment).slice(1).map((slot, idx) => {
                    if (slot.date === selectedDate) return null;
                    const times = generateTimeSlots(slot.date);
                    if (times.length === 0) return null;
                    
                    return (
                      <div key={idx} className="mb-6">
                        <p className="text-black mb-3 font-medium">{slot.date.replace('\n', ', ')}</p>
                        <div className="flex flex-wrap gap-2">
                          {times.map((time, timeIdx) => {
                            const isSelected = selectedTime === `${slot.date}-${time}`;
                            return (
                              <button
                                key={timeIdx}
                                onClick={() => setSelectedTime(`${slot.date}-${time}`)}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-black hover:bg-green-200'
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  <button className="w-full py-3 px-4 border border-gray-300 rounded-md text-black hover:bg-gray-50 transition-colors mt-4">
                    Show more availability
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">Soradin</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Service or specialist"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <input
                  type="text"
                  placeholder="Service type"
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <button 
                  type="submit"
                  className="bg-green-800 text-white px-6 py-2 rounded-lg hover:bg-green-900 transition-colors flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900">
            {loading ? "Loading..." : `${appointments.length} ${appointments.length === 1 ? 'appointment' : 'appointments'} available`}
          </h2>
          <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Appointment Cards */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-2 text-lg font-medium">
              No agents found
            </p>
            <p className="text-gray-500 mb-6 text-sm">
              {searchLocation 
                ? `We couldn't find any available agents in "${searchLocation}". Try searching for a different location or removing the location filter.`
                : "No agents are currently available for booking. Agents need to set up their availability in their settings to appear here."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSearchLocation("");
                  setSearchQuery("");
                  setSearchService("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
              <Link
                href="/"
                className="inline-block bg-green-800 hover:bg-green-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment, index) => {
              const availability = generateAvailability(appointment);
              const specialistName = appointment.leads 
                ? `${appointment.leads.first_name || ''} ${appointment.leads.last_name || ''}`.trim() || 'Pre-need Specialist'
                : 'Pre-need Specialist';
              const location = appointment.city && appointment.province
                ? `${appointment.city}, ${appointment.province}`
                : appointment.city || appointment.province || 'Location not specified';
              
              const agent = appointment.agent;
              const agentName = agent 
                ? `${agent.full_name || ''}`.trim() || `${appointment.leads?.first_name || ''} ${appointment.leads?.last_name || ''}`.trim()
                : specialistName;
              const agentId = agent?.id || appointment.id;

              return (
                <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-6">
                    {/* Agent Avatar */}
                    <div className="flex-shrink-0">
                      {agent?.profile_picture_url ? (
                        <img
                          src={agent.profile_picture_url}
                          alt={agentName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-16 h-16 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center`}>
                          <span className="text-white text-2xl">{agentName[0]?.toUpperCase() || 'A'}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="text-xl text-gray-900">{agentName}</h3>
                        <p className="text-gray-600 mt-1">
                          {agent?.job_title || appointment.service_type || 'Pre-need Planning Specialist'}
                        </p>
                        {agent?.funeral_home && (
                          <p className="text-gray-500 text-sm mt-1">{agent.funeral_home}</p>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-green-800 text-green-800" />
                        <span className="text-gray-900">4.9</span>
                        <span className="text-gray-500">· {Math.floor(Math.random() * 200 + 50)} reviews</span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{location}</span>
                      </div>

                      {/* Availability Calendar */}
                      <div className="mt-4">
                        <div className="grid grid-cols-4 gap-2">
                          {availability.map((slot, slotIndex) => {
                            const hasSpots = slot.spots > 0;
                            return (
                              <button
                                key={slotIndex}
                                onClick={() => hasSpots && handleDayClick(appointment, slot, index)}
                                className={`
                                  px-3 py-2 rounded-lg border text-center text-sm transition-colors
                                  ${hasSpots 
                                    ? 'bg-green-800 text-white border-green-800 hover:bg-green-900 cursor-pointer' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}
                                `}
                                disabled={!hasSpots}
                              >
                                <div className="whitespace-pre-line leading-tight">{slot.date}</div>
                                <div className="text-xs mt-1">
                                  {hasSpots ? `${slot.spots}\nappointments` : 'No\nappointments'}
                                </div>
                              </button>
                            );
                          })}
                          <button 
                            onClick={() => handleBookAgent(agentId)}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-green-800 hover:bg-green-50 text-sm flex items-center justify-center"
                          >
                            More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
