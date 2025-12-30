"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { MapPin, Plus } from "lucide-react";

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

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [appointmentLength, setAppointmentLength] = useState("30");

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
        } else {
          // Initialize with default location if none exist
          setLocations(["Kelowna"]);
          setSelectedLocation("Kelowna");
          setAvailabilityByLocation({ Kelowna: defaultSchedule });
        }
      } catch (err) {
        console.error("Error loading availability:", err);
        // Set defaults on error
        setLocations(["Kelowna"]);
        setSelectedLocation("Kelowna");
        setAvailabilityByLocation({ Kelowna: defaultSchedule });
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

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

      const res = await fetch("/api/agent/settings/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locations,
          availabilityByLocation,
          appointmentLength,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save availability");
      }

      setSaveMessage({ type: "success", text: "Availability saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving availability:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save availability" });
    } finally {
      setSaving(false);
    }
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
        {/* Availability Rules */}
        <div className="mb-8">
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
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
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
                  const dayData = availabilityByLocation[selectedLocation]?.[day as keyof typeof defaultSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
                  return (
                    <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white">
                      <input
                        type="checkbox"
                        checked={dayData.enabled}
                        onChange={(e) => {
                          setAvailabilityByLocation({
                            ...availabilityByLocation,
                            [selectedLocation]: {
                              ...availabilityByLocation[selectedLocation],
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
                                  ...availabilityByLocation[selectedLocation],
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
                                  ...availabilityByLocation[selectedLocation],
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
          </div>

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
        </div>

        {saveMessage && (
          <div className={`mb-4 p-3 rounded-lg ${
            saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {saveMessage.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveAvailability}
            disabled={saving}
            className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </div>
    </div>
  );
}
