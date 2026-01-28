"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, MapPin, X, Calendar, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { DateTime } from 'luxon';
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
  timezone?: string; // Agent's timezone (e.g., "America/Toronto")
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
  const [nextAvailableCalculated, setNextAvailableCalculated] = useState(false);

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
            // Normalize city name to match metadata format (remove province, commas, etc.)
            const rawCity = loc.city?.trim() || '';
            const locationName = normalizeLocation(rawCity) || rawCity;
            const address = loc.street_address 
              ? `${loc.street_address}, ${loc.city}, ${loc.province}${loc.postal_code ? ` ${loc.postal_code}` : ''}`
              : `${loc.city || ''}, ${loc.province || ''}`;
            
            return {
              id: loc.id,
              name: loc.name || `${loc.city}, ${loc.province}`,
              address: address,
              nextAvailable: 'Loading...', // Will be updated after fetching availability
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
          setNextAvailableCalculated(false); // Reset flag so next available dates will be calculated
          
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
              nextAvailable: 'Loading...', // Will be updated after fetching availability
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
            nextAvailable: 'Loading...', // Will be updated after fetching availability
            locationName: defaultLocationName
          });
        }
        
        const finalLocations = locations.length > 0 ? locations : [{
          id: '1',
          name: agent.funeral_home || 'Main Office',
          address: `${agent.agent_city || ''}, ${agent.agent_province || ''}`,
          nextAvailable: 'Loading...', // Will be updated after fetching availability
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
        setNextAvailableCalculated(false); // Reset flag so next available dates will be calculated
        
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

  // Helper function to format next available date
  const formatNextAvailable = (dateStr: string): string => {
    if (!dateStr) return 'No availability';
    
    try {
      // Parse date string (YYYY-MM-DD) as local date
      const [year, month, dayOfMonth] = dateStr.split("-").map(Number);
      const availableDate = new Date(year, month - 1, dayOfMonth);
      
      // Get today at midnight local time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Set available date to midnight local time for comparison
      const dateOnly = new Date(year, month - 1, dayOfMonth);
      dateOnly.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const diffTime = dateOnly.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        // Past date, should not happen but handle gracefully
        return 'Next available today';
      } else if (diffDays === 0) {
        return 'Next available today';
      } else if (diffDays === 1) {
        return 'Next available tomorrow';
      } else if (diffDays === 2) {
        return 'Next available in 2 days';
      } else if (diffDays <= 7) {
        const monthName = availableDate.toLocaleDateString('en-US', { month: 'short' });
        return `Next available ${monthName} ${dayOfMonth}`;
      } else {
        const monthName = availableDate.toLocaleDateString('en-US', { month: 'short' });
        return `Next available ${monthName} ${dayOfMonth}`;
      }
    } catch (err) {
      console.error('Error formatting next available date:', err, dateStr);
      return 'No availability';
    }
  };

  // Fetch availability for all locations to calculate next available dates
  useEffect(() => {
    if (officeLocations.length === 0) return;
    
    // Check if we need to calculate (has "Loading..." or old hardcoded value)
    const needsUpdate = officeLocations.some(loc => 
      loc.nextAvailable === 'Loading...' || 
      loc.nextAvailable === 'Next available tomorrow' ||
      !loc.nextAvailable ||
      loc.nextAvailable.trim() === ''
    );
    
    if (!needsUpdate && nextAvailableCalculated) return;
    
    const fetchNextAvailableForAllLocations = async () => {
      try {
        const today = new Date();
        // Use local date for startDate to avoid timezone issues
        const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const endDateObj = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // Check 60 days ahead
        const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
        
        console.log('🕐 Fetching next available dates for all locations:', {
          agentId,
          startDate,
          endDate,
          locations: officeLocations.map(loc => ({ name: loc.name, locationName: loc.locationName, currentNextAvailable: loc.nextAvailable }))
        });
        
        // Fetch availability for each location
        const locationPromises = officeLocations.map(async (location) => {
          // Skip if already has a calculated date format (e.g., "Jan 7", "Jan 15") but recalculate placeholders
          const hasCalculatedDate = location.nextAvailable && 
              location.nextAvailable !== 'Loading...' && 
              location.nextAvailable !== 'Next available today' &&
              location.nextAvailable !== 'Next available tomorrow' &&
              location.nextAvailable !== 'Next available in 2 days' &&
              location.nextAvailable !== 'No availability' &&
              !location.nextAvailable.match(/^Next available (today|tomorrow|in \d+ days)$/);
          
          if (hasCalculatedDate) {
            console.log(`⏭️ Skipping ${location.locationName} - already has calculated date: ${location.nextAvailable}`);
            return location;
          }
          
          const locationName = location.locationName?.trim() || '';
          if (!locationName) {
            console.log(`⚠️ Location ${location.id} has no locationName`);
            return {
              ...location,
              nextAvailable: 'No availability'
            };
          }
          
          const url = `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationName ? `&location=${encodeURIComponent(locationName)}` : ''}`;
          
          try {
            console.log(`📡 Fetching availability for ${locationName}:`, url);
            const res = await fetch(url);
            if (res.ok) {
              const availabilityData: any[] = await res.json();
              
              console.log(`✅ Received availability data for ${locationName}:`, {
                totalDays: availabilityData.length,
                daysWithSlots: availabilityData.filter(d => d.slots && d.slots.length > 0).length,
                firstAvailableDate: availabilityData.find(d => d.slots && d.slots.length > 0)?.date
              });
              
              // Get current time in agent's timezone for filtering past slots
              const agentTimezone = availabilityData[0]?.timezone || 'America/Toronto';
              const now = DateTime.now().setZone(agentTimezone);
              const todayDateStr = now.toISODate(); // YYYY-MM-DD format
              
              // Find first day with available slots (filtering out past slots for today)
              const sortedDays = availabilityData
                .filter(day => {
                  if (!day.date || !day.slots || day.slots.length === 0) return false;
                  
                  // For today, filter out past slots
                  if (day.date === todayDateStr) {
                    const futureSlots = day.slots.filter((slot: { startsAt: string; endsAt: string }) => {
                      const slotTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' }).setZone(agentTimezone);
                      return slotTime > now;
                    });
                    return futureSlots.length > 0;
                  }
                  
                  // For future dates, include all days with slots
                  return true;
                })
                .sort((a, b) => a.date.localeCompare(b.date));
              
              const firstAvailableDay = sortedDays[0];
              
              if (firstAvailableDay) {
                const formatted = formatNextAvailable(firstAvailableDay.date);
                console.log(`✅ Calculated next available for ${locationName}: ${firstAvailableDay.date} -> ${formatted}`);
                return {
                  ...location,
                  nextAvailable: formatted
                };
              } else {
                console.log(`❌ No available slots found for ${locationName} in next 60 days`);
                return {
                  ...location,
                  nextAvailable: 'No availability'
                };
              }
            } else {
              console.error(`❌ Failed to fetch availability for ${locationName}:`, res.status, res.statusText);
            }
          } catch (err) {
            console.error(`❌ Error fetching availability for location ${locationName}:`, err);
          }
          
          return {
            ...location,
            nextAvailable: 'No availability'
          };
        });
        
        const updatedLocations = await Promise.all(locationPromises);
        console.log('✅ Updated all location next available dates:', updatedLocations.map(loc => ({ 
          name: loc.name, 
          locationName: loc.locationName, 
          nextAvailable: loc.nextAvailable 
        })));
        setOfficeLocations(updatedLocations);
        setNextAvailableCalculated(true);
      } catch (err) {
        console.error("❌ Error fetching next available dates:", err);
      }
    };
    
    fetchNextAvailableForAllLocations();
  }, [agentId, officeLocations.length]); // Run when locations are loaded or count changes

  // Fetch availability for selected location (for calendar display)
  useEffect(() => {
    if (officeLocations.length === 0) return; // Wait for locations to load
    
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        // Use today to today + 7 days (EXACT same as search page calendar cards)
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
          
          // Use the availability data directly from API (same as search page)
          // The API returns days with slots, we just map them to our format
          const days: DayAvailability[] = availabilityData.map((day) => {
            // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts
            const [year, month, dayOfMonth] = day.date.split("-").map(Number);
            const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
            
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
            const dateNum = date.getUTCDate();
            const monthName = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
            
            // Get current time in agent's timezone for filtering past slots
            const agentTimezone = day.timezone || 'America/Toronto';
            const now = DateTime.now().setZone(agentTimezone);
            const todayDateStr = now.toISODate(); // YYYY-MM-DD format
            const isToday = day.date === todayDateStr;
            
            // Filter slots - exclude past slots for today's date
            const validSlots = day.slots?.filter((slot: any) => {
              if (isToday) {
                const slotTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' }).setZone(agentTimezone);
                return slotTime > now;
              }
              return true; // For future dates, keep all slots
            }) || [];
            
            return {
              dayOfWeek,
              date: dateNum,
              month: monthName,
              fullDate: date,
              appointmentCount: validSlots.length,
              timeSlots: validSlots.map((s: any) => {
                const d = new Date(s.startsAt);
                const hours = d.getHours();
                const minutes = d.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
              }),
              dateStr: day.date
            };
          });
          
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
      
      // Fetch availability starting from today (same as the calendar view)
      // Use the EXACT same date range as the main calendar: today to today + 7 days (EXACT match with search page)
      // CRITICAL: Use the same location that was used for the calendar view
      try {
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // Get the selected location name (same as calendar view)
        // Use the same logic as the main calendar fetch
        const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
        const locationName = selectedLocation?.locationName?.trim() || '';
        const locationParam = locationName ? `&location=${encodeURIComponent(locationName)}` : '';
        
        console.log('📅 BookingPanel time slot modal fetching availability:', {
          agentId,
          startDate,
          endDate,
          selectedLocationId,
          selectedLocation: selectedLocation ? { id: selectedLocation.id, name: selectedLocation.name, locationName: selectedLocation.locationName } : null,
          locationName,
          allOfficeLocations: officeLocations.map(loc => ({ id: loc.id, name: loc.name, locationName: loc.locationName })),
          selectedDayDateStr: selectedDay.dateStr,
          url: `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        });
        
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          console.log('📅 BookingPanel time slot modal received availability:', {
            totalDays: availabilityData.length,
            dates: availabilityData.map(d => d.date),
            daysWithSlots: availabilityData.filter(d => d.slots?.length > 0).map(d => d.date),
            selectedDayDateStr: selectedDay.dateStr,
            locationName
          });
          setAllAvailabilityDays(availabilityData);
        } else {
          console.error('📅 BookingPanel time slot modal fetch failed:', res.status, res.statusText);
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
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] shadow-md'
                      : 'bg-[#1A1A1A] border-gray-200 hover:border-gray-300 hover:shadow-sm'
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
                        ? 'bg-[#1A1A1A] border-[#1A1A1A] shadow-md'
                        : 'bg-[#1A1A1A] border-gray-200 hover:border-gray-300 hover:shadow-sm'
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
            <div className="bg-gradient-to-r from-neutral-50 to-white p-6 border-b border-gray-200 sticky top-0 z-10">
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
                        className="rounded-full object-cover border-2 border-neutral-600"
                        unoptimized
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center border-2 border-neutral-600">
                        <span className="text-neutral-700 text-2xl font-semibold">
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
                <Calendar className="w-5 h-5 text-neutral-600" />
                <h3 className="text-lg font-semibold text-black">Select a date and time</h3>
              </div>

              {loadingTimeSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600 mb-4"></div>
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
                  {/* Show days - prioritize showing the selected day even if it has no slots (EXACT same logic as search page) */}
                  {(() => {
                    const normalizedSelectedDate = selectedDayForModal?.trim() || "";
                    
                    // Always include the selected day, even if it has no slots
                    const selectedDay = allAvailabilityDays.find(d => d.date.trim() === normalizedSelectedDate);
                    const daysWithSlots = allAvailabilityDays.filter(day => day.slots.length > 0);
                    
                    // If selected day has no slots, show it first, then show days with slots
                    // If selected day has slots, it will already be in daysWithSlots
                    let daysToShow = [...daysWithSlots];
                    if (selectedDay && selectedDay.slots.length === 0) {
                      // Insert selected day at the beginning
                      daysToShow.unshift(selectedDay);
                    }
                    
                    // Remove duplicates (in case selected day is already in daysWithSlots)
                    const uniqueDays = daysToShow.filter((day, index, self) => 
                      index === self.findIndex(d => d.date.trim() === day.date.trim())
                    );
                    
                    return uniqueDays;
                  })()
                    .map((day, dayIdx) => {
                      // Parse date string (YYYY-MM-DD) in UTC to avoid timezone shifts (EXACT same as search page)
                      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                      
                      // Validate parsed date components
                      if (isNaN(year) || isNaN(month) || isNaN(dayOfMonth)) {
                        console.error("Invalid date format:", day.date);
                        return null;
                      }
                      
                      // Create date in UTC to get correct day of week
                      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                      
                      // Use UTC methods to get day of week and date components (EXACT same as search page)
                      const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
                      const monthName = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                      const dayNum = date.getUTCDate();
                      const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                      
                      // Debug logging for availability data received
                      if (dayIdx === 0) {
                        console.log(`📅 [BOOKING MODAL] Processing availability day ${dayIdx}:`, {
                          date: day.date,
                          timezone: day.timezone,
                          slotCount: day.slots?.length || 0,
                          firstSlotUTC: day.slots?.[0]?.startsAt,
                          lastSlotUTC: day.slots?.[day.slots?.length - 1]?.startsAt,
                        });
                      }
                      
                      // Format time slots for this day in the agent's timezone
                      const agentTimezone = day.timezone || 'America/Toronto'; // Default fallback
                      
                      // Get current time in agent's timezone for filtering past slots
                      const now = DateTime.now().setZone(agentTimezone);
                      const todayDateStr = now.toISODate(); // YYYY-MM-DD format
                      const isToday = day.date === todayDateStr;
                      
                      // Filter out past time slots for today's date
                      const filteredSlots = day.slots.filter(slot => {
                        if (isToday) {
                          const slotTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' }).setZone(agentTimezone);
                          return slotTime > now;
                        }
                        return true; // For future dates, keep all slots
                      });
                      
                      const formattedSlots = filteredSlots.map((slot, slotIdx) => {
                        // Parse the UTC ISO string and convert to agent's timezone
                        const utcTime = DateTime.fromISO(slot.startsAt, { zone: 'utc' });
                        const agentLocalTime = utcTime.setZone(agentTimezone);
                        
                        // Debug logging for first few slots to diagnose timezone issues
                        if (slotIdx < 3) {
                          console.log(`🕐 [BOOKING MODAL] Slot ${slotIdx} timezone conversion:`, {
                            date: day.date,
                            slotStartsAtUTC: slot.startsAt,
                            agentTimezone,
                            utcHour: utcTime.hour,
                            utcMinute: utcTime.minute,
                            agentLocalHour: agentLocalTime.hour,
                            agentLocalMinute: agentLocalTime.minute,
                            agentLocalTimeISO: agentLocalTime.toISO(),
                            agentLocalTimeFormatted: agentLocalTime.toFormat('yyyy-MM-dd HH:mm:ss ZZZ'),
                          });
                        }
                        
                        const hours = agentLocalTime.hour;
                        const minutes = agentLocalTime.minute;
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
                      
                      // Skip if date parsing failed
                      if (!date || !dayName || !monthName) {
                        return null;
                      }
                      
                      // Show this day even if it has no slots (so user sees the day they clicked)
                      const hasSlots = formattedSlots.length > 0;

                      return (
                        <div key={dayIdx} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <h4 className="text-base font-semibold text-black mb-3">{displayDate}</h4>
                          {!hasSlots ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No available time slots for this date.</p>
                              <p className="text-xs mt-2 text-gray-400">Please select another date.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {formattedSlots.map((timeSlot, idx) => {
                                const params = new URLSearchParams({
                                  startsAt: timeSlot.startsAt,
                                  endsAt: timeSlot.endsAt,
                                  date: day.date,
                                });
                                
                                // Get location from selected location
                                const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
                                const locationName = selectedLocation?.locationName?.trim() || '';
                                if (locationName) {
                                  params.set("city", locationName);
                                }
                                
                                const bookingUrl = `${window.location.origin}/book/step2?agentId=${agentId}&${params.toString()}`;

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.location.href = bookingUrl;
                                    }}
                                    className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-neutral-100 text-black hover:bg-neutral-600 hover:text-white border-2 border-neutral-300 hover:border-neutral-600 shadow-sm hover:shadow-md"
                                  >
                                    {timeSlot.time}
                                  </button>
                                );
                              })}
                            </div>
                          )}
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
