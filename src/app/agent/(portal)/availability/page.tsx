"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { MapPin, Plus, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

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

function Select({ value, onValueChange, children, ...props }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
      {...props}
    >
      {children}
    </select>
  );
}

// Modal component for adding/editing daily availability
function DailyAvailabilityModal({
  isOpen,
  onClose,
  selectedDate,
  location,
  existingAvailability,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  location: string;
  existingAvailability?: { start_time: string; end_time: string };
  onSave: (date: string, startTime: string, endTime: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [startTime, setStartTime] = useState(existingAvailability?.start_time || "09:00");
  const [endTime, setEndTime] = useState(existingAvailability?.end_time || "17:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingAvailability) {
      setStartTime(existingAvailability.start_time);
      setEndTime(existingAvailability.end_time);
    } else {
      setStartTime("09:00");
      setEndTime("17:00");
    }
  }, [existingAvailability, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      await onSave(dateStr, startTime, endTime);
      onClose();
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const dateStr = selectedDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add availability</h2>

        <div className="mb-4">
          <Label>Date</Label>
          <Input type="text" value={dateStr} disabled />
        </div>

        <div className="mb-4">
          <Label>From</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <Label>To</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          {onDelete && existingAvailability && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : existingAvailability ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [appointmentLength, setAppointmentLength] = useState("30");

  // Toggle between "Day only" and "Recurring"
  const [availabilityType, setAvailabilityType] = useState<"daily" | "recurring">("recurring");
  const [availabilityTypeByLocation, setAvailabilityTypeByLocation] = useState<Record<string, "daily" | "recurring">>({});

  // Daily availability state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Get Monday of current week
    return new Date(today.setDate(diff));
  });
  const [dailyAvailability, setDailyAvailability] = useState<Record<string, { start_time: string; end_time: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalExistingAvailability, setModalExistingAvailability] = useState<{ start_time: string; end_time: string } | undefined>();

  const defaultSchedule = {
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "10:00", end: "14:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
  };

  const [availabilityByLocation, setAvailabilityByLocation] = useState<Record<string, typeof defaultSchedule>>({});

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  // Load availability data
  useEffect(() => {
    async function loadAvailability() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/agent/settings/availability", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load availability");

        const data = await res.json();
        if (data.locations && data.locations.length > 0) {
          setLocations(data.locations);
          setSelectedLocation(data.locations[0]);
          setAvailabilityByLocation(data.availabilityByLocation || {});
          setAppointmentLength(data.appointmentLength || "30");
          setAvailabilityTypeByLocation(data.availabilityTypeByLocation || {});

          // Set initial type for selected location
          const locationType = data.availabilityTypeByLocation?.[data.locations[0]] || "recurring";
          setAvailabilityType(locationType);
        } else {
          setLocations([]);
          setAvailabilityByLocation({});
        }
      } catch (err) {
        console.error("Error loading availability:", err);
        setLocations([]);
        setAvailabilityByLocation({});
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  // Load daily availability when location or week changes (for daily mode)
  useEffect(() => {
    if (availabilityType === "daily" && selectedLocation) {
      loadDailyAvailability();
    }
  }, [availabilityType, selectedLocation, currentWeekStart]);

  async function loadDailyAvailability() {
    if (!selectedLocation) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      // Calculate week start and end dates
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startDateStr = currentWeekStart.toISOString().split("T")[0];
      const endDateStr = weekEnd.toISOString().split("T")[0];

      const res = await fetch(
        `/api/agent/settings/daily-availability?location=${encodeURIComponent(selectedLocation)}&startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load daily availability");

      const data = await res.json();
      const availabilityMap: Record<string, { start_time: string; end_time: string }> = {};
      (data || []).forEach((item: any) => {
        availabilityMap[item.date] = {
          start_time: item.start_time,
          end_time: item.end_time,
        };
      });
      setDailyAvailability(availabilityMap);
    } catch (err) {
      console.error("Error loading daily availability:", err);
    }
  }

  const addLocation = () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim();
      setLocations([...locations, locationName]);
      setAvailabilityByLocation({
        ...availabilityByLocation,
        [locationName]: { ...defaultSchedule },
      });
      setSelectedLocation(locationName);
      setNewLocationName("");
      setShowAddLocation(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Update availability type for current location
      const updatedTypeByLocation = {
        ...availabilityTypeByLocation,
        [selectedLocation]: availabilityType,
      };

      // Ensure all locations have availability data (initialize with default if missing)
      const completeAvailabilityByLocation: Record<string, any> = {};
      locations.forEach((loc: string) => {
        completeAvailabilityByLocation[loc] = availabilityByLocation[loc] || defaultSchedule;
      });

      const res = await fetch("/api/agent/settings/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locations,
          availabilityByLocation: completeAvailabilityByLocation,
          appointmentLength,
          availabilityTypeByLocation: updatedTypeByLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save availability");
      }

      setAvailabilityTypeByLocation(updatedTypeByLocation);
      setSaveMessage({ type: "success", text: "Availability saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving availability:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save availability" });
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    // Update type based on saved preference for this location
    const locationType = availabilityTypeByLocation[location] || "recurring";
    setAvailabilityType(locationType);
  };

  const handleTypeToggle = async (type: "daily" | "recurring") => {
    setAvailabilityType(type);
    // Auto-save type change
    const updatedTypeByLocation = {
      ...availabilityTypeByLocation,
      [selectedLocation]: type,
    };
    setAvailabilityTypeByLocation(updatedTypeByLocation);

    // Save immediately
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.access_token) {
        fetch("/api/agent/settings/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            locations,
            availabilityByLocation,
            appointmentLength,
            availabilityTypeByLocation: updatedTypeByLocation,
          }),
        }).catch((err) => console.error("Error saving type change:", err));
      }
    } catch (err) {
      console.error("Error in handleTypeToggle:", err);
    }
  };

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
      body: JSON.stringify({
        location: selectedLocation,
        date,
        startTime,
        endTime,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save daily availability");
    }

    // Reload daily availability
    await loadDailyAvailability();
  };

  const handleDeleteDailyAvailability = async () => {
    if (!selectedDate) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const dateStr = selectedDate.toISOString().split("T")[0];

    const res = await fetch(
      `/api/agent/settings/daily-availability?location=${encodeURIComponent(selectedLocation)}&date=${dateStr}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete daily availability");
    }

    // Reload daily availability
    await loadDailyAvailability();
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Availability</h1>
        <p className="text-gray-600 text-sm">Set your availability rules for each location you serve</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Location Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin size={18} className="text-green-800" />
                Availability Rules by Location
              </h3>
              <p className="text-sm text-gray-600 mt-1">Set different availability for each city you serve</p>
            </div>
          </div>

          <div className="mb-4">
            {locations.length === 0 && !showAddLocation ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>No cities found.</strong> Cities from your office locations will appear here automatically. You can also add cities manually if you serve areas where you don't have an office.
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => handleLocationChange(location)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedLocation === location
                      ? "bg-green-800 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {location}
                </button>
              ))}
              {!showAddLocation ? (
                <button
                  onClick={() => setShowAddLocation(true)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Add City
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") addLocation();
                    }}
                    placeholder="City name"
                    className="w-40"
                    autoFocus
                  />
                  <button
                    onClick={addLocation}
                    className="px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLocation(false);
                      setNewLocationName("");
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Type Toggle */}
        {selectedLocation && (
          <div className="mb-6">
            <div className="flex gap-2 border border-gray-300 rounded-lg p-1 w-fit">
              <button
                onClick={() => handleTypeToggle("daily")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  availabilityType === "daily"
                    ? "bg-green-800 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {availabilityType === "daily" ? "✓ " : ""}Day only
              </button>
              <button
                onClick={() => handleTypeToggle("recurring")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  availabilityType === "recurring"
                    ? "bg-green-800 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {availabilityType === "recurring" ? "✓ " : ""}Recurring
              </button>
            </div>
          </div>
        )}

        {/* Recurring Availability View */}
        {availabilityType === "recurring" && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Showing availability for {selectedLocation}.</strong> Set the days and hours when you're
                available to serve clients in this location.
              </p>
            </div>

            <div className="mb-6">
              <Label className="mb-3 block">Weekly Availability</Label>
              <div className="space-y-2">
                {days.map((day) => {
                  const locationAvailability = availabilityByLocation[selectedLocation] || defaultSchedule;
                  const dayData = locationAvailability[day as keyof typeof defaultSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
                  return (
                    <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white">
                      <input
                        type="checkbox"
                        checked={dayData.enabled}
                        onChange={(e) => {
                          setAvailabilityByLocation({
                            ...availabilityByLocation,
                            [selectedLocation]: {
                              ...(availabilityByLocation[selectedLocation] || defaultSchedule),
                              [day]: { ...dayData, enabled: e.target.checked },
                            },
                          });
                        }}
                        className="w-4 h-4 accent-green-800"
                      />
                      <div className="w-24 capitalize">{day}</div>
                      {dayData.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={dayData.start}
                            onChange={(e) => {
                              setAvailabilityByLocation({
                                ...availabilityByLocation,
                                [selectedLocation]: {
                                  ...(availabilityByLocation[selectedLocation] || defaultSchedule),
                                  [day]: { ...dayData, start: e.target.value },
                                },
                              });
                            }}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={dayData.end}
                            onChange={(e) => {
                              setAvailabilityByLocation({
                                ...availabilityByLocation,
                                [selectedLocation]: {
                                  ...(availabilityByLocation[selectedLocation] || defaultSchedule),
                                  [day]: { ...dayData, end: e.target.value },
                                },
                              });
                            }}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Daily Availability View */}
        {availabilityType === "daily" && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Daily availability for {selectedLocation}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Click on a date to set your availability time slots
                  </p>
                </div>
              </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateWeek("prev")}
                className="group flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ChevronLeft size={20} className="text-gray-600 group-hover:text-gray-900" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div className="text-lg font-semibold text-gray-900 tracking-tight">
                  {currentWeekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  {" - "}
                  {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button
                onClick={() => navigateWeek("next")}
                className="group flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ChevronRight size={20} className="text-gray-600 group-hover:text-gray-900" />
              </button>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {getWeekDates().map((date, index) => {
                const dateStr = date.toISOString().split("T")[0];
                const existing = dailyAvailability[dateStr];
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();
                const monthName = date.toLocaleDateString("en-US", { month: "short" });

                // Format time for display (convert 24h to 12h)
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
                    className={`
                      group relative
                      p-5 rounded-xl
                      border-2 transition-all duration-200
                      cursor-pointer
                      hover:scale-[1.02] hover:shadow-lg
                      ${existing
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30 shadow-sm"
                      }
                      ${isToday 
                        ? "ring-2 ring-blue-500 ring-offset-2 border-blue-400" 
                        : ""
                      }
                    `}
                  >
                    {/* Day Header */}
                    <div className="flex flex-col items-start mb-3">
                      <div className={`
                        text-xs font-semibold uppercase tracking-wider mb-1
                        ${existing ? "text-green-700" : "text-gray-500"}
                        ${isToday ? "text-blue-600" : ""}
                      `}>
                        {dayName}
                      </div>
                      <div className={`
                        text-2xl font-bold
                        ${isToday ? "text-blue-600" : existing ? "text-green-900" : "text-gray-900"}
                      `}>
                        {dayNum}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{monthName}</div>
                    </div>

                    {/* Availability Status */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {existing ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-700">Available</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="font-mono">
                              {formatTime(existing.start_time)} - {formatTime(existing.end_time)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                          <div className="w-2 h-2 rounded-full border border-gray-300"></div>
                          <span>Click to add</span>
                        </div>
                      )}
                    </div>

                    {/* Hover overlay effect */}
                    {!existing && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-200 pointer-events-none"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Appointment Length (shown for both types) */}
        <div className="max-w-md mt-6">
          <Label htmlFor="appointmentLength">Default Appointment Length</Label>
          <Select value={appointmentLength} onValueChange={setAppointmentLength} id="appointmentLength">
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </Select>
        </div>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {saveMessage.text}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveAvailability}
            disabled={saving}
            className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </div>

      {/* Daily Availability Modal */}
      {selectedDate && (
        <DailyAvailabilityModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDate(null);
            setModalExistingAvailability(undefined);
          }}
          selectedDate={selectedDate}
          location={selectedLocation}
          existingAvailability={modalExistingAvailability}
          onSave={handleSaveDailyAvailability}
          onDelete={modalExistingAvailability ? handleDeleteDailyAvailability : undefined}
        />
      )}
    </div>
  );
}
