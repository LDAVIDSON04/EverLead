"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { X, ChevronDown } from "lucide-react";

interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (message?: string) => void;
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
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [availabilityByLocation, setAvailabilityByLocation] = useState<Record<string, typeof defaultSchedule>>({});
  const [appointmentLength, setAppointmentLength] = useState("30");

  // Recurring state - use same structure as availability page
  const [recurringSchedule, setRecurringSchedule] = useState<typeof defaultSchedule>(getDefaultScheduleCopy);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
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
      setAvailabilityByLocation(data.availabilityByLocation || {});
      setAppointmentLength(data.appointmentLength || "30");
      
      if (data.locations && data.locations.length > 0) {
        setSelectedLocation(data.locations[0]);
        // Load existing schedule for selected location if it exists
        const existingSchedule = data.availabilityByLocation?.[data.locations[0]];
        if (existingSchedule) {
          setRecurringSchedule(existingSchedule);
        } else {
          setRecurringSchedule(getDefaultScheduleCopy());
        }
      }
    } catch (err) {
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  }

  // Update recurring schedule when location changes
  useEffect(() => {
    if (selectedLocation && availabilityByLocation[selectedLocation]) {
      setRecurringSchedule(availabilityByLocation[selectedLocation]);
    } else if (selectedLocation) {
      setRecurringSchedule(getDefaultScheduleCopy());
    }
  }, [selectedLocation, availabilityByLocation]);

  const handleSave = async () => {
    if (!selectedLocation) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      // Save recurring availability - use checkbox format directly like availability page
      // Normalize location to match availability API (remove "Office" suffix and province)
      const normalizeLocation = (loc: string): string => {
        let normalized = loc.split(',').map(s => s.trim())[0];
        normalized = normalized.replace(/\s+office$/i, '').trim();
        return normalized;
      };

      const normalizedLocation = normalizeLocation(selectedLocation);

      // Get current availability data
      const res = await fetch("/api/agent/settings/availability", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const currentData = await res.ok ? await res.json() : {};

      // Update availability for selected location with checkbox format (same as availability page)
      const updatedAvailabilityByLocation = {
        ...(currentData.availabilityByLocation || availabilityByLocation),
        [normalizedLocation]: recurringSchedule, // Store checkbox format directly
      };

      // Ensure all locations have availability data (same as availability page)
      const completeAvailabilityByLocation: Record<string, any> = {};
      const allLocations = currentData.locations || locations;
      allLocations.forEach((loc: string) => {
        completeAvailabilityByLocation[loc] = updatedAvailabilityByLocation[loc] || defaultSchedule;
      });

      // Update availabilityTypeByLocation - always set to "recurring"
      const updatedTypeByLocation = {
        ...(currentData.availabilityTypeByLocation || {}),
        [normalizedLocation]: "recurring" as const,
      };

      // Save the recurring availability (same format as availability page)
      await fetch("/api/agent/settings/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locations: allLocations,
          availabilityByLocation: completeAvailabilityByLocation,
          appointmentLength: appointmentLength || currentData.appointmentLength || "30",
          availabilityTypeByLocation: updatedTypeByLocation,
        }),
      });

      // Generate success message with location and enabled days
      const enabledDays = days.filter(day => recurringSchedule[day as keyof typeof recurringSchedule].enabled);
      let successMessage = "Availability saved successfully!";
      if (enabledDays.length > 0) {
        const daysList = enabledDays.map(day => {
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          return dayName;
        }).join(", ");
        successMessage = `You have set recurring availability for ${selectedLocation} on ${daysList} and it is now visible for families to book.`;
      } else {
        successMessage = `Availability settings for ${selectedLocation} have been saved.`;
      }
      
      // Show success message in modal briefly
      setSaveMessage({ type: "success", text: successMessage });
      
      // Call onSave callback with message
      onSave?.(successMessage);
      
      // Close modal after a short delay
      setTimeout(() => {
        setSaveMessage(null);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error("Error saving:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save availability. Please try again." });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Add availability</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Save Message */}
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              saveMessage.type === "success" 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <p className="text-sm font-medium">{saveMessage.text}</p>
            </div>
          )}
          
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

              {/* Recurring availability content */}
              <div>
                <div>
                  <Label className="mb-3 block">Weekly Availability</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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
                <div className="mt-6">
                  <Label>Appointment Length</Label>
                  <select
                    value={appointmentLength}
                    onChange={(e) => setAppointmentLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent mt-1"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>
          )}
        </div>

        {/* Actions - Fixed at bottom */}
        {!loading && locations.length > 0 && (
          <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-white flex-shrink-0">
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
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
