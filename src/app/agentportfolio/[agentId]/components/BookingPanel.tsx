"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, MapPin, X, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import Image from 'next/image';

interface DayAvailability {
  dayOfWeek: string;
  date: number;
  month: string;
  fullDate: Date;
  appointmentCount: number;
  timeSlots: string[];
  dateStr: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  nextAvailable: string;
  city?: string;
}

interface AvailabilityDay {
  date: string;
  slots: Array<{
    startsAt: string;
    endsAt: string;
  }>;
}

interface TimeSlot {
  time: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

interface BookingPanelProps {
  agentId: string;
}

export function BookingPanel({ agentId }: BookingPanelProps) {
  const router = useRouter();
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('1');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [weekAvailability, setWeekAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  
  // Time slot modal state
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);
  const [allAvailabilityDays, setAllAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [agentInfo, setAgentInfo] = useState<any>(null);

  // Helper function to fetch next available date for a location
  const fetchNextAvailableDate = async (city: string): Promise<string> => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 60 days ahead
      
      const res = await fetch(`/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}&location=${encodeURIComponent(city)}`);
      if (!res.ok) {
        return 'Availability not set';
      }
      
      const availabilityData: AvailabilityDay[] = await res.json();
      const todayStr = startDate;
      
      // Find the first day with available slots
      for (const day of availabilityData) {
        if (day.slots && day.slots.length > 0) {
          const dayDate = new Date(day.date + 'T00:00:00');
          const todayDate = new Date(todayStr + 'T00:00:00');
          const diffDays = Math.floor((dayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            return 'Available today';
          } else if (diffDays === 1) {
            return 'Next available tomorrow';
          } else if (diffDays === 2) {
            return 'Next available in 2 days';
          } else if (diffDays <= 7) {
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
            return `Next available ${dayName}`;
          } else {
            const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = dayDate.getDate();
            return `Next available ${monthName} ${dayNum}`;
          }
        }
      }
      
      return 'No availability';
    } catch (err) {
      console.error('Error fetching next available date:', err);
      return 'Availability not set';
    }
  };

  // Fetch office locations from office_locations table
  useEffect(() => {
    const fetchOfficeLocations = async () => {
      try {
        // First try to load from office_locations table
        const { data: locations, error } = await supabaseClient
          .from('office_locations')
          .select('*')
          .eq('agent_id', agentId)
          .order('city', { ascending: true }); // Sort alphabetically by city

        if (!error && locations && locations.length > 0) {
          // Fetch next available date for each location
          const officeLocationsList: OfficeLocation[] = await Promise.all(
            locations.map(async (loc: any) => {
              const nextAvailable = await fetchNextAvailableDate(loc.city);
              return {
                id: loc.id,
                name: loc.name || `${loc.city}, ${loc.province}`,
                address: loc.street_address 
                  ? `${loc.street_address}, ${loc.city}, ${loc.province}${loc.postal_code ? ` ${loc.postal_code}` : ''}`
                  : `${loc.city}, ${loc.province}`,
                nextAvailable,
                city: loc.city, // Store city for matching with availability
              };
            })
          );
          
          setOfficeLocations(officeLocationsList);
          if (officeLocationsList.length > 0) {
            setSelectedLocationId(officeLocationsList[0].id);
          }
          return;
        }

        // Fallback: Use agent profile metadata
        const { data: agent, error: agentError } = await supabaseClient
          .from("profiles")
          .select("id, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (agentError || !agent) {
          console.error("Error fetching agent data:", agentError);
          return;
        }
        
        const metadata = agent.metadata || {};
        const availabilityLocations = (metadata as any)?.availability?.locations || [];
        const business_street = (metadata as any)?.business_street;
        const business_city = (metadata as any)?.business_city;
        const business_province = (metadata as any)?.business_province;
        const business_zip = (metadata as any)?.business_zip;
        const business_address = (metadata as any)?.business_address;
        
        const locationsList: OfficeLocation[] = [];
        
        // Build locations from agent's availability settings
        if (availabilityLocations.length > 0) {
          const locationsWithAvailability = await Promise.all(
            availabilityLocations.map(async (loc: string, index: number) => {
              const address = business_street && business_city && business_province && business_zip
                ? `${business_street}, ${business_city}, ${business_province} ${business_zip}`
                : business_address || `${business_city || agent.agent_city || ''}, ${business_province || agent.agent_province || ''}`;
              
              const nextAvailable = await fetchNextAvailableDate(loc);
              
              return {
                id: String(index + 1),
                name: `${agent.funeral_home || 'Office'} - ${loc}`,
                address: address || `${loc}`,
                nextAvailable,
                city: loc, // Store city for matching
              };
            })
          );
          
          locationsList.push(...locationsWithAvailability);
        } else {
          // Default location
          const address = business_street && business_city && business_province && business_zip
            ? `${business_street}, ${business_city}, ${business_province} ${business_zip}`
            : business_address || `${agent.agent_city || ''}, ${agent.agent_province || ''}`;
          
          const city = agent.agent_city || '';
          const nextAvailable = city ? await fetchNextAvailableDate(city) : 'Availability not set';
          
          locationsList.push({
            id: '1',
            name: agent.funeral_home || 'Main Office',
            address: address || 'Location not specified',
            nextAvailable,
            city,
          });
        }
        
        if (locationsList.length === 0) {
          const city = agent.agent_city || '';
          const nextAvailable = city ? await fetchNextAvailableDate(city) : 'Availability not set';
          locationsList.push({
            id: '1',
            name: agent.funeral_home || 'Main Office',
            address: `${agent.agent_city || ''}, ${agent.agent_province || ''}`,
            nextAvailable,
            city,
          });
        }
        
        setOfficeLocations(locationsList);
      } catch (err) {
        console.error("Error fetching office locations:", err);
      }
    };
    
    fetchOfficeLocations();
  }, [agentId]);

  // Fetch availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const startDate = weekStartDate.toISOString().split("T")[0];
        const endDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // CRITICAL: Extract city from selected location and pass it to API
        const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
        let locationParam = '';
        if (selectedLocation) {
          // Use the city property if available, otherwise extract from name
          const cityName = selectedLocation.city || selectedLocation.name.split('-').pop()?.trim() || selectedLocation.name.trim();
          locationParam = `&location=${encodeURIComponent(cityName)}`;
        }
        
        const res = await fetch(`/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`);
        if (res.ok) {
          const availabilityData: any[] = await res.json();
          
          const days: DayAvailability[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];
            
            const dayData = availabilityData.find(d => d.date === dateStr);
            const appointmentCount = dayData?.slots?.length || 0;
            
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateNum = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            
            days.push({
              dayOfWeek,
              date: dateNum,
              month,
              fullDate: date,
              appointmentCount,
              timeSlots: dayData?.slots?.map((s: any) => {
                const d = new Date(s.startsAt);
                const hours = d.getHours();
                const minutes = d.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
              }) || [],
              dateStr
            });
          }
          
          setWeekAvailability(days);
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [agentId, weekStartDate, selectedLocationId, officeLocations]);

