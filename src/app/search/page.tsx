"use client";

// Time slot modal implementation

import { useSearchParams, useRouter } from "next/navigation";
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
    agent_city?: string | null;
    agent_province?: string | null;
    business_address?: string | null;
    business_street?: string | null;
    business_city?: string | null;
    business_province?: string | null;
    business_zip?: string | null;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const service = searchParams.get("service") || "";
  
  // Decode URL-encoded location for display
  const decodedLocation = location ? decodeURIComponent(location.replace(/\+/g, ' ')) : "";
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  // Input values (what user is typing)
  const [inputQuery, setInputQuery] = useState(query);
  const [inputLocation, setInputLocation] = useState(decodedLocation);
  const [inputService, setInputService] = useState(service);
  // Actual search values (what was searched/submitted)
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchLocation, setSearchLocation] = useState(decodedLocation);
  const [searchService, setSearchService] = useState(service);
  const [locationDetected, setLocationDetected] = useState(false); // Track if we've tried to detect location
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentIndex, setSelectedAppointmentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showMoreAvailability, setShowMoreAvailability] = useState(false);
  const [showMoreWeeks, setShowMoreWeeks] = useState(false);
  const [agentAvailability, setAgentAvailability] = useState<Record<string, AvailabilityDay[]>>({});
  const [availabilityDaysToShow, setAvailabilityDaysToShow] = useState<Record<string, number>>({});
  const [calendarDaysToShow, setCalendarDaysToShow] = useState<Record<string, number>>({});
  
  // Time slot modal state
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);
  const [selectedAgentIdForModal, setSelectedAgentIdForModal] = useState<string | null>(null);
  
  const [selectedAgentInfo, setSelectedAgentInfo] = useState<{
    full_name: string | null;
    profile_picture_url: string | null;
    job_title: string | null;
    funeral_home: string | null;
    agent_city: string | null;
    agent_province: string | null;
    business_address: string | null;
    business_street: string | null;
    business_city: string | null;
    business_province: string | null;
    business_zip: string | null;
  } | null>(null);
  const [dayTimeSlots, setDayTimeSlots] = useState<{ time: string; startsAt: string; endsAt: string; available: boolean }[]>([]);
  const [allAvailabilityDays, setAllAvailabilityDays] = useState<AvailabilityDay[]>([]); // Store all days with slots
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Sync state with URL params when they change
  useEffect(() => {
    setSearchQuery(query);
    setInputQuery(query);
    // Always sync location from URL params - this ensures it shows in the search bar and on agent cards
    if (location) {
      const decoded = decodeURIComponent(location.replace(/\+/g, ' '));
      console.log("📍 Syncing location from URL:", decoded);
      setSearchLocation(decoded);
      setInputLocation(decoded);
      setLocationDetected(true); // Mark as detected so we don't auto-detect again
    } else {
      // Clear location if it's removed from URL
      setSearchLocation("");
      setInputLocation("");
    }
    setSearchService(service);
    setInputService(service);
  }, [query, location, service]);

  // Auto-detect location on page load if no location is provided
  useEffect(() => {
    // Only detect if:
    // 1. No location in URL params
    // 2. No location in state
    // 3. We haven't tried to detect yet
    if (!location && !searchLocation && !locationDetected) {
      setLocationDetected(true);
      
      // Call geolocation API to detect family's location from IP
      fetch("/api/geolocation")
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            const decodedLocation = decodeURIComponent(data.location.replace(/\+/g, ' '));
            console.log("📍 Auto-detected location from IP:", decodedLocation);
            
            // Update both input and search state immediately so it shows in search bar and triggers search
            setSearchLocation(decodedLocation);
            setInputLocation(decodedLocation);
            
            // Update URL with location so it triggers search and shows in search bar
            const params = new URLSearchParams();
            params.set("location", decodedLocation);
            if (searchQuery) params.set("q", searchQuery);
            if (searchService) params.set("service", searchService);
            
            // Update URL to include location - this will trigger the URL param sync useEffect
            router.replace(`/search?${params.toString()}`);
          } else {
            console.warn("📍 Could not detect location from IP");
          }
        })
        .catch(err => {
          console.error("Error detecting location:", err);
          // Silently fail - user can still type location manually
        });
    }
  }, [location, searchLocation, locationDetected, searchQuery, searchService, router]);

  useEffect(() => {
    async function loadAgents() {
      setLoading(true);
      try {
        // Build query params for agent search
        const params = new URLSearchParams();
        if (searchLocation) {
          params.set("location", searchLocation);
          console.log("🔍 [SEARCH] Loading agents for location:", searchLocation);
        }
        if (searchService) params.set("service", searchService);
        if (searchQuery) params.set("q", searchQuery);

        console.log("🔍 [SEARCH] Fetching agents with params:", params.toString());
        const res = await fetch(`/api/agents/search?${params.toString()}`);
        
        if (!res.ok) {
          console.error("Error loading agents:", res.statusText);
          return;
        }

        const { agents } = await res.json();
        console.log(`✅ [SEARCH] Found ${agents?.length || 0} agents for location "${searchLocation}"`);

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
          agent: {
            ...agent,
            business_address: agent.business_address, // Include business address
            business_street: agent.business_street,
            business_city: agent.business_city,
            business_province: agent.business_province,
            business_zip: agent.business_zip,
          }, // Store full agent data
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
              `/api/agents/availability?agentId=${apt.agent.id}&startDate=${startDate}&endDate=${endDate}${searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : ''}`
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
    // Update actual search values from input values (this triggers the useEffect to reload agents)
    setSearchQuery(inputQuery);
    setSearchLocation(inputLocation);
    setSearchService(inputService);
    
    // Update URL with new search params
    const params = new URLSearchParams();
    if (inputQuery) params.set("q", inputQuery);
    if (inputLocation) params.set("location", inputLocation);
    if (inputService) params.set("service", inputService);
    router.push(`/search?${params.toString()}`);
  };

  // Generate availability slots for the calendar grid
  const generateAvailability = (appointment: Appointment): AvailabilitySlot[] => {
    const slots: AvailabilitySlot[] = [];
    const today = new Date();
    
    // Get real availability if we have it
    const agentId = appointment.agent?.id;
    const realAvailability = agentId ? agentAvailability[agentId] : null;
    const daysToShow = agentId ? (calendarDaysToShow[agentId] || 8) : 8;
    
    if (realAvailability && realAvailability.length > 0) {
      // Use real availability data from agent's settings
      return realAvailability.slice(0, daysToShow).map((day) => {
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
    for (let i = 0; i < daysToShow; i++) {
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

  const handleMoreButtonClick = async (appointment: Appointment, index: number) => {
    if (!appointment.agent?.id) return;
    
    // Open modal with first available day
    const agentId = appointment.agent.id;
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    
    setSelectedDayForModal(dateStr);
    setSelectedAgentIdForModal(agentId);
    setLoadingTimeSlots(true);
    setShowTimeSlotModal(true);
    
    // Fetch agent info and availability
    const fetchAgentInfo = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (!error && data) {
          const metadata = data.metadata || {};
          setSelectedAgentInfo({
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
    };
    
    const fetchAvailability = async () => {
      try {
        const startDate = dateStr;
        // Fetch 14 days of availability (2 weeks)
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const locationParam = searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : '';
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          
          // Store all availability days
          setAllAvailabilityDays(availabilityData);
          
          if (availabilityData.length > 0) {
            // Find first day with available slots
            const firstDayWithSlots = availabilityData.find(day => day.slots.length > 0) || availabilityData[0];
            setSelectedDayForModal(firstDayWithSlots.date);
            
            // Format slots for the first day
            const formattedSlots = firstDayWithSlots.slots.map(slot => {
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
            
            setDayTimeSlots(formattedSlots);
          } else {
            setDayTimeSlots([]);
          }
        } else {
          setDayTimeSlots([]);
          setAllAvailabilityDays([]);
        }
      } catch (err) {
        console.error("Error loading time slots:", err);
        setDayTimeSlots([]);
        setAllAvailabilityDays([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    
    Promise.all([fetchAgentInfo(), fetchAvailability()]);
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

  const handleDayClick = async (e: React.MouseEvent, appointment: Appointment, slot: AvailabilitySlot, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!slot.spots || slot.spots === 0 || !appointment.agent?.id) {
      return;
    }

    const agentId = appointment.agent.id;
    const dayDate = slot.date.split('\n')[1]; // Extract date from "Wed\nDec 17" format
    
    // Parse the date to get YYYY-MM-DD format
    const today = new Date();
    const currentYear = today.getFullYear();
    const dateMatch = dayDate.match(/(\w+)\s+(\d+)/);
    if (!dateMatch) return;
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = dateMatch[1];
    const dayNum = parseInt(dateMatch[2]);
    const monthIndex = monthNames.indexOf(monthName);
    
    if (monthIndex === -1) return;
    
    const selectedDate = new Date(currentYear, monthIndex, dayNum);
    const dateStr = selectedDate.toISOString().split("T")[0];
    
    // Store today for use in fetchAvailability
    const todayForFetch = today;
    
    // Set modal state
    setSelectedDayForModal(dateStr);
    setSelectedAgentIdForModal(agentId);
    setLoadingTimeSlots(true);
    setShowTimeSlotModal(true);
    
    // Fetch agent info and availability in parallel
    const fetchAgentInfo = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();
        
        if (!error && data) {
          const metadata = data.metadata || {};
          setSelectedAgentInfo({
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
    };
    
    const fetchAvailability = async () => {
      try {
        const startDate = dateStr;
        // Fetch 14 days of availability (2 weeks) to show multiple days in modal
        const endDate = new Date(todayForFetch.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const locationParam = searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : '';
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          
          console.log("📅 [MODAL] Fetched availability data:", {
            totalDays: availabilityData.length,
            daysWithSlots: availabilityData.filter(d => d.slots.length > 0).length,
            selectedDate: dateStr,
            allDays: availabilityData.map(d => ({
              date: d.date,
              slotCount: d.slots.length,
              firstSlot: d.slots[0]?.startsAt || null
            }))
          });
          
          // CRITICAL: Always store all availability days, even if empty
          // This is what the modal checks to determine if slots are available
          setAllAvailabilityDays(availabilityData);
          
          // Find the selected day's data
          const dayData = availabilityData.find(d => d.date === dateStr);
          
          console.log("📅 [MODAL] Selected day data:", {
            dateStr,
            found: !!dayData,
            slotCount: dayData?.slots.length || 0,
            slots: dayData?.slots.slice(0, 3).map(s => s.startsAt) || [] // Show first 3 for debugging
          });
          
          // Set dayTimeSlots for backward compatibility (though modal uses allAvailabilityDays)
          if (dayData && dayData.slots.length > 0) {
            // Format time slots with readable time and available status
            // Convert UTC times back to local time for display (will show in user's browser timezone)
            const formattedSlots = dayData.slots.map(slot => {
              const startDate = new Date(slot.startsAt);
              // Use getHours() instead of getUTCHours() to convert from UTC to local time
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
            
            setDayTimeSlots(formattedSlots);
          } else {
            console.warn("📅 [MODAL] Selected day has no slots:", {
              dateStr,
              dayData: dayData ? "exists but empty slots" : "not found",
              allDays: availabilityData.map(d => ({ date: d.date, slots: d.slots.length }))
            });
            setDayTimeSlots([]);
          }
        } else {
          const errorText = await res.text();
          console.error("❌ [MODAL] Failed to fetch availability:", {
            status: res.status,
            statusText: res.statusText,
            error: errorText
          });
          setAllAvailabilityDays([]);
          setDayTimeSlots([]);
        }
      } catch (err) {
        console.error("Error loading time slots:", err);
        setAllAvailabilityDays([]);
        setDayTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };
    
    // Fetch both in parallel
    Promise.all([fetchAgentInfo(), fetchAvailability()]);
  };
  
  const handleTimeSlotClick = (timeSlot: { time: string; startsAt: string; endsAt: string }) => {
    if (!selectedAgentIdForModal || !selectedDayForModal) return;
    
    const params = new URLSearchParams({
      startsAt: timeSlot.startsAt,
      endsAt: timeSlot.endsAt,
      date: selectedDayForModal,
    });
    
    // Build absolute URL
    const bookingUrl = `${window.location.origin}/book/step1/${selectedAgentIdForModal}?${params.toString()}`;
    console.log("FORCE NAVIGATING to:", bookingUrl);
    
    // Close modal
    closeTimeSlotModal();
    
    // Force immediate navigation - no delays, no React interference
    window.location.assign(bookingUrl);
  };
  
  const closeTimeSlotModal = () => {
    setShowTimeSlotModal(false);
    setSelectedDayForModal(null);
    setSelectedAgentIdForModal(null);
    setSelectedAgentInfo(null);
    setDayTimeSlots([]);
    setAllAvailabilityDays([]);
  };
  
  // Handle date selection in modal - show time slots for selected date
  const handleDateSelectInModal = (date: string) => {
    const selectedDay = allAvailabilityDays.find(day => day.date === date);
    if (selectedDay) {
      setSelectedDayForModal(date);
      const formattedSlots = selectedDay.slots.map(slot => {
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
      setDayTimeSlots(formattedSlots);
    }
  };

  const handleShowMoreWeeks = async (agentId: string) => {
    if (!showMoreWeeks) {
      // Load next 2 weeks (14 days total)
      try {
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const locationParam = searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : '';
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          setAgentAvailability((prev) => ({
            ...prev,
            [agentId]: availabilityData,
          }));
          setAvailabilityDaysToShow((prev) => ({
            ...prev,
            [agentId]: 14,
          }));
          setShowMoreWeeks(true);
        }
      } catch (err) {
        console.error("Error loading more availability:", err);
      }
    } else {
      // Already showing 2 weeks, just toggle the display
      setShowMoreWeeks(false);
      setAvailabilityDaysToShow((prev) => ({
        ...prev,
        [agentId]: 7,
      }));
    }
  };

  const handleBookAgent = (agentId: string) => {
    // Navigate to agent booking page (old flow - keeping for compatibility)
    window.location.href = `/book/agent/${agentId}`;
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setSelectedAppointmentIndex(0);
    setSelectedDate(null);
    setSelectedTime(null);
    setShowMoreAvailability(false);
    setShowMoreWeeks(false);
  };

  // Handle time slot click in old modal - navigate to Step 1 booking page
  const handleTimeSlotClickOld = (agentId: string | undefined, timeSlot: any, dayDate: string) => {
    console.log("handleTimeSlotClick called:", { agentId, timeSlot, dayDate });
    
    if (!agentId) {
      console.error("Missing agentId");
      alert("Error: Agent information is missing. Please try again.");
      return;
    }
    
    if (!timeSlot?.startsAt || !timeSlot?.endsAt) {
      console.error("Missing time slot data:", { startsAt: timeSlot?.startsAt, endsAt: timeSlot?.endsAt });
      alert("Error: Time slot information is missing. Please try again.");
      return;
    }
    
    if (!dayDate) {
      console.error("Missing date");
      alert("Error: Date information is missing. Please try again.");
      return;
    }
    
    try {
      const params = new URLSearchParams({
        startsAt: timeSlot.startsAt,
        endsAt: timeSlot.endsAt,
        date: dayDate,
      });
      // Include the searched city so booking uses the correct location
      if (searchLocation) {
        params.set("city", searchLocation);
      }
      const url = `/book/step2?agentId=${agentId}&${params.toString()}`;
      console.log("Navigating to:", url);
      
      // Force navigation immediately
      window.location.href = url;
    } catch (error) {
      console.error("Error navigating:", error);
      alert("Error navigating to booking page. Please try again.");
    }
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
      {selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop itself, not links, buttons, or forms
            if (e.target === e.currentTarget) {
              const target = e.target as HTMLElement;
              if (target.tagName !== 'A' && !target.closest('a') && 
                  target.tagName !== 'BUTTON' && !target.closest('button') &&
                  target.tagName !== 'FORM' && !target.closest('form')) {
                closeModal();
              }
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-50"
            onClick={(e) => {
              // NEVER stop propagation for links, buttons, or forms - let them handle clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A' || target.closest('a') || 
                  target.tagName === 'BUTTON' || target.closest('button') ||
                  target.tagName === 'FORM' || target.closest('form')) {
                return; // Let link/button/form handle its own click
              }
              e.stopPropagation();
            }}
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
              
              {/* Show days with their time slots */}
              {(() => {
                const agentId = selectedAppointment?.agent?.id;
                const agentAvailabilityData = agentId ? agentAvailability[agentId] : null;
                const daysToShow = agentId ? (availabilityDaysToShow[agentId] || 7) : 7;
                
                if (!agentAvailabilityData || agentAvailabilityData.length === 0) {
                  // Fallback: show placeholder
                  return (
                    <div className="text-gray-500 text-sm">
                      Loading availability...
                    </div>
                  );
                }
                
                // Show days (7 or 14 based on showMoreWeeks) with their time slots
                return agentAvailabilityData.slice(0, daysToShow).map((day, dayIdx) => {
                  const date = new Date(day.date + "T00:00:00");
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                  const dayNum = date.getDate();
                  const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                  
                  // Convert slots to time strings
                  // Use getHours() instead of getUTCHours() to convert from UTC to local time for display
                  const timeSlots = day.slots.map((slot) => {
                    const slotDate = new Date(slot.startsAt);
                    const hours = slotDate.getHours(); // Use getHours() for local time display
                    const minutes = slotDate.getMinutes(); // Use getMinutes() for local time display
                    const ampm = hours >= 12 ? "PM" : "AM";
                    const displayHours = hours % 12 || 12;
                    return {
                      time: `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`,
                      startsAt: slot.startsAt,
                      endsAt: slot.endsAt,
                    };
                  });
                  
                  if (timeSlots.length === 0) return null;
                  
                  return (
                    <div key={dayIdx} className="mb-6">
                      <p className="text-black mb-3 font-medium">{displayDate}</p>
                      <div className="flex flex-wrap gap-2" style={{ position: 'relative', zIndex: 1 }}>
                        {timeSlots.map((timeSlot, timeIdx) => {
                          const timeKey = `${day.date}-${timeSlot.time}`;
                          const isSelected = selectedTime === timeKey;
                          
                          // Build URL
                          const bookingUrl = (() => {
                            if (!agentId || !timeSlot.startsAt || !timeSlot.endsAt || !day.date) {
                              return null;
                            }
                            const params = new URLSearchParams({
                              startsAt: timeSlot.startsAt,
                              endsAt: timeSlot.endsAt,
                              date: day.date,
                            });
                            // Include the searched city so booking uses the correct location
                            if (searchLocation) {
                              params.set("city", searchLocation);
                            }
                            return `/book/step2?agentId=${agentId}&${params.toString()}`;
                          })();
                          
                          if (!bookingUrl) {
                            return (
                              <button
                                key={timeIdx}
                                type="button"
                                disabled
                                className="px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                              >
                                {timeSlot.time}
                              </button>
                            );
                          }
                          
                          return (
                            <form
                              key={timeIdx}
                              action={bookingUrl || '#'}
                              method="get"
                              onSubmit={(e) => {
                                e.stopPropagation();
                                // Close modal before navigation
                                closeModal();
                                // Let form submit naturally - don't prevent default
                              }}
                              style={{ display: 'inline' }}
                            >
                              <button
                                type="submit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Don't close modal here - let form onSubmit handle it
                                }}
                                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-black hover:bg-green-200'
                                }`}
                                style={{
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {timeSlot.time}
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
              
              {/* Show More button for next 2 weeks */}
              {(() => {
                const agentId = selectedAppointment?.agent?.id;
                const agentAvailabilityData = agentId ? agentAvailability[agentId] : null;
                const daysToShow = agentId ? (availabilityDaysToShow[agentId] || 7) : 7;
                
                if (!agentId || !agentAvailabilityData || agentAvailabilityData.length === 0) {
                  return null;
                }
                
                return (
                  <button
                    onClick={() => handleShowMoreWeeks(agentId)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-black hover:bg-gray-50 transition-colors mt-4"
                  >
                    {showMoreWeeks ? "Show less" : "Show more availability"}
                  </button>
                );
              })()}
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
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={inputLocation}
                  onChange={(e) => setInputLocation(e.target.value)}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <input
                  type="text"
                  placeholder="Service type"
                  value={inputService}
                  onChange={(e) => setInputService(e.target.value)}
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
                  setInputLocation("");
                  setInputQuery("");
                  setInputService("");
                  setSearchLocation("");
                  setSearchQuery("");
                  setSearchService("");
                  router.push("/search");
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
                  <div className="flex gap-6" onClick={(e) => {
                    // Only prevent card click if clicking on a link
                    const target = e.target as HTMLElement;
                    if (target.closest('a')) {
                      // Let the link handle its own navigation
                      return;
                    }
                  }}>
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
                        {agent?.id ? (
                          <a
                            href={`/agentportfolio/${agent.id}`}
                            onClick={(e) => {
                              // Don't prevent default - let anchor work naturally
                              e.stopPropagation();
                              const targetUrl = `/agentportfolio/${agent.id}`;
                              console.log("🔗 [NAV] Agent name clicked - navigating to:", targetUrl);
                              console.log("🔗 [NAV] Agent ID:", agent.id);
                              // Let the browser handle navigation via href
                            }}
                            className="text-xl text-gray-900 hover:underline cursor-pointer text-left font-semibold transition-all inline-block"
                            title={`View ${agentName}'s profile`}
                          >
                            {agentName}
                          </a>
                        ) : (
                          <h3 className="text-xl text-gray-900">{agentName}</h3>
                        )}
                        <p className="text-gray-600 mt-1">
                          {agent?.job_title || appointment.service_type || 'Pre-need Planning Specialist'}
                        </p>
                        {agent?.funeral_home && (
                          <p className="text-gray-500 text-sm mt-1">{agent.funeral_home}</p>
                        )}
                      </div>

                      {/* Location - Show searched location (the city the family is searching from) */}
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">
                          {searchLocation ? decodeURIComponent(searchLocation.replace(/\+/g, ' ')) : location ? decodeURIComponent(location.replace(/\+/g, ' ')) : 'Location not specified'}
                        </span>
                      </div>

                      {/* Company Address - Show if available (formatted like Zocdoc) */}
                      {(agent?.business_street || agent?.business_address) && (
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">
                            {agent.business_street && agent.business_city && agent.business_province && agent.business_zip
                              ? `${agent.business_street}, ${agent.business_city}, ${agent.business_province} ${agent.business_zip}`
                              : agent.business_address || `${agent.business_street || ''}${agent.business_city ? `, ${agent.business_city}` : ''}${agent.business_province ? `, ${agent.business_province}` : ''}${agent.business_zip ? ` ${agent.business_zip}` : ''}`.trim()}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900">4.9</span>
                        <span className="text-gray-500">· {Math.floor(Math.random() * 200 + 50)} reviews</span>
                      </div>

                      {/* Availability Calendar */}
                      <div className="mt-4">
                        <div className="grid grid-cols-4 gap-2">
                          {availability.map((slot, slotIndex) => {
                            const hasSpots = slot.spots > 0;
                            return (
                              <button
                                key={slotIndex}
                                type="button"
                                onClick={(e) => {
                                  if (hasSpots && appointment.agent?.id) {
                                    handleDayClick(e, appointment, slot, index);
                                  }
                                }}
                                disabled={!hasSpots}
                                className={`
                                  px-3 py-2 rounded-lg border text-center text-sm transition-colors
                                  ${hasSpots 
                                    ? 'bg-green-800 text-white border-green-800 hover:bg-green-900 cursor-pointer' 
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}
                                `}
                              >
                                <div className="whitespace-pre-line leading-tight">{slot.date}</div>
                                <div className="text-xs mt-1">
                                  {hasSpots ? `${slot.spots}\nappointments` : 'No\nappointments'}
                                </div>
                              </button>
                            );
                          })}
                          <button 
                            onClick={() => handleMoreButtonClick(appointment, index)}
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

      {/* Time Slot Selection Modal */}
      {showTimeSlotModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeTimeSlotModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-50"
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
              {selectedAgentInfo && (
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    {selectedAgentInfo.profile_picture_url ? (
                      <Image
                        src={selectedAgentInfo.profile_picture_url}
                        alt={selectedAgentInfo.full_name || "Agent"}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-green-600"
                        unoptimized
                      />
                    ) : (
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-600">
                        <span className="text-green-700 text-2xl font-semibold">
                          {(selectedAgentInfo.full_name || "A")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-black mb-1">
                        {selectedAgentInfo.full_name || "Agent"}
                      </h3>
                      {selectedAgentInfo.job_title && (
                        <p className="text-gray-700 font-medium text-sm mb-1">{selectedAgentInfo.job_title}</p>
                      )}
                      {selectedAgentInfo.funeral_home && (
                        <p className="text-gray-600 text-sm mb-2">{selectedAgentInfo.funeral_home}</p>
                      )}
                      {/* Location - Show searched location (the city the family is searching from) */}
                      {searchLocation && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {decodeURIComponent(searchLocation.replace(/\+/g, ' '))}
                          </span>
                        </div>
                      )}
                      
                      {/* Company Address - Show if available (formatted like Zocdoc) */}
                      {(selectedAgentInfo?.business_street || selectedAgentInfo?.business_address) && (
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 text-xs">
                            {selectedAgentInfo.business_street && selectedAgentInfo.business_city && selectedAgentInfo.business_province && selectedAgentInfo.business_zip
                              ? `${selectedAgentInfo.business_street}, ${selectedAgentInfo.business_city}, ${selectedAgentInfo.business_province} ${selectedAgentInfo.business_zip}`
                              : selectedAgentInfo.business_address || `${selectedAgentInfo.business_street || ''}${selectedAgentInfo.business_city ? `, ${selectedAgentInfo.business_city}` : ''}${selectedAgentInfo.business_province ? `, ${selectedAgentInfo.business_province}` : ''}${selectedAgentInfo.business_zip ? ` ${selectedAgentInfo.business_zip}` : ''}`.trim()}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">4.9</span>
                        <span className="text-sm text-gray-600">({Math.floor(Math.random() * 200 + 50)} reviews)</span>
                      </div>
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
                  <p className="text-xs text-gray-400 mt-2">Debug: allAvailabilityDays is empty</p>
                </div>
              ) : allAvailabilityDays.filter(day => day.slots.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: {allAvailabilityDays.length} days loaded, but none have slots
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Show all available days with their time slots */}
                  {(() => {
                    const daysWithSlots = allAvailabilityDays.filter(day => day.slots.length > 0);
                    console.log("📅 [MODAL] Rendering days with slots:", {
                      totalDays: allAvailabilityDays.length,
                      daysWithSlots: daysWithSlots.length,
                      days: daysWithSlots.map(d => ({ date: d.date, slotCount: d.slots.length }))
                    });
                    return daysWithSlots;
                  })()
                    .map((day, dayIdx) => {
                      const date = new Date(day.date + "T00:00:00");
                      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
                      const monthName = date.toLocaleDateString("en-US", { month: "long" });
                      const dayNum = date.getDate();
                      const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                      const isSelected = selectedDayForModal === day.date;
                      
                      // Format time slots for this day
                      const formattedSlots = day.slots.map(slot => {
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
                              if (searchLocation) {
                                params.set("city", searchLocation);
                              }
                              const bookingUrl = `${window.location.origin}/book/step2?agentId=${selectedAgentIdForModal}&${params.toString()}`;
                              const timeSlotId = `time-slot-${dayIdx}-${idx}-${timeSlot.startsAt}`;
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  id={timeSlotId}
                                  name={timeSlotId}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    const params = new URLSearchParams({
                                      startsAt: timeSlot.startsAt,
                                      endsAt: timeSlot.endsAt,
                                      date: day.date,
                                    });
                                    if (searchLocation) {
                                      params.set("city", searchLocation);
                                    }
                                    const url = `${window.location.origin}/book/step2?agentId=${selectedAgentIdForModal}&${params.toString()}`;
                                    
                                    console.log("Time slot clicked, FORCING navigation to:", url);
                                    
                                    // Close modal
                                    setShowTimeSlotModal(false);
                                    setSelectedDayForModal(null);
                                    setSelectedAgentIdForModal(null);
                                    setSelectedAgentInfo(null);
                                    setDayTimeSlots([]);
                                    setAllAvailabilityDays([]);
                                    
                                    // IMMEDIATE navigation
                                    window.location.href = url;
                                  }}
                                  className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-green-100 text-black hover:bg-green-600 hover:text-white border-2 border-green-300 hover:border-green-600 shadow-sm hover:shadow-md"
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
