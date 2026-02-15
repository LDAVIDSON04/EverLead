"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_REGEX = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startD = new Date(sy, sm - 1, sd);
  const endD = new Date(ey, em - 1, ed);
  const cur = new Date(startD);
  while (cur <= endD) {
    out.push(toYYYYMMDD(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function OutOfOfficeModal({ isOpen, onClose, onSaved }: Props) {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const fetchDates = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) {
          setError("Not signed in");
          return;
        }
        const res = await fetch("/api/agent/out-of-office", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setError("Failed to load dates");
          return;
        }
        const data = await res.json();
        const dates = (data.dates || []).filter((d: unknown) => typeof d === "string") as string[];
        const entries = (data.entries || []) as Array<{ date: string; allDay: boolean; startTime?: string; endTime?: string }>;
        if (dates.length > 0) {
          const sorted = [...dates].sort();
          setRangeStart(sorted[0]);
          setRangeEnd(sorted[sorted.length - 1]);
        } else {
          setRangeStart(null);
          setRangeEnd(null);
        }
        const firstPartial = entries.find((e) => e.allDay === false && e.startTime && e.endTime);
        if (firstPartial) {
          setAllDay(false);
          setStartTime(firstPartial.startTime ?? "09:00");
          setEndTime(firstPartial.endTime ?? "17:00");
        } else {
          setAllDay(true);
          setStartTime("09:00");
          setEndTime("17:00");
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load dates");
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, [isOpen]);

  const firstOfMonth = new Date(yearMonth.year, yearMonth.month, 1);
  const lastOfMonth = new Date(yearMonth.year, yearMonth.month + 1, 0);
  const startPad = firstOfMonth.getDay();
  const daysInMonth = lastOfMonth.getDate();
  const totalCells = startPad + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < rows * 7) cells.push(null);

  // Display set: the single range (start through end)
  const displaySet = (() => {
    if (!rangeStart) return new Set<string>();
    if (!rangeEnd) return new Set([rangeStart]);
    const [s, e] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
    return new Set(datesInRange(s, e));
  })();

  const handleDateClick = (year: number, month: number, day: number) => {
    const key = toYYYYMMDD(new Date(year, month, day));

    if (rangeStart === null) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }

    if (rangeEnd === null) {
      setRangeEnd(key);
      return;
    }

    // Both start and end set — adjust range (Expedia-style)
    const start = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart <= rangeEnd ? rangeEnd : rangeStart;

    if (key < start) {
      setRangeStart(key);
      setRangeEnd(end);
    } else if (key > end) {
      setRangeStart(start);
      setRangeEnd(key);
    } else if (key > start && key < end) {
      // Inside range: shorten from left or right (first half = new start, second half = new end)
      const arr = datesInRange(start, end);
      const mid = Math.floor((arr.length - 1) / 2);
      const keyIndex = arr.indexOf(key);
      if (keyIndex <= mid) {
        setRangeStart(key);
        setRangeEnd(end);
      } else {
        setRangeStart(start);
        setRangeEnd(key);
      }
    } else if (key === start && key === end) {
      // Single day selected — clear
      setRangeStart(null);
      setRangeEnd(null);
    } else if (key === start) {
      // Shorten from left: new start = next day in range
      const arr = datesInRange(start, end);
      if (arr.length <= 1) {
        setRangeStart(null);
        setRangeEnd(null);
      } else {
        setRangeStart(arr[1]);
        setRangeEnd(end);
      }
    } else if (key === end) {
      // Shorten from right: new end = previous day in range
      const arr = datesInRange(start, end);
      if (arr.length <= 1) {
        setRangeStart(null);
        setRangeEnd(null);
      } else {
        setRangeStart(start);
        setRangeEnd(arr[arr.length - 2]);
      }
    }
  };

  const handleSave = async () => {
    const dates = rangeStart
      ? rangeEnd
        ? datesInRange(
            rangeStart <= rangeEnd ? rangeStart : rangeEnd,
            rangeStart <= rangeEnd ? rangeEnd : rangeStart
          )
        : [rangeStart]
      : [];
    if (dates.length === 0) {
      setError("Select at least one day.");
      return;
    }
    if (!allDay) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startM = (sh ?? 0) * 60 + (sm ?? 0);
      const endM = (eh ?? 0) * 60 + (em ?? 0);
      if (startM >= endM) {
        setError("End time must be after start time.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        setError("Not signed in");
        return;
      }
      const entries = dates.map((date) =>
        allDay
          ? { date, allDay: true }
          : { date, allDay: false, startTime, endTime }
      );
      const res = await fetch("/api/agent/out-of-office", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save");
        return;
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    setYearMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };
  const nextMonth = () => {
    setYearMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Set out of office</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-6 pt-3 text-sm text-gray-600">
          Select days you&apos;re out of office or on vacation. Those days won&apos;t show as available for booking.
        </p>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-medium text-gray-900">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8 text-gray-500">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} />;
                  }
                  const dateStr = toYYYYMMDD(new Date(yearMonth.year, yearMonth.month, day));
                  const isSelected = displaySet.has(dateStr);
                  const isStartOnly = rangeStart === dateStr && !rangeEnd;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDateClick(yearMonth.year, yearMonth.month, day)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-neutral-800 text-white hover:bg-neutral-700"
                          : isStartOnly
                          ? "bg-neutral-600 text-white ring-2 ring-neutral-800 ring-offset-1"
                          : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
                <p className="text-sm font-medium text-gray-700">Time</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAllDay(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      allDay ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All day
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllDay(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !allDay ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Specific times
                  </button>
                </div>
                {!allDay && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="min-w-0">
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="time"
                        value={startTime}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (!TIME_REGEX.test(newValue)) return;
                          setStartTime(newValue);
                        }}
                        className="w-full min-w-0 max-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent text-sm text-gray-900 cursor-pointer"
                      />
                    </div>
                    <span className="text-gray-500 text-xs self-end pb-2.5">to</span>
                    <div className="min-w-0">
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="time"
                        value={endTime}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (!TIME_REGEX.test(newValue)) return;
                          setEndTime(newValue);
                        }}
                        className="w-full min-w-0 max-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent text-sm text-gray-900 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