  const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
  
  const getDateRangeText = () => {
    if (weekAvailability.length === 0) return '';
    const firstDay = weekAvailability[0];
    const lastDay = weekAvailability[6];
    return `${firstDay.dayOfWeek}, ${firstDay.month} ${firstDay.date} - ${lastDay.dayOfWeek}, ${lastDay.month} ${lastDay.date}`;
  };
  
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(newDate);
    setSelectedDayIndex(null);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() + 7);
    setWeekStartDate(newDate);
    setSelectedDayIndex(null);
  };
  
  const handleDayClick = async (index: number) => {
    if (weekAvailability[index]?.appointmentCount > 0) {
      setSelectedDayIndex(index);
      const selectedDay = weekAvailability[index];
      
      // Open time slot modal instead of navigating
      setSelectedDayForModal(selectedDay.dateStr);
      setLoadingTimeSlots(true);
      setShowTimeSlotModal(true);
      
      // Fetch agent info
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (!error && data) {
          const metadata = data.metadata || {};
          setAgentInfo({
            ...data,
            business_address: (metadata as any)?.business_address || null,
            business_street: (metadata as any)?.business_street || null,
            business_city: (metadata as any)?.business_city || null,
            business_province: (metadata as any)?.business_province || null,
            business_zip: (metadata as any)?.business_zip || null,
          });
        }
      } catch (err) {
        console.error("Error loading agent info:", err);
      }
      
      // Fetch availability for 14 days starting from selected day
      try {
        const startDate = selectedDay.dateStr;
        const endDate = new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // CRITICAL: Extract location name from selected location and pass it to API
        const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
        let locationParam = '';
        if (selectedLocation) {
          // Extract city name from location name (format: "Office - City" or just "City")
          const locationName = selectedLocation.name;
          const cityMatch = locationName.match(/- (.+)$/);
          const cityName = cityMatch ? cityMatch[1].trim() : locationName.trim();
          locationParam = `&location=${encodeURIComponent(cityName)}`;
        }
        
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          setAllAvailabilityDays(availabilityData);
        } else {
          setAllAvailabilityDays([]);
        }
      } catch (err) {
        console.error("Error loading time slots:", err);
        setAllAvailabilityDays([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    }
  };
  
  const closeTimeSlotModal = () => {
    setShowTimeSlotModal(false);
    setSelectedDayForModal(null);
    setAllAvailabilityDays([]);
    setAgentInfo(null);
  };

  if (officeLocations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4d2e] mb-4"></div>
          <p className="text-gray-600">Loading booking options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24">
      <div className="p-10">
        <h2 className="text-3xl mb-3">Book an appointment</h2>
        <p className="text-gray-600 mb-10 text-lg">
          Select a date and time to schedule your appointment
        </p>
        
        {/* Office Location Selector */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Pick location
          </label>
          <div className="relative">
            <button
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className="w-full text-left px-5 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a4d2e] focus:border-[#1a4d2e] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <MapPin className="w-5 h-5 text-[#1a4d2e] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900">{selectedLocation?.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{selectedLocation?.address}</div>
                    <div className="text-sm text-[#1a4d2e] font-medium mt-2">{selectedLocation?.nextAvailable}</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 ml-3 flex-shrink-0 transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {isLocationDropdownOpen && officeLocations.length > 1 && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsLocationDropdownOpen(false)}
                />
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">Select an office location</div>
                  </div>
                  {officeLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocationId(loc.id);
                        setIsLocationDropdownOpen(false);
                      }}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${loc.id === selectedLocationId ? 'text-[#1a4d2e]' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold text-gray-900">{loc.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{loc.address}</div>
                            <div className="text-sm text-[#1a4d2e] font-medium mt-2">{loc.nextAvailable}</div>
                          </div>
                        </div>
                        {loc.id === selectedLocationId && (
                          <Check className="w-6 h-6 text-[#1a4d2e] ml-3 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Date Range Display */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-7 h-7 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900 text-lg">
            {getDateRangeText()}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-7 h-7 text-gray-600" />
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a4d2e] mb-4"></div>
            <p className="text-gray-600">Loading availability...</p>
          </div>
        ) : (
          <>
            {/* Top Row - 3 days */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {weekAvailability.slice(0, 3).map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDayClick(index)}
                  disabled={day.appointmentCount === 0}
                  className={`rounded-lg text-center px-4 py-2 transition-all border-2 flex flex-col justify-center items-center w-full ${
                    day.appointmentCount === 0
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : selectedDayIndex === index
                      ? 'bg-[#2d7a4a] border-[#2d7a4a] shadow-md'
                      : 'bg-[#2d7a4a] border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  style={{ aspectRatio: '3 / 1' }}
                >
                  <div className={`text-sm font-medium ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    {day.dayOfWeek}
                  </div>
                  <div className={`text-xs ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    {day.month} {day.date}
                  </div>
                  <div className={`text-2xl font-medium ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    {day.appointmentCount === 0 ? 'No' : day.appointmentCount}
                  </div>
                  <div className={`text-xs ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    appts
                  </div>
                </button>
              ))}
            </div>
            
            {/* Bottom Row - 4 days */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {weekAvailability.slice(3, 7).map((day, index) => {
                const actualIndex = index + 3;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => handleDayClick(actualIndex)}
                    disabled={day.appointmentCount === 0}
                    className={`rounded-lg text-center px-4 py-2 transition-all border-2 flex flex-col justify-center items-center w-full ${
                      day.appointmentCount === 0
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        : selectedDayIndex === actualIndex
                        ? 'bg-[#2d7a4a] border-[#2d7a4a] shadow-md'
                        : 'bg-[#2d7a4a] border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={{ aspectRatio: '3 / 1' }}
                  >
                    <div className={`text-sm font-medium ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {day.dayOfWeek}
                    </div>
                    <div className={`text-xs ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {day.month} {day.date}
                    </div>
                    <div className={`text-2xl font-medium ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {day.appointmentCount === 0 ? 'No' : day.appointmentCount}
                    </div>
                    <div className={`text-xs ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      appts
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* View More Availability Link */}
            <div>
              <button 
                onClick={goToNextWeek}
                className="text-sm text-gray-700 hover:text-gray-900 hover:underline font-medium"
              >
                View more availability
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Time Slot Selection Modal */}
      {showTimeSlotModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeTimeSlotModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Agent Info */}
            <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Book an appointment</h2>
                <button
                  onClick={closeTimeSlotModal}
                  className="text-gray-500 hover:text-black transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Agent Profile Card */}
              {agentInfo && (
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    {agentInfo.profile_picture_url ? (
                      <Image
                        src={agentInfo.profile_picture_url}
                        alt={agentInfo.full_name || "Agent"}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-green-600"
                        unoptimized
                      />
                    ) : (
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-600">
                        <span className="text-green-700 text-2xl font-semibold">
                          {(agentInfo.full_name || "A")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-1">
                        {agentInfo.full_name || "Agent"}
                      </h3>
                      {agentInfo.job_title && (
                        <p className="text-gray-700 font-medium text-sm mb-1">{agentInfo.job_title}</p>
                      )}
                      {agentInfo.funeral_home && (
                        <p className="text-gray-600 text-sm mb-2">{agentInfo.funeral_home}</p>
                      )}
                      {agentInfo.agent_city && agentInfo.agent_province && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {agentInfo.agent_city}, {agentInfo.agent_province}
                          </span>
                        </div>
                      )}
                      {(agentInfo.business_street || agentInfo.business_address) && (
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">
                            {agentInfo.business_street && agentInfo.business_city && agentInfo.business_province && agentInfo.business_zip
                              ? `${agentInfo.business_street}, ${agentInfo.business_city}, ${agentInfo.business_province} ${agentInfo.business_zip}`
                              : agentInfo.business_address || `${agentInfo.business_street || ''}${agentInfo.business_city ? `, ${agentInfo.business_city}` : ''}${agentInfo.business_province ? `, ${agentInfo.business_province}` : ''}${agentInfo.business_zip ? ` ${agentInfo.business_zip}` : ''}`.trim()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-black">Select a date and time</h3>
              </div>

              {loadingTimeSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-gray-600">Loading available times...</p>
                </div>
              ) : allAvailabilityDays.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : allAvailabilityDays.filter(day => day.slots.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show all available days with their time slots */}
                  {allAvailabilityDays
                    .filter(day => day.slots.length > 0)
                    .map((day, dayIdx) => {
                      // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts
                      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                      const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
                      const monthName = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                      const dayNum = date.getUTCDate();
                      const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                      
                      // Format time slots for this day
                      const formattedSlots: TimeSlot[] = day.slots.map(slot => {
                        const startDate = new Date(slot.startsAt);
                        const hours = startDate.getHours();
                        const minutes = startDate.getMinutes();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
                        
                        return {
                          time: timeStr,
                          startsAt: slot.startsAt,
                          endsAt: slot.endsAt,
                          available: true
                        };
                      });
                      
                      return (
                        <div key={dayIdx} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h4 className="text-base font-semibold text-black mb-3">{displayDate}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {formattedSlots.map((timeSlot, idx) => {
                              const params = new URLSearchParams({
                                startsAt: timeSlot.startsAt,
                                endsAt: timeSlot.endsAt,
                                date: day.date,
                              });
                              // Add office location to URL if available
                              const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
                              if (selectedLocation) {
                                const locationName = selectedLocation.name || selectedLocation.address || '';
                                if (locationName) {
                                  params.set('officeLocation', locationName);
                                }
                                if (selectedLocation.city) {
                                  params.set('city', selectedLocation.city);
                                }
                              }
                              const bookingUrl = `${window.location.origin}/book/step2?agentId=${agentId}&${params.toString()}`;
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Close modal
                                    closeTimeSlotModal();
                                    
                                    // Navigate to booking page
                                    window.location.href = bookingUrl;
                                  }}
                                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                                >
                                  {timeSlot.time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
