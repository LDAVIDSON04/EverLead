"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

// Types matching our API
type AvailabilitySlot = {
  startsAt: string; // ISO in UTC
  endsAt: string; // ISO in UTC
};

type AvailabilityDay = {
  date: string; // 'YYYY-MM-DD'
  slots: AvailabilitySlot[];
};

export default function BookAgentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = (params?.agentId as string) || "";
  const searchedCity = searchParams.get("city") || "";
  const officeLocationName = searchParams.get("officeLocation") || "";

  // State
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<{
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    job_title: string | null;
    agent_city: string | null;
    agent_province: string | null;
  } | null>(null);

  // Fetch agent info
  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, first_name, last_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();

        if (error) {
          console.error("Error loading agent:", error);
          setError("Agent not found");
        } else if (data) {
          setAgentInfo(data);
        }
      } catch (err) {
        console.error("Error loading agent:", err);
        setError("Failed to load agent information");
      }
    }
    loadAgent();
  }, [agentId]);

  // Fetch availability on mount
  useEffect(() => {
    if (!agentId) return;

    async function loadAvailability() {
      setIsLoadingAvailability(true);
      setError(null);

      try {
        // Get date from URL query params, or use today as default
        const dateParam = searchParams.get("date");
        
        let startDate: string;
        if (dateParam) {
          // Use the selected date as start date (ensure it's not in the past)
          const selectedDateObj = new Date(dateParam + "T00:00:00");
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // If selected date is in the past, use today instead
          if (selectedDateObj < today) {
            startDate = today.toISOString().split("T")[0];
          } else {
            startDate = dateParam;
          }
        } else {
          // Default to today
          startDate = new Date().toISOString().split("T")[0];
        }
        
        // Calculate end date (7 days from start date)
        const startDateObj = new Date(startDate + "T00:00:00");
        const endDate = new Date(
          startDateObj.getTime() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0];

        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load availability");
        }

        const data: AvailabilityDay[] = await res.json();
        setAvailability(data);

        // Set selectedDate to the date from URL params, or first day with slots
        if (dateParam) {
          // Check if the date from URL has slots available
          const dayFromUrl = data.find((day) => day.date === dateParam);
          if (dayFromUrl && dayFromUrl.slots.length > 0) {
            setSelectedDate(dateParam);
          } else {
            // If the selected date has no slots, use first day with slots
            const firstDayWithSlots = data.find((day) => day.slots.length > 0);
            if (firstDayWithSlots) {
              setSelectedDate(firstDayWithSlots.date);
            }
          }
        } else {
          // Default selectedDate to first day with slots
          const firstDayWithSlots = data.find((day) => day.slots.length > 0);
          if (firstDayWithSlots) {
            setSelectedDate(firstDayWithSlots.date);
          }
        }
      } catch (err: any) {
        console.error("Error loading availability:", err);
        setError(err.message || "Failed to load availability");
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [agentId, searchParams]);

  // Reload availability when date range changes
  const handleDateRangeChange = (days: number) => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(
      today.getTime() + days * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];

    async function reloadAvailability() {
      setIsLoadingAvailability(true);
      try {
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (!res.ok) {
          throw new Error("Failed to load availability");
        }

        const data: AvailabilityDay[] = await res.json();
        setAvailability(data);
      } catch (err: any) {
        console.error("Error reloading availability:", err);
        setError(err.message || "Failed to load availability");
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    reloadAvailability();
  };


  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const selectedDay = availability.find((day) => day.date === selectedDate);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <Link
              href="/search"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to search
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Agent Details */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {agentInfo?.profile_picture_url ? (
              <img
                src={agentInfo.profile_picture_url}
                alt={agentInfo.full_name || "Agent"}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl">
                  {agentInfo?.first_name?.[0]?.toUpperCase() || agentInfo?.full_name?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {agentInfo?.full_name || agentInfo?.first_name && agentInfo?.last_name 
                  ? `${agentInfo.first_name} ${agentInfo.last_name}`
                  : "Pre-need Specialist"}
              </h1>
              {agentInfo?.funeral_home && (
                <p className="text-gray-600 text-sm mb-2">{agentInfo.funeral_home}</p>
              )}
              {agentInfo?.agent_city && (
                <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {agentInfo.agent_city}
                    {agentInfo.agent_province && `, ${agentInfo.agent_province}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-green-600 text-green-600" />
                <span className="text-sm text-black">4.9</span>
                <span className="text-sm text-gray-500">· 88 reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingAvailability && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">Loading available times…</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoadingAvailability && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Availability Calendar */}
        {!isLoadingAvailability && !error && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Select a time</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDateRangeChange(7)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  7 days
                </button>
                <button
                  onClick={() => handleDateRangeChange(14)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  14 days
                </button>
                <button
                  onClick={() => handleDateRangeChange(30)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  30 days
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {availability.map((day) => {
                const hasSlots = day.slots.length > 0;
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => hasSlots && setSelectedDate(day.date)}
                    disabled={!hasSlots}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      isSelected
                        ? "bg-green-800 text-white border-green-800"
                        : hasSlots
                        ? "bg-green-50 text-gray-900 border-green-200 hover:bg-green-100"
                        : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-lg font-semibold mt-1">
                      {new Date(day.date).getDate()}
                    </div>
                    <div className="text-xs mt-1">
                      {hasSlots ? `${day.slots.length} slots` : "No slots"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slots for Selected Date */}
            {selectedDay && selectedDay.slots.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  {formatDate(selectedDate!)}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {selectedDay.slots.map((slot, idx) => {
                    const isSelected = selectedSlot?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          isSelected
                            ? "bg-green-800 text-white border-green-800"
                            : "bg-white text-gray-900 border-gray-300 hover:bg-green-50 hover:border-green-800"
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {formatTime(slot.startsAt)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Book Button */}
            {selectedSlot && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (!selectedDate || !selectedSlot) {
                      setError("Please select a date and time");
                      return;
                    }
                    // Navigate to step1 with time slot data
                    const params = new URLSearchParams({
                      agentId,
                      startsAt: selectedSlot.startsAt,
                      endsAt: selectedSlot.endsAt,
                      date: selectedDate,
                      ...(searchedCity ? { city: searchedCity } : {}),
                      ...(officeLocationName ? { officeLocation: officeLocationName } : {}),
                    });
                    router.push(`/book/step1?${params.toString()}`);
                  }}
                  className="w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
