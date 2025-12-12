"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { Search, Star, MapPin, Calendar, Clock, Stethoscope, Video, SlidersHorizontal, ChevronRight } from "lucide-react";
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

type AvailabilitySlot = {
  date: string;
  spots: number;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchLocation, setSearchLocation] = useState(location);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        // Fetch available appointments (pending, not hidden, not assigned)
        const { data, error } = await supabaseClient
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
          .is("agent_id", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading appointments:", error);
          return;
        }

        // Filter by search query and location if provided
        let filtered = data || [];
        if (searchQuery) {
          filtered = filtered.filter((apt: Appointment) => 
            apt.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.leads?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.leads?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (searchLocation) {
          filtered = filtered.filter((apt: Appointment) => 
            apt.city?.toLowerCase().includes(searchLocation.toLowerCase()) ||
            apt.province?.toLowerCase().includes(searchLocation.toLowerCase())
          );
        }

        setAppointments(filtered as Appointment[]);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [searchQuery, searchLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with new search params
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchLocation) params.set("location", searchLocation);
    window.history.pushState({}, "", `/search?${params.toString()}`);
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
        {/* Filter Bar */}
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap">
            {filters.map((filter, index) => {
              const Icon = filter.icon;
              return (
                <button
                  key={index}
                  className="px-4 py-2 border border-gray-300 rounded-full hover:border-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 text-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                                className={`
                                  px-3 py-2 rounded-lg border text-center text-sm
                                  ${hasSpots 
                                    ? 'bg-green-800 text-white border-green-800 hover:bg-green-900' 
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
