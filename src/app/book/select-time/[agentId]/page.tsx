"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

type AvailabilityDay = {
  date: string;
  slots: {
    time: string;
    startsAt: string;
    endsAt: string;
    available: boolean;
  }[];
};

function SelectTimeContent() {
  const params = useParams();
  const router = useRouter();
  const agentId = (params?.agentId as string) || "";

  const [agentInfo, setAgentInfo] = useState<{
    full_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    job_title: string | null;
    agent_city: string | null;
    agent_province: string | null;
  } | null>(null);

  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreWeeks, setShowMoreWeeks] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Fetch agent info
  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, funeral_home, job_title, agent_city, agent_province")
          .eq("id", agentId)
          .eq("role", "agent")
          .single();

        if (error) {
          console.error("Error loading agent:", error);
        } else if (data) {
          setAgentInfo(data);
        }
      } catch (err) {
        console.error("Error loading agent:", err);
      }
    }
    loadAgent();
  }, [agentId]);

  // Fetch availability
  useEffect(() => {
    async function loadAvailability() {
      if (!agentId) return;
      
      setIsLoading(true);
      try {
        const today = new Date();
        const daysToLoad = showMoreWeeks ? 14 : 7;
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + daysToLoad * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const res = await fetch(
          `/api/agents/availability?agentId=${agentId}&startDate=${startDate}&endDate=${endDate}`
        );
        
        if (res.ok) {
          const data: AvailabilityDay[] = await res.json();
          setAvailability(data);
        }
      } catch (err) {
        console.error("Error loading availability:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAvailability();
  }, [agentId, showMoreWeeks]);

  const handleTimeSlotClick = (day: AvailabilityDay, timeSlot: { time: string; startsAt: string; endsAt: string; available: boolean }) => {
    if (!timeSlot.available) return;
    
    const params = new URLSearchParams({
      startsAt: timeSlot.startsAt,
      endsAt: timeSlot.endsAt,
      date: day.date,
    });
    
    // Navigate directly - force full page navigation
    const bookingUrl = `/book/step1/${agentId}?${params.toString()}`;
    console.log("Time slot clicked, navigating to:", bookingUrl);
    // Use replace to ensure navigation happens immediately
    window.location.replace(bookingUrl);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading && !agentInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black">Select a time</h1>
              {agentInfo && (
                <p className="text-gray-600 text-sm mt-1">
                  {agentInfo.full_name || "Agent"}
                  {agentInfo.funeral_home && ` • ${agentInfo.funeral_home}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agent Card */}
        {agentInfo && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              {agentInfo.profile_picture_url ? (
                <Image
                  src={agentInfo.profile_picture_url}
                  alt={agentInfo.full_name || "Agent"}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-xl">
                    {(agentInfo.full_name || "A")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-black">
                  {agentInfo.full_name || "Agent"}
                </h2>
                {agentInfo.job_title && (
                  <p className="text-gray-600">{agentInfo.job_title}</p>
                )}
                {agentInfo.funeral_home && (
                  <p className="text-gray-600">{agentInfo.funeral_home}</p>
                )}
                {(agentInfo.agent_city || agentInfo.agent_province) && (
                  <p className="text-gray-500 text-sm mt-1">
                    {[agentInfo.agent_city, agentInfo.agent_province].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Availability Calendar */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading availability...</p>
            </div>
          ) : availability.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No availability found.</p>
            </div>
          ) : (
            availability.map((day) => {
              const availableSlots = day.slots.filter((s) => s.available);
              if (availableSlots.length === 0) return null;

              const isSelected = selectedDate === day.date;

              return (
                <div
                  key={day.date}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-black mb-4">
                    {formatDate(day.date)}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {day.slots.map((timeSlot, timeIdx) => {
                      if (!timeSlot.available) return null;

                      return (
                        <button
                          key={timeIdx}
                          type="button"
                          onClick={() => handleTimeSlotClick(day, timeSlot)}
                          className="px-4 py-2 rounded-md text-sm transition-colors bg-navy-100 text-black hover:bg-navy-200 border border-navy-300"
                        >
                          {timeSlot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Show More Button */}
        {!showMoreWeeks && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowMoreWeeks(true)}
              className="px-6 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors"
            >
              Show more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SelectTimePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SelectTimeContent />
    </Suspense>
  );
}
