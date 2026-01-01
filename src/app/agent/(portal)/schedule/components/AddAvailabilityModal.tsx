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

  // Recurring state
  const [recurStartDate, setRecurStartDate] = useState("");
  const [recurEndDate, setRecurEndDate] = useState("");
  const [recurFromTime, setRecurFromTime] = useState("09:00");
  const [recurToTime, setRecurToTime] = useState("09:30");
  const [recurDays, setRecurDays] = useState<string[]>([]);
  const [recurFrequency, setRecurFrequency] = useState<"every-week" | "every-other-week">("every-week");

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      setDayDate(today);
      setRecurStartDate(today);
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

  const toggleDay = (day: string) => {
    setRecurDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

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
        if (!recurStartDate || !recurFromTime || !recurToTime || recurDays.length === 0) {
          alert("Please fill in all required fields and select at least one day.");
          setSaving(false);
          return;
        }

        // Get current availability data
        const res = await fetch("/api/agent/settings/availability", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const currentData = await res.ok ? await res.json() : {};

        // Convert day abbreviations to full day names for the API
        const dayMap: Record<string, string> = {
          "S": "sunday",
          "M": "monday",
          "T": "tuesday",
          "W": "wednesday",
          "Th": "thursday",
          "F": "friday",
          "Sa": "saturday",
        };

        // Note: "Every other week" frequency would need additional logic to handle
        // For now, we save it as weekly - this can be enhanced later if needed

        const fullDayNames = recurDays.map(d => dayMap[d]).filter(Boolean);

        // Get current availability for this location
        const currentAvailability = currentData.availabilityByLocation?.[selectedLocation] || {};
        
        // Build new availability object
        const newAvailability: Record<string, { start_time: string; end_time: string }[]> = {};
        
        // Copy existing schedule
        Object.keys(currentAvailability).forEach(day => {
          newAvailability[day] = currentAvailability[day] || [];
        });

        // Add or update the recurring slots
        fullDayNames.forEach(day => {
          const timeSlot = {
            start_time: recurFromTime,
            end_time: recurToTime,
          };

          // For "every other week", we might need to handle this differently
          // For now, we'll save it as weekly and handle the logic elsewhere if needed
          if (!newAvailability[day]) {
            newAvailability[day] = [];
          }

          // Check if this exact slot already exists
          const exists = newAvailability[day].some(
            (slot: any) => slot.start_time === recurFromTime && slot.end_time === recurToTime
          );

          if (!exists) {
            newAvailability[day].push(timeSlot);
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

  const weekDays = [
    { label: "S", value: "S", full: "Sunday" },
    { label: "M", value: "M", full: "Monday" },
    { label: "T", value: "T", full: "Tuesday" },
    { label: "W", value: "W", full: "Wednesday" },
    { label: "Th", value: "Th", full: "Thursday" },
    { label: "F", value: "F", full: "Friday" },
    { label: "Sa", value: "Sa", full: "Saturday" },
  ];

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
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={recurStartDate}
                        onChange={(e) => setRecurStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>End Date (optional)</Label>
                      <Input
                        type="date"
                        value={recurEndDate}
                        onChange={(e) => setRecurEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>From</Label>
                      <Input
                        type="time"
                        value={recurFromTime}
                        onChange={(e) => setRecurFromTime(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>To</Label>
                      <Input
                        type="time"
                        value={recurToTime}
                        onChange={(e) => setRecurToTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label>Repeats on</Label>
                    <div className="flex gap-2 mt-2">
                      {weekDays.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                            recurDays.includes(day.value)
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          title={day.full}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label>Frequency</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="every-week"
                          checked={recurFrequency === "every-week"}
                          onChange={(e) => setRecurFrequency(e.target.value as "every-week" | "every-other-week")}
                          className="w-4 h-4 text-green-800 focus:ring-green-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">Every week</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="every-other-week"
                          checked={recurFrequency === "every-other-week"}
                          onChange={(e) => setRecurFrequency(e.target.value as "every-week" | "every-other-week")}
                          className="w-4 h-4 text-green-800 focus:ring-green-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">Every other week</span>
                      </label>
                    </div>
                  </div>
                </>
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
