"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { X, ChevronDown } from "lucide-react";

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
    <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`} {...props}>
      {children}
    </label>
  );
}

const defaultSchedule = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "10:00", end: "14:00" },
  sunday: { enabled: false, start: "10:00", end: "14:00" },
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Helper to create a deep copy of the default schedule
function getDefaultScheduleCopy() {
  return {
    monday: { ...defaultSchedule.monday },
    tuesday: { ...defaultSchedule.tuesday },
    wednesday: { ...defaultSchedule.wednesday },
    thursday: { ...defaultSchedule.thursday },
    friday: { ...defaultSchedule.friday },
    saturday: { ...defaultSchedule.saturday },
    sunday: { ...defaultSchedule.sunday },
  };
}

export function AddAvailabilityModal({ isOpen, onClose, onSave }: AddAvailabilityModalProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "recurring">("daily");
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Day only state
  const [dayDate, setDayDate] = useState("");
  const [dayFromTime, setDayFromTime] = useState("09:00");
  const [dayToTime, setDayToTime] = useState("09:30");
  const [dayType, setDayType] = useState<"in-person" | "virtual">("in-person");

  // Recurring state - use same structure as availability page
  const [recurringSchedule, setRecurringSchedule] = useState<typeof defaultSchedule>(getDefaultScheduleCopy);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      setDayDate(today);
      // Reset recurring schedule to defaults when modal opens (create a copy)
      setRecurringSchedule(getDefaultScheduleCopy());
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

      if (activeTab === "daily") {
        // Save daily availability
        if (!dayDate || !dayFromTime || !dayToTime) {
          alert("Please fill in all required fields.");
          setSaving(false);
          return;
        }

        const res = await fetch("/api/agent/settings/daily-availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            location: selectedLocation,
            date: dayDate,
            start_time: dayFromTime,
            end_time: dayToTime,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save daily availability");
        }
      } else {
        // Save recurring availability
        // Check if at least one day is enabled
        const hasEnabledDay = days.some(day => recurringSchedule[day as keyof typeof recurringSchedule].enabled);
        if (!hasEnabledDay) {
          alert("Please enable at least one day for recurring availability.");
          setSaving(false);
          return;
        }

        // Get current availability data
        const res = await fetch("/api/agent/settings/availability", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const currentData = await res.ok ? await res.json() : {};

        // Get current availability for this location
        const currentAvailability = currentData.availabilityByLocation?.[selectedLocation] || {};
        
        // Build new availability object - convert from checkbox schedule format to API format
        const newAvailability: Record<string, { start_time: string; end_time: string }[]> = {};
        
        // Copy existing schedule for other days
        Object.keys(currentAvailability).forEach(day => {
          newAvailability[day] = currentAvailability[day] || [];
        });

        // Convert recurringSchedule to API format
        days.forEach(day => {
          const dayData = recurringSchedule[day as keyof typeof recurringSchedule];
          if (dayData.enabled) {
            const timeSlot = {
              start_time: dayData.start,
              end_time: dayData.end,
            };

            if (!newAvailability[day]) {
              newAvailability[day] = [];
            }

            // Check if this exact slot already exists
            const exists = newAvailability[day].some(
              (slot: any) => slot.start_time === dayData.start && slot.end_time === dayData.end
            );

            if (!exists) {
              newAvailability[day].push(timeSlot);
            }
          } else {
            // If disabled, keep existing slots (don't clear them, just don't add new ones)
            if (!newAvailability[day]) {
              newAvailability[day] = [];
            }
          }
        });

        // Update availabilityTypeByLocation
        const updatedTypeByLocation = {
          ...(currentData.availabilityTypeByLocation || {}),
          [selectedLocation]: "recurring",
        };

        // Save the recurring availability
        await fetch("/api/agent/settings/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            locations: currentData.locations || locations,
            availabilityByLocation: newAvailability,
            appointmentLength: currentData.appointmentLength || "30",
            availabilityTypeByLocation: updatedTypeByLocation,
          }),
        });
      }

      onSave?.();
      onClose();
    } catch (err: any) {
      console.error("Error saving:", err);
      alert(err.message || "Failed to save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add availability</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "daily"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Day only
            {activeTab === "daily" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "recurring"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Recurring
            {activeTab === "recurring" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
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
              {/* Office Location */}
              <div className="mb-6">
                <Label>Office Location</Label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent appearance-none bg-white"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Day only tab content */}
              {activeTab === "daily" && (
                <>
                  <div className="mb-4">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={dayDate}
                      onChange={(e) => setDayDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>From</Label>
                      <Input
                        type="time"
                        value={dayFromTime}
                        onChange={(e) => setDayFromTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>To</Label>
                      <Input
                        type="time"
                        value={dayToTime}
                        onChange={(e) => setDayToTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label>Type</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="dayType"
                          value="in-person"
                          checked={dayType === "in-person"}
                          onChange={(e) => setDayType(e.target.value as "in-person" | "virtual")}
                          className="w-4 h-4 text-green-800 focus:ring-green-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">In person</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="dayType"
                          value="virtual"
                          checked={dayType === "virtual"}
                          onChange={(e) => setDayType(e.target.value as "in-person" | "virtual")}
                          className="w-4 h-4 text-green-800 focus:ring-green-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">Virtual</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Recurring tab content */}
              {activeTab === "recurring" && (
                <div className="mb-6">
                  <Label className="mb-3 block">Weekly Availability</Label>
                  <div className="space-y-2">
                    {days.map((day) => {
                      const dayData = recurringSchedule[day as keyof typeof recurringSchedule];
                      return (
                        <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white">
                          <input
                            type="checkbox"
                            checked={dayData.enabled}
                            onChange={(e) => {
                              setRecurringSchedule({
                                ...recurringSchedule,
                                [day]: { ...dayData, enabled: e.target.checked },
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
                                  setRecurringSchedule({
                                    ...recurringSchedule,
                                    [day]: { ...dayData, start: e.target.value },
                                  });
                                }}
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={dayData.end}
                                onChange={(e) => {
                                  setRecurringSchedule({
                                    ...recurringSchedule,
                                    [day]: { ...dayData, end: e.target.value },
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
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors text-sm font-medium"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Add"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
