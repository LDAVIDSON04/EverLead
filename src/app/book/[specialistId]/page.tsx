"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

// Types matching our API
type AvailabilitySlot = {
  startsAt: string; // ISO in UTC
  endsAt: string; // ISO in UTC
};

type AvailabilityDay = {
  date: string; // 'YYYY-MM-DD' in specialist timezone
  slots: AvailabilitySlot[];
};

export default function BookSpecialistPage() {
  const params = useParams();
  const specialistId = (params?.specialistId as string) || "";

  // State
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [specialistInfo, setSpecialistInfo] = useState<{
    display_name: string | null;
    bio: string | null;
    location_city: string | null;
    location_region: string | null;
  } | null>(null);

  // Fetch specialist info
  useEffect(() => {
    async function loadSpecialist() {
      if (!specialistId) return;
      
      try {
        const { data, error } = await supabaseClient
          .from("specialists")
          .select("display_name, bio, location_city, location_region")
          .eq("id", specialistId)
          .single();

        if (error) {
          console.error("Error loading specialist:", error);
        } else if (data) {
          setSpecialistInfo(data);
        }
      } catch (err) {
        console.error("Error loading specialist:", err);
      }
    }
    loadSpecialist();
  }, [specialistId]);

  // Fetch availability on mount
  useEffect(() => {
    if (!specialistId) return;

    async function loadAvailability() {
      setIsLoadingAvailability(true);
      setError(null);

      try {
        // Calculate date range (today to 7 days from now)
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(
          today.getTime() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0];

        const res = await fetch(
          `/api/availability?specialistId=${specialistId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load availability");
        }

        const data: AvailabilityDay[] = await res.json();
        setAvailability(data);

        // Default selectedDate to first day with slots
        const firstDayWithSlots = data.find((day) => day.slots.length > 0);
        if (firstDayWithSlots) {
          setSelectedDate(firstDayWithSlots.date);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load availability");
      } finally {
        setIsLoadingAvailability(false);
      }
    }

    loadAvailability();
  }, [specialistId]);

  // Handler for date selection
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccessMessage(null);
    setError(null);
    setShowModal(true);
  };

  // Handler for slot selection and booking
  const handleBookSlot = async (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setError(null);
    setIsBooking(true);

    try {
      // TODO: Replace with actual familyId from authenticated user
      // For now, using a placeholder - you'll need to wire this to your auth system
      const familyId = "00000000-0000-0000-0000-000000000000"; // PLACEHOLDER - replace with real familyId

      // TODO: Replace with actual appointmentTypeId
      // You may want to fetch available appointment types for this specialist
      // or allow user to select one. For now, using a placeholder.
      const appointmentTypeId = "00000000-0000-0000-0000-000000000000"; // PLACEHOLDER - replace with real appointmentTypeId

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId,
          familyId,
          appointmentTypeId,
          startsAt: slot.startsAt, // already UTC ISO
        }),
      });

      if (res.status === 409) {
        const errorData = await res.json();
        setError(
          errorData.error ||
            "That time slot is no longer available, please pick another one."
        );
        // Re-fetch availability
        const today = new Date();
        const startDate = today.toISOString().split("T")[0];
        const endDate = new Date(
          today.getTime() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0];

        const availabilityRes = await fetch(
          `/api/availability?specialistId=${specialistId}&startDate=${startDate}&endDate=${endDate}`
        );
        if (availabilityRes.ok) {
          const newAvailability = await availabilityRes.json();
          setAvailability(newAvailability);
        }
        setIsBooking(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to book appointment");
      }

      const appointment = await res.json();

      // Success
      setSuccessMessage(
        `Your appointment is confirmed for ${formatAppointmentTime(
          slot.startsAt
        )}.`
      );
      setSelectedSlot(null);

      // Optionally close modal after a delay or keep it open with success message
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsBooking(false);
    }
  };

  // Format time for display
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // Format full appointment time for success message
  const formatAppointmentTime = (isoString: string): string => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // Format date for display (weekday + day of month)
  const formatDateTile = (dateStr: string): { weekday: string; day: string } => {
    const date = new Date(dateStr + "T00:00:00");
    return {
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      day: date.getDate().toString(),
    };
  };

  // Get selected day's slots
  const selectedDay = availability.find((d) => d.date === selectedDate);
  const slots = selectedDay?.slots ?? [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-semibold text-gray-900">
                Soradin
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Specialist Details */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">
                {specialistInfo?.display_name?.[0]?.toUpperCase() || "S"}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {specialistInfo?.display_name || "Pre-need Specialist"}
              </h1>
              {specialistInfo?.location_city && (
                <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {specialistInfo.location_city}
                    {specialistInfo.location_region &&
                      `, ${specialistInfo.location_region}`}
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
          {specialistInfo?.bio && (
            <p className="text-gray-600 text-sm">{specialistInfo.bio}</p>
          )}
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

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Date Tiles */}
        {!isLoadingAvailability && availability.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select a date
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availability.map((day) => {
                const { weekday, day: dayNum } = formatDateTile(day.date);
                const hasSlots = day.slots.length > 0;
                const isSelected = day.date === selectedDate;

                return (
                  <button
                    key={day.date}
                    onClick={() => hasSlots && handleSelectDate(day.date)}
                    disabled={!hasSlots}
                    className={`
                      flex flex-col items-center justify-center px-4 py-3 rounded-lg border text-center min-w-[80px] transition-colors
                      ${
                        isSelected
                          ? "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50"
                          : hasSlots
                          ? "border-gray-300 bg-white hover:border-emerald-600 hover:bg-emerald-50"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <span className="text-xs font-medium text-gray-600">
                      {weekday}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        isSelected
                          ? "text-emerald-600"
                          : hasSlots
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasSlots && (
                      <span className="text-xs text-gray-500 mt-1">
                        {day.slots.length} {day.slots.length === 1 ? "slot" : "slots"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showModal && selectedDate && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (!isBooking) {
                setShowModal(false);
                setSelectedSlot(null);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-black text-xl font-semibold">
                  Book an appointment
                </h2>
                <button
                  onClick={() => {
                    if (!isBooking) {
                      setShowModal(false);
                      setSelectedSlot(null);
                    }
                  }}
                  disabled={isBooking}
                  className="text-gray-500 hover:text-black transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Specialist Info in Modal */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl">
                      {specialistInfo?.display_name?.[0]?.toUpperCase() || "S"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-black mb-1 text-lg font-semibold">
                      {specialistInfo?.display_name || "Pre-need Specialist"}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Pre-need Planning Specialist
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-green-600 text-green-600" />
                      <span className="text-sm text-black">4.9</span>
                      <span className="text-sm text-gray-500">
                        · 88 reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="p-6">
                <h3 className="text-black mb-4 font-semibold">
                  Available appointments for{" "}
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </h3>

                {slots.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    No available time slots for this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {slots.map((slot, idx) => {
                      const isSelected = selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (!isBooking) {
                              handleBookSlot(slot);
                            }
                          }}
                          disabled={isBooking}
                          className={`
                            px-4 py-2 rounded-md text-sm transition-colors
                            ${
                              isSelected
                                ? "bg-green-600 text-white"
                                : "bg-green-100 text-black hover:bg-green-200"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {formatTime(slot.startsAt)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Booking Status */}
                {isBooking && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Booking…</p>
                  </div>
                )}

                {/* Error in Modal */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Success in Modal */}
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Availability Message */}
        {!isLoadingAvailability &&
          availability.length > 0 &&
          availability.every((day) => day.slots.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No available time slots in the next 7 days.
              </p>
              <p className="text-sm text-gray-500">
                Please check back later or contact the specialist directly.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

