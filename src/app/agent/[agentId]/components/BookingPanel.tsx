"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, MapPin, X, Calendar, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  locationName: string; // The actual location name used in the API (e.g., "Kelowna", "Penticton")
}

interface AvailabilityDay {
  date: string;
  slots: Array<{
    startsAt: string;
    endsAt: string;
  }>;
}

interface BookingPanelProps {
  agentId: string;
  initialLocation?: string; // Optional: location from search (for modal usage)
}

// Normalize location name (remove "Office" suffix, province, etc.)
const normalizeLocation = (loc: string | undefined): string | undefined => {
  if (!loc) return undefined;
  let normalized = loc.split(',').map(s => s.trim())[0];
  normalized = normalized.replace(/\s+office$/i, '').trim();
  return normalized;
};

export function BookingPanel({ agentId, initialLocation }: BookingPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Get search location from URL parameters or prop (prop takes precedence for modal usage)
  const searchLocationParam = initialLocation || searchParams?.get('location') || null;
  const normalizedSearchLocation = searchLocationParam ? normalizeLocation(searchLocationParam) : null;

  // Fetch agent data to build office locations
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // First try to load from office_locations table (has addresses per location)
        const { data: officeLocationsData, error: officeError } = await supabaseClient
          .from('office_locations')
          .select('*')
          .eq('agent_id', agentId)
          .order('city', { ascending: true });

        if (!officeError && officeLocationsData && officeLocationsData.length > 0) {
          // Use office_locations table data - each location has its own address
          const locationsList: OfficeLocation[] = officeLocationsData.map((loc: any) => {
            const locationName = loc.city?.trim() || '';
            const address = loc.street_address 
              ? `${loc.street_address}, ${loc.city}, ${loc.province}${loc.postal_code ? ` ${loc.postal_code}` : ''}`
              : `${loc.city || ''}, ${loc.province || ''}`;
            
            return {
              id: loc.id,
              name: loc.name || `${loc.city}, ${loc.province}`,
              address: address,
              nextAvailable: 'Next available tomorrow',
              locationName: locationName
            };
          });
          
          // Reorder locations: if searchLocation matches a location, put it first
          let finalLocations = locationsList;
          if (normalizedSearchLocation && finalLocations.length > 1) {
            const matchingIndex = finalLocations.findIndex(loc => {
              const normalizedLocName = normalizeLocation(loc.locationName);
              return normalizedLocName?.toLowerCase() === normalizedSearchLocation.toLowerCase();
            });
            
            if (matchingIndex > 0) {
              const matchingLocation = finalLocations[matchingIndex];
              finalLocations = [...finalLocations];
              finalLocations.splice(matchingIndex, 1);
              finalLocations.unshift(matchingLocation);
              // Keep original IDs from database (don't change them)
            }
          }
          
          setOfficeLocations(finalLocations);
          
          // Set selected location
          if (normalizedSearchLocation && finalLocations.length > 0) {
            const matchingLocation = finalLocations.find(loc => {
              const normalizedLocName = normalizeLocation(loc.locationName);
              return normalizedLocName?.toLowerCase() === normalizedSearchLocation.toLowerCase();
            });
            if (matchingLocation) {
              setSelectedLocationId(matchingLocation.id);
            } else {
              setSelectedLocationId(finalLocations[0].id);
            }
          } else {
            setSelectedLocationId(finalLocations[0]?.id || '1');
          }
          return;
        }

        // Fallback: Use agent profile metadata (single address for all locations)
        const { data: agent, error } = await supabaseClient
          .from("profiles")
          .select("id, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (error || !agent) {
          console.error("Error fetching agent data:", error);
          return;
        }
        
        const metadata = agent.metadata || {};
        const availabilityLocations = (metadata as any)?.availability?.locations || [];
        const business_street = (metadata as any)?.business_street;
        const business_city = (metadata as any)?.business_city;
        const business_province = (metadata as any)?.business_province;
        const business_zip = (metadata as any)?.business_zip;
        const business_address = (metadata as any)?.business_address;
        
        const locations: OfficeLocation[] = [];
        
        // Build locations from agent's availability settings
        if (availabilityLocations.length > 0) {
          availabilityLocations.forEach((loc: string, index: number) => {
            const address = business_street && business_city && business_province && business_zip
              ? `${business_street}, ${business_city}, ${business_province} ${business_zip}`
              : business_address || `${business_city || agent.agent_city || ''}, ${business_province || agent.agent_province || ''}`;
            
            // Store the location name exactly as it appears in metadata (trimmed)
            const locationName = loc.trim();
            
            locations.push({
              id: String(index + 1),
              name: `${agent.funeral_home || 'Office'} - ${locationName}`,
              address: address || `${locationName}`,
              nextAvailable: 'Next available tomorrow',
              locationName: locationName
            });
          });
        } else {
          // Default location - use agent's city as location name
          const address = business_street && business_city && business_province && business_zip
            ? `${business_street}, ${business_city}, ${business_province} ${business_zip}`
            : business_address || `${agent.agent_city || ''}, ${agent.agent_province || ''}`;
          const defaultLocationName = (agent.agent_city || '').trim();
          
          locations.push({
            id: '1',
            name: agent.funeral_home || 'Main Office',
            address: address || 'Location not specified',
            nextAvailable: 'Next available tomorrow',
            locationName: defaultLocationName
          });
        }
        
        const finalLocations = locations.length > 0 ? locations : [{
          id: '1',
          name: agent.funeral_home || 'Main Office',
          address: `${agent.agent_city || ''}, ${agent.agent_province || ''}`,
          nextAvailable: 'Next available tomorrow',
          locationName: (agent.agent_city || '').trim()
        }];
        
        // Reorder locations: if searchLocation matches a location, put it first
        if (normalizedSearchLocation && finalLocations.length > 1) {
          const matchingIndex = finalLocations.findIndex(loc => {
            const normalizedLocName = normalizeLocation(loc.locationName);
            return normalizedLocName?.toLowerCase() === normalizedSearchLocation.toLowerCase();
          });
          
          if (matchingIndex > 0) {
            // Move matching location to the beginning
            const matchingLocation = finalLocations[matchingIndex];
            finalLocations.splice(matchingIndex, 1);
            finalLocations.unshift(matchingLocation);
            // Update IDs to maintain sequential order
            finalLocations.forEach((loc, idx) => {
              loc.id = String(idx + 1);
            });
          }
        }
        
        setOfficeLocations(finalLocations);
        
        // Set selected location: if searchLocation matches, select it; otherwise default to first
        if (normalizedSearchLocation && finalLocations.length > 0) {
          const matchingLocation = finalLocations.find(loc => {
            const normalizedLocName = normalizeLocation(loc.locationName);
            return normalizedLocName?.toLowerCase() === normalizedSearchLocation.toLowerCase();
          });
          
          if (matchingLocation) {
            setSelectedLocationId(matchingLocation.id);
            console.log('🎯 BookingPanel: Selected location from search:', {
              searchLocation: searchLocationParam,
              normalizedSearchLocation,
              selectedLocationId: matchingLocation.id,
              locationName: matchingLocation.locationName
            });
          } else {
            setSelectedLocationId(finalLocations[0].id);
          }
        } else {
          setSelectedLocationId(finalLocations[0]?.id || '1');
        }
      } catch (err) {
        console.error("Error fetching agent data:", err);
      }
    };
    
    fetchAgentData();
  }, [agentId, normalizedSearchLocation, searchLocationParam]);

  // Fetch availability
  useEffect(() => {
    if (officeLocations.length === 0) return; // Wait for locations to load
    
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Use today to today + 7 days (same as search page)
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // Get the selected location name
        const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
        const locationName = selectedLocation?.locationName?.trim() || '';
        
        // Build API URL with location parameter
        const url = `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationName ? `&location=${encodeURIComponent(locationName)}` : ''}`;
        
        console.log('📅 BookingPanel fetching availability:', {
          agentId,
          selectedLocationId,
          locationName,
          url,
          officeLocations: officeLocations.map(loc => ({ id: loc.id, name: loc.name, locationName: loc.locationName })),
          selectedLocation: selectedLocation
        });
        
        const res = await fetch(url);
        if (res.ok) {
          const availabilityData: any[] = await res.json();
          
          console.log('📅 BookingPanel received availability data:', {
            agentId,
            locationName,
            totalDaysReturned: availabilityData.length,
            dates: availabilityData.map(d => d.date),
            daysWithSlots: availabilityData.filter(d => d.slots?.length > 0).length
          });
          
          // Create a map of date -> availability data for quick lookup
          const availabilityMap = new Map<string, any>();
          availabilityData.forEach(day => {
            availabilityMap.set(day.date, day);
          });
          
          const days: DayAvailability[] = [];
          // Show 7 days starting from today (same as search page)
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            // Create date in UTC to avoid timezone issues
            const date = new Date(today);
            date.setUTCDate(today.getUTCDate() + i);
            date.setUTCHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split("T")[0];
            
            const dayData = availabilityMap.get(dateStr);
            
            // Only add day if it exists in availabilityData (for daily-only) OR if it's in our range (for recurring)
            // Since the API returns all days with availability (daily or recurring), we should include all returned days
            // For days not in the response, they have no availability (either not set for daily, or disabled for recurring)
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
        } else {
          console.error('📅 BookingPanel availability fetch failed:', res.status, res.statusText);
          setWeekAvailability([]);
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [agentId, selectedLocationId, officeLocations]);

  const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
  
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
        
        // Get the selected location name
        const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
        const locationName = selectedLocation?.locationName?.trim() || '';
        const locationParam = locationName ? `&location=${encodeURIComponent(locationName)}` : '';
        
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
                  {allAvailabilityDays
                    .filter(day => day.slots.length > 0)
                    .map((day) => {
                      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

                      return (
                        <div key={day.date} className="">
                          <div className="mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">{dayName}, {formattedDate}</h4>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {day.slots.map((slot, idx) => {
                              const slotDate = new Date(slot.startsAt);
                              const hours = slotDate.getHours();
                              const minutes = slotDate.getMinutes();
                              const ampm = hours >= 12 ? 'PM' : 'AM';
                              const displayHours = hours % 12 || 12;
                              const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    // Navigate to booking page
                                    const params = new URLSearchParams();
                                    params.set('agentId', agentId);
                                    params.set('date', day.date);
                                    params.set('time', slot.startsAt);
                                    const bookingUrl = `/book/step2?${params.toString()}`;
                                    window.location.href = bookingUrl;
                                  }}
                                  className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-green-100 text-black hover:bg-green-600 hover:text-white border-2 border-green-300 hover:border-green-600 shadow-sm hover:shadow-md"
                                >
                                  {timeStr}
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
