"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

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

  // Fetch agent data to build office locations
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
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
            
            locations.push({
              id: String(index + 1),
              name: `${agent.funeral_home || 'Office'} - ${loc}`,
              address: address || `${loc}`,
              nextAvailable: 'Next available tomorrow'
            });
          });
        } else {
          // Default location
          const address = business_street && business_city && business_province && business_zip
            ? `${business_street}, ${business_city}, ${business_province} ${business_zip}`
            : business_address || `${agent.agent_city || ''}, ${agent.agent_province || ''}`;
          
          locations.push({
            id: '1',
            name: agent.funeral_home || 'Main Office',
            address: address || 'Location not specified',
            nextAvailable: 'Next available tomorrow'
          });
        }
        
        setOfficeLocations(locations.length > 0 ? locations : [{
          id: '1',
          name: agent.funeral_home || 'Main Office',
          address: `${agent.agent_city || ''}, ${agent.agent_province || ''}`,
          nextAvailable: 'Next available tomorrow'
        }]);
      } catch (err) {
        console.error("Error fetching agent data:", err);
      }
    };
    
    fetchAgentData();
  }, [agentId]);

  // Fetch availability
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const startDate = weekStartDate.toISOString().split("T")[0];
        const endDate = new Date(weekStartDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const res = await fetch(`/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}`);
        if (res.ok) {
          const availabilityData: any[] = await res.json();
          
          const days: DayAvailability[] = [];
          for (let i = 0; i < 14; i++) {
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
  }, [agentId, weekStartDate]);

  const selectedLocation = officeLocations.find(loc => loc.id === selectedLocationId) || officeLocations[0];
  
  const getDateRangeText = () => {
    if (weekAvailability.length === 0) return '';
    const firstDay = weekAvailability[0];
    const lastDay = weekAvailability[13];
    return `${firstDay.dayOfWeek}, ${firstDay.month} ${firstDay.date} - ${lastDay.dayOfWeek}, ${lastDay.month} ${lastDay.date}`;
  };
  
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() - 14);
    setWeekStartDate(newDate);
    setSelectedDayIndex(null);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() + 14);
    setWeekStartDate(newDate);
    setSelectedDayIndex(null);
  };
  
  const handleDayClick = (index: number) => {
    if (weekAvailability[index]?.appointmentCount > 0) {
      setSelectedDayIndex(index);
      const selectedDay = weekAvailability[index];
      // Navigate to booking page
      router.push(`/book/step2?agentId=${agentId}&date=${selectedDay.dateStr}`);
    }
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
            {/* First Week - 7 days */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekAvailability.slice(0, 7).map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDayClick(index)}
                  disabled={day.appointmentCount === 0}
                  className={`rounded-lg text-center px-3 py-1.5 transition-all border-2 flex flex-col justify-center items-center w-full ${
                    day.appointmentCount === 0
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : selectedDayIndex === index
                      ? 'bg-[#2d7a4a] border-[#2d7a4a] shadow-md'
                      : 'bg-[#2d7a4a] border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  style={{ aspectRatio: '2 / 1', minHeight: 'auto' }}
                >
                  <div className={`text-xs font-medium ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    {day.dayOfWeek}
                  </div>
                  <div className={`text-xs ${
                    day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                  }`}>
                    {day.month} {day.date}
                  </div>
                  <div className={`text-lg font-medium ${
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
            
            {/* Second Week - 7 days */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekAvailability.slice(7, 14).map((day, index) => {
                const actualIndex = index + 7;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => handleDayClick(actualIndex)}
                    disabled={day.appointmentCount === 0}
                    className={`rounded-lg text-center px-3 py-1.5 transition-all border-2 flex flex-col justify-center items-center w-full ${
                      day.appointmentCount === 0
                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        : selectedDayIndex === actualIndex
                        ? 'bg-[#2d7a4a] border-[#2d7a4a] shadow-md'
                        : 'bg-[#2d7a4a] border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={{ aspectRatio: '2 / 1', minHeight: 'auto' }}
                  >
                    <div className={`text-xs font-medium mb-0.5 ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {day.dayOfWeek}
                    </div>
                    <div className={`text-xs mb-1 ${
                      day.appointmentCount === 0 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {day.month} {day.date}
                    </div>
                    <div className={`text-xl font-medium mb-0.5 ${
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
    </div>
  );
}
