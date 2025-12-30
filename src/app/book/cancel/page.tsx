"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";

type AppointmentData = {
  id: string;
  agent_id: string;
  status: string;
  requested_date: string;
  requested_window: string;
  formatted_date: string;
  time_window_label: string;
  agent: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
    funeral_home: string | null;
    agent_city: string | null;
    agent_province: string | null;
    business_address: string | null;
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
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rebooking">("idle");
  const [message, setMessage] = useState<string>("");
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);
  const [booking, setBooking] = useState(false);

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

  // Fetch availability when reschedule modal opens
  useEffect(() => {
    if (!showRescheduleModal || !appointmentData?.agent_id) return;

    async function fetchAvailability() {
      setLoadingAvailability(true);
      try {
        const startDate = weekStartDate.toISOString().split("T")[0];
        const endDate = new Date(weekStartDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        const location = appointmentData.agent?.agent_city || '';
        const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
        
        const res = await fetch(
          `/api/agents/availability?agentId=${appointmentData.agent_id}&startDate=${startDate}&endDate=${endDate}${locationParam}`
        );
        
        if (res.ok) {
          const data: AvailabilityDay[] = await res.json();
          setAvailabilityDays(data);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoadingAvailability(false);
      }
    }

    fetchAvailability();
  }, [showRescheduleModal, weekStartDate, appointmentData]);

  const handleCancel = async (action: "cancel" | "rebook") => {
    if (!appointmentId) {
      setStatus("error");
      setMessage("Invalid appointment ID");
      return;
    }

    if (action === "rebook") {
      setShowRescheduleModal(true);
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
        body: JSON.stringify({ appointmentId, action }),
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

  const handleReschedule = async () => {
    if (!selectedTimeSlot || !appointmentData?.agent_id || !appointmentId || !appointmentData.lead) return;

    setBooking(true);
    try {
      // First cancel the old appointment
      const cancelResponse = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId, action: "rebook" }),
      });

      if (!cancelResponse.ok) {
        throw new Error("Failed to cancel old appointment");
      }

      // Get lead information from the original appointment
      const lead = appointmentData.lead;
      const firstName = lead.first_name || '';
      const lastName = lead.last_name || '';
      const fullName = lead.full_name || `${firstName} ${lastName}`.trim();
      
      // Split full name if we don't have first/last
      const nameParts = fullName ? fullName.split(' ') : [];
      const finalFirstName = firstName || nameParts[0] || '';
      const finalLastName = lastName || nameParts.slice(1).join(' ') || '';

      // Then book the new appointment
      const bookingResponse = await fetch("/api/agents/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: appointmentData.agent_id,
          startsAt: selectedTimeSlot.startsAt,
          endsAt: selectedTimeSlot.endsAt,
          firstName: finalFirstName,
          lastName: finalLastName,
          email: lead.email || '',
          city: lead.city || appointmentData.agent?.agent_city || '',
          province: lead.province || appointmentData.agent?.agent_province || '',
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to book new appointment");
      }

      setStatus("success");
      setMessage("Your appointment has been successfully rescheduled!");
      setShowRescheduleModal(false);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to reschedule appointment. Please try again.");
      setBooking(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availabilityDays.find(d => d.date === dateStr);
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
                <p className="text-gray-900 font-medium">{appointmentData.time_window_label}</p>
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
                onClick={() => handleCancel("rebook")}
                className="w-full bg-[#0D5C3D] text-white px-6 py-3 rounded hover:bg-[#0A4A30] transition-colors font-medium"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={() => handleCancel("cancel")}
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

      {/* Reschedule Modal */}
      {showRescheduleModal && appointmentData.agent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h2>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedDate(null);
                    setSelectedTimeSlot(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Select a new date and time for your appointment</p>
            </div>

            <div className="p-6">
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    const newDate = new Date(weekStartDate);
                    newDate.setDate(weekStartDate.getDate() - 7);
                    setWeekStartDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-900">
                  {weekStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const newDate = new Date(weekStartDate);
                    newDate.setDate(weekStartDate.getDate() + 7);
                    setWeekStartDate(newDate);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {loadingAvailability ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C3D] mb-4"></div>
                  <p className="text-gray-600">Loading availability...</p>
                </div>
              ) : (
                <>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-3 mb-6">
                    {getWeekDays().map((date, index) => {
                      const dayAvailability = getAvailabilityForDate(date);
                      const dateStr = date.toISOString().split("T")[0];
                      const isSelected = selectedDate === dateStr;
                      const hasSlots = dayAvailability && dayAvailability.slots.length > 0;

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (hasSlots) {
                              setSelectedDate(dateStr);
                              setSelectedTimeSlot(null);
                            }
                          }}
                          disabled={!hasSlots}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            !hasSlots
                              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-[#0D5C3D] border-[#0D5C3D] text-white'
                              : 'bg-white border-gray-200 hover:border-[#0D5C3D]'
                          }`}
                        >
                          <div className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-lg font-semibold mt-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </div>
                          {hasSlots && (
                            <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-[#0D5C3D]'}`}>
                              {dayAvailability.slots.length} {dayAvailability.slots.length === 1 ? 'slot' : 'slots'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      {(() => {
                        const dayAvailability = availabilityDays.find(d => d.date === selectedDate);
                        if (!dayAvailability || dayAvailability.slots.length === 0) {
                          return <p className="text-gray-500">No available times for this date.</p>;
                        }
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            {dayAvailability.slots.map((slot, index) => {
                              const isSelected = selectedTimeSlot?.startsAt === slot.startsAt;
                              return (
                                <button
                                  key={index}
                                  onClick={() => setSelectedTimeSlot(slot)}
                                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                                    isSelected
                                      ? 'bg-[#0D5C3D] border-[#0D5C3D] text-white'
                                      : 'bg-white border-gray-200 hover:border-[#0D5C3D]'
                                  }`}
                                >
                                  {formatTime(slot.startsAt)}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Book Button */}
                  {selectedTimeSlot && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowRescheduleModal(false);
                          setSelectedDate(null);
                          setSelectedTimeSlot(null);
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReschedule}
                        disabled={booking}
                        className="flex-1 bg-[#0D5C3D] text-white px-6 py-3 rounded hover:bg-[#0A4A30] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {booking ? "Rescheduling..." : "Confirm Reschedule"}
                      </button>
                    </div>
                  )}
                </>
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
