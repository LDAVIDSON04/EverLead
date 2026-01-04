"use client";

import { useState, useEffect } from "react";
import { X, Clock, MapPin, FileText } from "lucide-react";
import { DateTime } from "luxon";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date;
  initialHour: number;
  initialMinute?: number;
  agentTimezone: string;
  appointmentLength: number; // in minutes
  onSave: (eventData: {
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string;
    description?: string;
  }) => Promise<void>;
}

export function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  initialHour,
  initialMinute = 0,
  agentTimezone,
  appointmentLength,
  onSave,
}: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(initialDate);
  const [startHour, setStartHour] = useState(initialHour);
  const [startMinute, setStartMinute] = useState(initialMinute);
  const [duration, setDuration] = useState(appointmentLength);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setLocation("");
      setDescription("");
      setDate(new Date(initialDate));
      setStartHour(initialHour);
      setStartMinute(initialMinute);
      setDuration(appointmentLength);
      setError(null);
    }
  }, [isOpen, initialDate, initialHour, initialMinute, appointmentLength]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Create date/time in agent's timezone
      const localDateTime = DateTime.fromObject(
        {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hour: startHour,
          minute: startMinute,
        },
        { zone: agentTimezone }
      );

      // Convert to UTC for storage
      const startsAt = localDateTime.toUTC().toISO();
      const endsAt = localDateTime.plus({ minutes: duration }).toUTC().toISO();

      await onSave({
        title: title.trim(),
        startsAt,
        endsAt,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Format date for display
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Generate time options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];
  const durationOptions = [15, 30, 45, 60, 90, 120];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
              autoFocus
            />
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Date & Time
            </label>
            <div className="space-y-3">
              {/* Date */}
              <div>
                <input
                  type="date"
                  value={date.toISOString().split("T")[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>
              </div>

              {/* Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hour</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
                  >
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>
                        {h === 0
                          ? "12 AM"
                          : h === 12
                          ? "12 PM"
                          : h < 12
                          ? `${h} AM`
                          : `${h - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minute</label>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
                  >
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
                  >
                    {durationOptions.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Add location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Add description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C6F3C] focus:border-[#0C6F3C] outline-none resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-6 py-2 bg-[#0C6F3C] text-white rounded-lg hover:bg-[#0C6F3C]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

