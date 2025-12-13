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

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchQuery(query);
    setSearchLocation(location);
    setSearchService(service);
  }, [query, location, service]);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        // Build query with filters
        let query = supabaseClient
          .from("appointments")
          .select(`
            id,
            requested_date,
            requested_window,
            status,
            city,
            province,
            service_type,
            price_cents,
            leads (
              first_name,
              last_name,
              city,
              province
            )
          `)
          .eq("status", "pending")
          .eq("is_hidden", false)
          .is("agent_id", null);

        // Apply location filter at database level if provided
        if (searchLocation) {
          const locationLower = searchLocation.toLowerCase();
          query = query.or(`city.ilike.%${locationLower}%,province.ilike.%${locationLower}%`);
        }

        // Apply service filter at database level if provided
        if (searchService) {
          query = query.ilike("service_type", `%${searchService}%`);
        }

        // Apply search query filter at database level if provided
        if (searchQuery) {
          query = query.ilike("service_type", `%${searchQuery}%`);
        }

        const { data, error } = await query
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading appointments:", error);
          return;
        }

        // Filter by search query, location, and service if provided
        let filtered = (data || []) as AppointmentData[];
        
        if (searchQuery) {
          filtered = filtered.filter((apt) => {
            const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
            const queryLower = searchQuery.toLowerCase();
            return (
              apt.service_type?.toLowerCase().includes(queryLower) ||
              lead?.first_name?.toLowerCase().includes(queryLower) ||
              lead?.last_name?.toLowerCase().includes(queryLower) ||
              apt.city?.toLowerCase().includes(queryLower) ||
              apt.province?.toLowerCase().includes(queryLower)
            );
          });
        }
        
        if (searchLocation) {
          const locationLower = searchLocation.toLowerCase();
          filtered = filtered.filter((apt) => {
            const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
            return (
              apt.city?.toLowerCase().includes(locationLower) ||
              apt.province?.toLowerCase().includes(locationLower) ||
              lead?.city?.toLowerCase().includes(locationLower) ||
              lead?.province?.toLowerCase().includes(locationLower)
            );
          });
        }
        
        if (searchService) {
          const serviceLower = searchService.toLowerCase();
          filtered = filtered.filter((apt) => 
            apt.service_type?.toLowerCase().includes(serviceLower)
          );
        }

        // Map to Appointment type, handling array or single object for leads
        const mappedAppointments: Appointment[] = filtered.map((apt) => {
          const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
          return {
            id: apt.id,
            requested_date: apt.requested_date,
            requested_window: apt.requested_window,
            status: apt.status,
            city: apt.city,
            province: apt.province,
            service_type: apt.service_type,
            price_cents: apt.price_cents,
            leads: lead ? {
              first_name: lead.first_name,
              last_name: lead.last_name,
              city: lead.city,
              province: lead.province,
            } : null,
          };
        });

        setAppointments(mappedAppointments);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
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
    
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = date.getDate();
      
      // Random spots for demo (in real app, this would come from actual availability)
      const spots = i === 0 || i === 1 ? 0 : Math.floor(Math.random() * 12);
      
      slots.push({
        date: `${dayName}\n${monthName} ${dayNum}`,
        spots,
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

  const handleDayClick = (appointment: Appointment, slot: AvailabilitySlot, index: number) => {
    if (slot.spots > 0) {
      setSelectedAppointment(appointment);
      setSelectedAppointmentIndex(index);
      setSelectedDate(slot.date);
      setShowMoreAvailability(false);
    }
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

            {/* Specialist Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 ${avatarColors[selectedAppointmentIndex % avatarColors.length]} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-2xl">
                    {selectedAppointment.leads 
                      ? `${selectedAppointment.leads.first_name || ''} ${selectedAppointment.leads.last_name || ''}`.trim()[0]?.toUpperCase() || 'S'
                      : 'S'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-black mb-1 text-lg font-semibold">
                    {selectedAppointment.leads 
                      ? `${selectedAppointment.leads.first_name || ''} ${selectedAppointment.leads.last_name || ''}`.trim() || 'Pre-need Specialist'
                      : 'Pre-need Specialist'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {selectedAppointment.service_type || 'Pre-need Planning Specialist'}
                  </p>
                  
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
                <div className="flex flex-wrap gap-2">
                  {generateTimeSlots(selectedDate).map((time, timeIdx) => {
                    const isSelected = selectedTime === `${selectedDate}-${time}`;
                    return (
                      <button
                        key={timeIdx}
                        onClick={() => setSelectedTime(`${selectedDate}-${time}`)}
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
            <p className="text-gray-600 mb-4">
              No appointments found. Try adjusting your search criteria.
            </p>
            <Link
              href="/"
              className="inline-block bg-green-800 hover:bg-green-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Return to Homepage
            </Link>
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
              
              return (
                <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-6">
                    {/* Specialist Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center`}>
                        <span className="text-white text-2xl">{specialistName[0].toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-2">
                        <h3 className="text-xl text-gray-900">{specialistName}</h3>
                        <p className="text-gray-600 mt-1">{appointment.service_type || 'Pre-need Planning Specialist'}</p>
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
                          <button className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-green-800 hover:bg-green-50 text-sm flex items-center justify-center">
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
