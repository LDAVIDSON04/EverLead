"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function Label({ className = "", children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

// Daily availability modal (embedded in the main modal)
function DailyAvailabilitySubModal({
  location,
  onClose: onSubClose,
}: {
  location: string;
  onClose: () => void;
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [dailyAvailability, setDailyAvailability] = useState<Record<string, { start_time: string; end_time: string; id?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalExistingAvailability, setModalExistingAvailability] = useState<{ start_time: string; end_time: string; id?: string } | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyAvailability();
  }, [location, currentWeekStart]);

  async function loadDailyAvailability() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startDateStr = currentWeekStart.toISOString().split("T")[0];
      const endDateStr = weekEnd.toISOString().split("T")[0];

      const res = await fetch(
        `/api/agent/settings/daily-availability?location=${encodeURIComponent(location)}&startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to load daily availability");
      const data = await res.json();

      const availabilityMap: Record<string, { start_time: string; end_time: string; id?: string }> = {};
      Object.keys(data).forEach((date) => {
        availabilityMap[date] = { ...data[date] };
      });
      setDailyAvailability(availabilityMap);
    } catch (err) {
      console.error("Error loading daily availability:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const existing = dailyAvailability[dateStr];
    setSelectedDate(date);
    setModalExistingAvailability(existing);
    setModalOpen(true);
  };

  const handleSaveDailyAvailability = async (date: string, startTime: string, endTime: string) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const res = await fetch("/api/agent/settings/daily-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ location, date, start_time: startTime, end_time: endTime }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save daily availability");
    }

    await loadDailyAvailability();
    setModalOpen(false);
  };

  const handleDeleteDailyAvailability = async () => {
    if (!selectedDate || !modalExistingAvailability?.id) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const res = await fetch("/api/agent/settings/daily-availability", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: modalExistingAvailability.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete daily availability");
    }

    await loadDailyAvailability();
    setModalOpen(false);
  };

  const getWeekDates = () => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium text-gray-700">
            {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" - "}
            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          <button
            onClick={() => navigateWeek("next")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getWeekDates().map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const existing = dailyAvailability[dateStr];
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = date.getDate();

            const formatTime = (time: string) => {
              const [hours, minutes] = time.split(":").map(Number);
              const period = hours >= 12 ? "PM" : "AM";
              const displayHours = hours % 12 || 12;
              return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
            };

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  existing
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div className="text-xs font-semibold text-gray-600 mb-1">{dayName}</div>
                <div className={`text-lg font-bold ${existing ? "text-green-700" : "text-gray-900"}`}>
                  {dayNum}
                </div>
                {existing && (
                  <div className="text-xs text-green-700 mt-1">
                    {formatTime(existing.start_time)} - {formatTime(existing.end_time)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slot modal */}
      {modalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <div className="mb-4">
              <Label>From</Label>
              <Input
                type="time"
                defaultValue={modalExistingAvailability?.start_time || "09:00"}
                id="start-time"
              />
            </div>
            <div className="mb-6">
              <Label>To</Label>
              <Input
                type="time"
                defaultValue={modalExistingAvailability?.end_time || "17:00"}
                id="end-time"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {modalExistingAvailability?.id && (
                <button
                  onClick={handleDeleteDailyAvailability}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <button
                onClick={async () => {
                  const startInput = document.getElementById("start-time") as HTMLInputElement;
                  const endInput = document.getElementById("end-time") as HTMLInputElement;
                  await handleSaveDailyAvailability(
                    selectedDate.toISOString().split("T")[0],
                    startInput.value,
                    endInput.value
                  );
                }}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddAvailabilityModal({ isOpen, onClose, onSave }: AddAvailabilityModalProps) {
  const [availabilityType, setAvailabilityType] = useState<"daily" | "recurring">("recurring");
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  async function loadLocations() {
    try {
      setLoading(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/agent/settings/availability", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to load locations");
      const data = await res.json();

      setLocations(data.locations || []);
      if (data.locations && data.locations.length > 0) {
        setSelectedLocation(data.locations[0]);
        // Set initial type for selected location
        const locationType = data.availabilityTypeByLocation?.[data.locations[0]] || "recurring";
        setAvailabilityType(locationType);
      }
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      // Get current availability data
      const res = await fetch("/api/agent/settings/availability", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const currentData = await res.ok ? await res.json() : {};

      // Update availability type for selected location
      const updatedTypeByLocation = {
        ...(currentData.availabilityTypeByLocation || {}),
        [selectedLocation]: availabilityType,
      };

      // Save the type (this is mainly for recurring, daily is saved via the sub-modal)
      if (availabilityType === "recurring") {
        // For recurring, we need to redirect to the availability page or show the recurring UI
        // For now, just save the type change
        await fetch("/api/agent/settings/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            locations: currentData.locations || locations,
            availabilityByLocation: currentData.availabilityByLocation || {},
            appointmentLength: currentData.appointmentLength || "30",
            availabilityTypeByLocation: updatedTypeByLocation,
          }),
        });
      }

      onSave?.();
      onClose();
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Add availability</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading locations...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No locations found. Please add office locations first.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Type Toggle */}
              <div className="mb-6">
                <Label className="mb-2">Availability Type</Label>
                <div className="flex gap-2 border border-gray-300 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setAvailabilityType("daily")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      availabilityType === "daily"
                        ? "bg-green-800 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Day only
                  </button>
                  <button
                    onClick={() => setAvailabilityType("recurring")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      availabilityType === "recurring"
                        ? "bg-green-800 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>

              {/* Location Selector */}
              <div className="mb-6">
                <Label className="mb-2">Office Location</Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability UI */}
              {availabilityType === "daily" && selectedLocation && (
                <DailyAvailabilitySubModal
                  location={selectedLocation}
                  onClose={onClose}
                />
              )}

              {availabilityType === "recurring" && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    For recurring availability, please use the{" "}
                    <a href="/agent/availability" className="text-green-800 underline" target="_blank">
                      Availability page
                    </a>{" "}
                    to set your weekly schedule.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                {availabilityType === "daily" ? (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
                  >
                    Done
                  </button>
                ) : (
                  <a
                    href="/agent/availability"
                    className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 text-center"
                  >
                    Go to Availability
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

