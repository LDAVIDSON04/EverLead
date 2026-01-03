"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, X, Star } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { DateTime } from "luxon";

type AppointmentData = {
  id: string;
  agent_id: string;
  status: string;
  requested_date: string;
  requested_window: string;
  formatted_date: string;
  time_display: string;
  exact_time: string | null;
  agent: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    agent_city: string | null;
    agent_province: string | null;
    business_address: string | null;
    business_street: string | null;
    business_city: string | null;
    business_province: string | null;
    business_zip: string | null;
    job_title: string | null;
  } | null;
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    city: string | null;
    province: string | null;
  } | null;
  lead_id: string | null;
};

type AvailabilityDay = {
  date: string;
  slots: Array<{
    startsAt: string;
    endsAt: string;
  }>;
};

function CancelAppointmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<string | null>(null);
  const [selectedAgentInfo, setSelectedAgentInfo] = useState<any>(null);

  // Fetch appointment details on mount
  useEffect(() => {
    if (!appointmentId) {
      setLoadingAppointment(false);
      return;
    }

    async function fetchAppointment() {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          setAppointmentData(data);
        }
      } catch (error) {
        console.error("Error fetching appointment:", error);
      } finally {
        setLoadingAppointment(false);
      }
    }

    fetchAppointment();
  }, [appointmentId]);

  // Fetch availability and agent info when reschedule modal opens
  useEffect(() => {
    if (!showRescheduleModal || !appointmentData?.agent_id) return;

    async function fetchData() {
      if (!appointmentData) return;
      
      setLoadingAvailability(true);
      
      // Fetch agent info
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("full_name, profile_picture_url, job_title, funeral_home, agent_city, agent_province, metadata")
          .eq("id", appointmentData.agent_id)
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
      
      // Fetch availability
      try {
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        // Try to determine location: use lead's city (where they searched from) as proxy for appointment location
        // If no lead city, don't filter by location (shows all locations)
        const location = appointmentData.lead?.city || appointmentData.agent?.agent_city || '';
        const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
        
        const res = await fetch(
          `/api/agents/availability?agentId=${appointmentData.agent_id}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const availabilityData: AvailabilityDay[] = await res.json();
          setAvailabilityDays(availabilityData);
          
          // Set first day with slots as selected
          if (availabilityData.length > 0) {
            const firstDayWithSlots = availabilityData.find(day => day.slots.length > 0) || availabilityData[0];
            setSelectedDayForModal(firstDayWithSlots.date);
          }
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchData();
  }, [showRescheduleModal, appointmentData]);

  const handleCancel = async () => {
    if (!appointmentId) {
      setStatus("error");
      setMessage("Invalid appointment ID");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId, action: "cancel" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to process request");
        return;
      }

      setStatus("success");
      setMessage("Your appointment has been cancelled successfully.");
    } catch (error: any) {
      setStatus("error");
      setMessage("An error occurred. Please try again or contact support.");
      console.error("Error processing request:", error);
    }
  };

  const handleTimeSlotClick = (timeSlot: { startsAt: string; endsAt: string }, date: string) => {
    if (!appointmentData || !appointmentId) return;

    // Navigate to booking page with the selected time slot
    const params = new URLSearchParams({
      startsAt: timeSlot.startsAt,
      endsAt: timeSlot.endsAt,
      date: date,
      rescheduleAppointmentId: appointmentId,
    });
    
    // Use lead's city (where they searched from) as location
    const locationCity = appointmentData.lead?.city || appointmentData.agent?.agent_city || '';
    if (locationCity) {
      params.set("city", locationCity);
    }
    
    const bookingUrl = `/book/step2?agentId=${appointmentData.agent_id}&${params.toString()}`;
    window.location.href = bookingUrl;
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedDayForModal(null);
    setAvailabilityDays([]);
    setSelectedAgentInfo(null);
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This cancellation link is invalid or missing the appointment ID.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#2a2a2a] text-white px-6 py-2 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loadingAppointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Appointment Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find this appointment. It may have already been cancelled.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#2a2a2a] text-white px-6 py-2 rounded hover:bg-[#1a1a1a] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancel Appointment</h1>
        
        {/* Agent Info */}
        {appointmentData.agent && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {appointmentData.agent.profile_picture_url ? (
                <Image
                  src={appointmentData.agent.profile_picture_url}
                  alt={appointmentData.agent.full_name || "Agent"}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0D5C3D] flex items-center justify-center text-white text-2xl font-semibold">
                  {(appointmentData.agent.full_name || "A")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {appointmentData.agent.full_name || "Agent"}
                </h2>
                {appointmentData.agent.funeral_home && (
                  <p className="text-gray-600">{appointmentData.agent.funeral_home}</p>
                )}
                {(appointmentData.agent.agent_city || appointmentData.agent.agent_province) && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {[appointmentData.agent.agent_city, appointmentData.agent.agent_province].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-gray-900 font-medium">{appointmentData.formatted_date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-gray-900 font-medium">{appointmentData.time_display}</p>
              </div>
            </div>
          </div>
        </div>
        
        {status === "idle" && (
          <>
            <p className="text-gray-600 mb-6">
              Would you like to cancel this appointment or reschedule it for another time?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="w-full bg-[#0D5C3D] text-white px-6 py-3 rounded hover:bg-[#0A4A30] transition-colors font-medium"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors font-medium"
              >
                Cancel Appointment
              </button>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors text-center"
              >
                Keep Appointment
              </Link>
            </div>
          </>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Processing your request...</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 text-center mb-6">{message}</p>
            </div>
            <Link
              href="/"
              className="block w-full bg-[#2a2a2a] text-white px-6 py-2 rounded hover:bg-[#1a1a1a] transition-colors text-center"
            >
              Return to Home
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 text-center mb-6">{message}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStatus("idle");
                  setMessage("");
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors text-center"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Reschedule Modal - Same as search page */}
      {showRescheduleModal && appointmentData.agent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeRescheduleModal();
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
                <h2 className="text-2xl font-bold text-black">Reschedule Appointment</h2>
                <button
                  onClick={closeRescheduleModal}
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
                      {appointmentData.agent?.agent_city && (
                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {appointmentData.agent.agent_city}
                            {appointmentData.agent.agent_province && `, ${appointmentData.agent.agent_province}`}
                          </span>
                        </div>
                      )}
                      
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

              {loadingAvailability ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-gray-600">Loading available times...</p>
                </div>
              ) : availabilityDays.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : availabilityDays.filter(day => day.slots.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No time slots available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const normalizedSelectedDate = selectedDayForModal?.trim() || "";
                    const daysWithSlots = availabilityDays.filter(day => day.slots.length > 0);
                    const selectedDay = availabilityDays.find(d => d.date.trim() === normalizedSelectedDate);
                    
                    let daysToShow = [...daysWithSlots];
                    if (selectedDay && selectedDay.slots.length === 0) {
                      daysToShow.unshift(selectedDay);
                    }
                    
                    const uniqueDays = daysToShow.filter((day, index, self) => 
                      index === self.findIndex(d => d.date.trim() === day.date.trim())
                    );
                    
                    return uniqueDays;
                  })()
                    .map((day, dayIdx) => {
                      const [year, month, dayOfMonth] = day.date.split("-").map(Number);
                      
                      if (isNaN(year) || isNaN(month) || isNaN(dayOfMonth)) {
                        return null;
                      }
                      
                      const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
                      const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
                      const monthName = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                      const dayNum = date.getUTCDate();
                      const displayDate = `${dayName}, ${monthName} ${dayNum}`;
                      
                      const normalizedSelectedDate = selectedDayForModal?.trim() || "";
                      const normalizedDayDate = day.date.trim();
                      const isSelected = normalizedSelectedDate === normalizedDayDate;
                      
                      // Get agent's timezone for proper time conversion
                      let agentTimezone = "America/Vancouver"; // Default
                      if (appointmentData.agent?.agent_province) {
                        const province = appointmentData.agent.agent_province.toUpperCase();
                        if (province === "BC" || province === "BRITISH COLUMBIA") {
                          agentTimezone = "America/Vancouver";
                        } else if (province === "AB" || province === "ALBERTA") {
                          agentTimezone = "America/Edmonton";
                        } else if (province === "SK" || province === "SASKATCHEWAN") {
                          agentTimezone = "America/Regina";
                        } else if (province === "MB" || province === "MANITOBA") {
                          agentTimezone = "America/Winnipeg";
                        } else if (province === "ON" || province === "ONTARIO") {
                          agentTimezone = "America/Toronto";
                        } else if (province === "QC" || province === "QUEBEC") {
                          agentTimezone = "America/Montreal";
                        }
                      }
                      
                      const formattedSlots = day.slots.map(slot => {
                        // Convert UTC to agent's local timezone using Luxon
                        const utcDate = DateTime.fromISO(slot.startsAt, { zone: "utc" });
                        const localDate = utcDate.setZone(agentTimezone);
                        
                        const hours = localDate.hour;
                        const minutes = localDate.minute;
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
                      
                      if (!date || !dayName || !monthName) {
                        return null;
                      }
                      
                      const hasSlots = formattedSlots.length > 0;
                      
                      return (
                        <div key={dayIdx} className={`border-b border-gray-200 pb-6 last:border-b-0 ${isSelected ? 'bg-green-50 -mx-6 px-6 pt-4 rounded-lg' : ''}`}>
                          <h4 className="text-base font-semibold text-black mb-3">{displayDate}</h4>
                          {!hasSlots ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No available time slots for this date.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {formattedSlots.map((timeSlot, idx) => {
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleTimeSlotClick(timeSlot, day.date)}
                                    className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all bg-green-100 text-black hover:bg-green-600 hover:text-white border-2 border-green-300 hover:border-green-600 shadow-sm hover:shadow-md"
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

export default function CancelAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a2a2a] mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CancelAppointmentContent />
    </Suspense>
  );
}
