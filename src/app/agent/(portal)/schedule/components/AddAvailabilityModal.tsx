"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { X, ChevronDown, Video, MapPin } from "lucide-react";

interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (message?: string) => void;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent ${className}`}
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

type MeetingType = "video" | "in-person";

export function AddAvailabilityModal({ isOpen, onClose, onSave }: AddAvailabilityModalProps) {
  const [meetingType, setMeetingType] = useState<MeetingType>("in-person");
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [availabilityByLocation, setAvailabilityByLocation] = useState<Record<string, typeof defaultSchedule>>({});
  const [appointmentLength, setAppointmentLength] = useState("30");

  // Recurring state - use same structure as availability page (shared for video and in-person)
  const [recurringSchedule, setRecurringSchedule] = useState<typeof defaultSchedule>(getDefaultScheduleCopy);
  // Video schedule stored separately when meeting type is video
  const [videoSchedule, setVideoSchedule] = useState<typeof defaultSchedule | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      setMeetingType("in-person");
      setRecurringSchedule(getDefaultScheduleCopy());
    }
  }, [isOpen]);

  // When switching to video, show video schedule (or default)
  useEffect(() => {
    if (meetingType !== "video") return;
    if (videoSchedule) {
      setRecurringSchedule(videoSchedule);
    } else {
      setRecurringSchedule(getDefaultScheduleCopy());
    }
  }, [meetingType]); // eslint-disable-line react-hooks/exhaustive-deps -- only when meetingType changes to video

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
      setVideoSchedule(data.videoSchedule && typeof data.videoSchedule === "object" ? data.videoSchedule : null);
      
      if (data.locations && data.locations.length > 0) {
        setSelectedLocation(data.locations[0]);
        // Load existing schedule for selected location if it exists
        const existingSchedule = data.availabilityByLocation?.[data.locations[0]];
        if (existingSchedule) {
          // Validate loaded schedule before setting it
          const validatedSchedule = { ...existingSchedule };
          let hasInvalidTimes = false;
          
          days.forEach((day) => {
            const dayData = existingSchedule[day as keyof typeof existingSchedule];
            if (dayData && dayData.enabled) {
              // Validate time format
              const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
              if (!timeRegex.test(dayData.start) || !timeRegex.test(dayData.end)) {
                console.error(`⚠️ [AVAILABILITY LOAD] Invalid time format for ${day}:`, dayData);
                hasInvalidTimes = true;
                // Reset to default if invalid
                validatedSchedule[day as keyof typeof validatedSchedule] = defaultSchedule[day as keyof typeof defaultSchedule];
              } else {
                // Check for obviously wrong times (e.g., 1 AM start)
                const [startHour] = dayData.start.split(":").map(Number);
                if (startHour < 5 || startHour >= 23) {
                  console.warn(`⚠️ [AVAILABILITY LOAD] Unusual start time for ${day} in ${data.locations[0]}: ${dayData.start} (likely incorrect)`);
                }
              }
            }
          });
          
          if (hasInvalidTimes) {
            console.error("🚨 [AVAILABILITY LOAD] Invalid times detected - resetting to defaults");
            setRecurringSchedule(getDefaultScheduleCopy());
          } else {
            setRecurringSchedule(validatedSchedule);
          }
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

  // Update recurring schedule when location changes (in-person only)
  useEffect(() => {
    if (meetingType !== "in-person") return;
    if (selectedLocation && availabilityByLocation[selectedLocation]) {
      setRecurringSchedule(availabilityByLocation[selectedLocation]);
    } else if (selectedLocation) {
      setRecurringSchedule(getDefaultScheduleCopy());
    }
  }, [meetingType, selectedLocation, availabilityByLocation]);

  const handleSave = async () => {
    if (meetingType === "in-person" && !selectedLocation) return;

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
      
      // CRITICAL: Validate time values before saving to catch any browser bugs or invalid data
      const validateAndLogSchedule = () => {
        const issues: string[] = [];
        days.forEach((day) => {
          const dayData = recurringSchedule[day as keyof typeof recurringSchedule];
          if (dayData.enabled) {
            // Validate time format (HH:MM)
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(dayData.start)) {
              issues.push(`${day} start time "${dayData.start}" is invalid format`);
            }
            if (!timeRegex.test(dayData.end)) {
              issues.push(`${day} end time "${dayData.end}" is invalid format`);
            }
            
            // Parse hours to check for obviously wrong values
            const [startHour, startMin] = dayData.start.split(":").map(Number);
            const [endHour, endMin] = dayData.end.split(":").map(Number);
            
            // Warn if start time is before 5 AM or after 11 PM (likely wrong)
            if (startHour < 5 || startHour >= 23) {
              issues.push(`⚠️ ${day} start time "${dayData.start}" is unusual (before 5 AM or after 11 PM). Please verify this is correct.`);
            }
            
            // Validate end is after start
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            if (endMinutes <= startMinutes) {
              issues.push(`${day} end time must be after start time`);
            }
          }
        });
        
        if (issues.length > 0) {
          console.error("🚨 [AVAILABILITY VALIDATION] Issues detected before saving:", issues);
          // Log the full schedule for debugging
          console.log("📋 [AVAILABILITY VALIDATION] Full schedule being saved:", {
            location: normalizedLocation,
            schedule: recurringSchedule,
          });
        } else {
          console.log("✅ [AVAILABILITY VALIDATION] Schedule validated successfully:", {
            location: normalizedLocation,
            schedule: recurringSchedule,
          });
        }
        
        return issues;
      };
      
      // Validate before saving
      const validationIssues = validateAndLogSchedule();
      
      // Separate warnings from errors
      const warnings = validationIssues.filter(issue => issue.includes("⚠️"));
      const criticalErrors = validationIssues.filter(issue => !issue.includes("⚠️"));
      
      // Block saving if there are critical errors
      if (criticalErrors.length > 0) {
        throw new Error(`Invalid availability times: ${criticalErrors.join("; ")}`);
      }
      
      // For warnings (unusual times), show a confirmation dialog
      if (warnings.length > 0) {
        const warningMessage = `Warning: ${warnings.join("; ")}\n\nDo you want to save these times anyway?`;
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) {
          setSaving(false);
          return;
        }
      }

      // Get current availability data
      const res = await fetch("/api/agent/settings/availability", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const currentData = await res.ok ? await res.json() : {};

      if (meetingType === "video") {
        // Save video schedule only (API merges with existing in-person data)
        const videoRes = await fetch("/api/agent/settings/availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            locations: currentData.locations || locations,
            availabilityByLocation: currentData.availabilityByLocation || availabilityByLocation,
            appointmentLength: appointmentLength || currentData.appointmentLength || "30",
            availabilityTypeByLocation: currentData.availabilityTypeByLocation || {},
            videoSchedule: recurringSchedule,
          }),
        });
        if (!videoRes.ok) {
          const errData = await videoRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to save video availability");
        }
        const enabledDays = days.filter(day => recurringSchedule[day as keyof typeof recurringSchedule].enabled);
        const daysList = enabledDays.length > 0
          ? enabledDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")
          : "";
        const successMessage = enabledDays.length > 0
          ? `Video call availability set for ${daysList}. Your province-wide video availability is now visible for families to book.`
          : "Video call availability settings have been saved.";
        setSaveMessage({ type: "success", text: successMessage });
        onSave?.(successMessage);
        setTimeout(() => { setSaveMessage(null); onClose(); }, 500);
        setSaving(false);
        return;
      }

      // In-person: update availability for selected location
      const updatedAvailabilityByLocation = {
        ...(currentData.availabilityByLocation || availabilityByLocation),
        [normalizedLocation]: recurringSchedule,
      };

      const completeAvailabilityByLocation: Record<string, any> = {};
      const allLocations = currentData.locations || locations;
      allLocations.forEach((loc: string) => {
        completeAvailabilityByLocation[loc] = updatedAvailabilityByLocation[loc] || defaultSchedule;
      });

      const updatedTypeByLocation = {
        ...(currentData.availabilityTypeByLocation || {}),
        [normalizedLocation]: "recurring" as const,
      };

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

      const enabledDays = days.filter(day => recurringSchedule[day as keyof typeof recurringSchedule].enabled);
      let successMessage = "Availability saved successfully!";
      if (enabledDays.length > 0) {
        const daysList = enabledDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-6 pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[calc(100vh-4rem)] shadow-2xl border border-gray-100 flex flex-col flex-shrink-0">
        {/* Header - tighter to content */}
        <div className="flex items-center justify-between px-10 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Add availability</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable middle, fixed appointment length + actions at bottom */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-10 py-5 overflow-y-auto flex-1 min-h-0">
            {/* Save Message */}
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.type === "success" 
                  ? "bg-neutral-50 border border-neutral-200 text-neutral-800" 
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                <p className="text-sm font-medium">{saveMessage.text}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Meeting type toggle - always show when not loading */}
                <div className="mb-4">
                  <Label className="mb-2 block text-gray-700 font-medium">Meeting type</Label>
                  <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50/80">
                    <button
                      type="button"
                      onClick={() => setMeetingType("video")}
                      className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-medium transition-all ${
                        meetingType === "video"
                          ? "bg-black text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingType("in-person")}
                      className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg text-sm font-medium transition-all ${
                        meetingType === "in-person"
                          ? "bg-black text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      In Person
                    </button>
                  </div>
                </div>

                {meetingType === "in-person" && locations.length === 0 ? (
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
                    {meetingType === "video" && (
                      <div className="mb-4 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                        <p className="text-sm text-emerald-800">
                          Add video meeting availability to open your client base to the entire province and receive more booked appointments.
                        </p>
                      </div>
                    )}

                    {/* Office Location - only when in-person and we have locations */}
                    {meetingType === "in-person" && locations.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-gray-700 font-medium">Office Location</Label>
                        <div className="relative mt-1.5">
                          <select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent appearance-none bg-white text-gray-900"
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
                    )}

                    {/* Weekly Availability - 2-column grid so all 7 days visible without scrolling */}
                    <div>
                      <Label className="mb-2 block text-gray-700 font-medium">Weekly Availability</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {days.map((day) => {
                          const dayData = recurringSchedule[day as keyof typeof recurringSchedule];
                          return (
                            <div key={day} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={dayData.enabled}
                                onChange={(e) => {
                                  setRecurringSchedule({
                                    ...recurringSchedule,
                                    [day]: { ...dayData, enabled: e.target.checked },
                                  });
                                }}
                                className="w-4 h-4 flex-shrink-0 accent-neutral-800 rounded border-gray-300"
                              />
                              <div className="w-24 flex-shrink-0 capitalize text-sm font-medium text-gray-700">{day}</div>
                              {dayData.enabled ? (
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <Input
                                    type="time"
                                    value={dayData.start}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                                      if (!timeRegex.test(newValue)) return;
                                      setRecurringSchedule({
                                        ...recurringSchedule,
                                        [day]: { ...dayData, start: newValue },
                                      });
                                    }}
                                    className="w-28 min-w-0 py-2 rounded-lg border-gray-200 text-sm"
                                  />
                                  <span className="text-gray-500 text-xs flex-shrink-0">to</span>
                                  <Input
                                    type="time"
                                    value={dayData.end}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
                                      if (!timeRegex.test(newValue)) return;
                                      setRecurringSchedule({
                                        ...recurringSchedule,
                                        [day]: { ...dayData, end: newValue },
                                      });
                                    }}
                                    className="w-28 min-w-0 py-2 rounded-lg border-gray-200 text-sm"
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
              </>
            )}
          </div>

          {/* Footer: Appointment length + actions (when content is shown) */}
          {!loading && (locations.length > 0 || meetingType === "video") && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-10 py-4 border-t border-gray-100 bg-gray-50/30 flex-shrink-0">
              <div className="sm:min-w-[220px]">
                <Label className="text-gray-700 font-medium">Appointment Length</Label>
                <select
                  value={appointmentLength}
                  onChange={(e) => setAppointmentLength(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent mt-1.5 bg-white text-gray-900 text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end sm:justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
