"use client";

import React, { useState, useEffect, useRef } from "react";
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

type DaySettings = { allDay: boolean; startTime: string; endTime: string };

const defaultDaySettings = (): DaySettings => ({ allDay: true, startTime: "09:00", endTime: "17:00" });

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
  const [entryByDate, setEntryByDate] = useState<Record<string, DaySettings>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragStartRef = useRef<string | null>(null);
  const didDragRef = useRef(false);

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
          const byDate: Record<string, DaySettings> = {};
          for (const e of entries) {
            byDate[e.date] = {
              allDay: e.allDay,
              startTime: e.startTime ?? "09:00",
              endTime: e.endTime ?? "17:00",
            };
          }
          setEntryByDate(byDate);
          const first = entries[0];
          setAllDay(first.allDay);
          setStartTime(first.startTime ?? "09:00");
          setEndTime(first.endTime ?? "17:00");
        } else {
          setRangeStart(null);
          setRangeEnd(null);
          setEntryByDate({});
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

  // Display set: selected range of dates
  const displaySet = (() => {
    if (!rangeStart) return new Set<string>();
    if (!rangeEnd) return new Set([rangeStart]);
    const [s, e] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
    return new Set(datesInRange(s, e));
  })();

  // When selected range changes, ensure every selected date has an entry (default to global time)
  useEffect(() => {
    if (displaySet.size === 0) return;
    setEntryByDate((prev) => {
      let next = { ...prev };
      const defaultSettings: DaySettings = { allDay, startTime, endTime };
      for (const date of displaySet) {
        if (!next[date]) next[date] = { ...defaultSettings };
      }
      return next;
    });
  }, [rangeStart, rangeEnd]);

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

  const getDateKey = (year: number, month: number, day: number) =>
    toYYYYMMDD(new Date(year, month, day));

  const handleDateMouseDown = (year: number, month: number, day: number) => {
    const key = getDateKey(year, month, day);
    dragStartRef.current = key;
    didDragRef.current = false;
    // Don't set range here — click handler will set it for a simple click, mouseenter will set it when dragging
  };

  const handleDateMouseEnter = (year: number, month: number, day: number) => {
    if (dragStartRef.current === null) return;
    const key = getDateKey(year, month, day);
    didDragRef.current = true;
    const start = dragStartRef.current;
    const [s, e] = start <= key ? [start, key] : [key, start];
    setRangeStart(s);
    setRangeEnd(e);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onMouseUp = () => {
      dragStartRef.current = null;
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [isOpen]);

  const handleDateClick = (year: number, month: number, day: number) => {
    if (didDragRef.current) return;
    const key = getDateKey(year, month, day);

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

  const applyGlobalToAllSelected = () => {
    const next: Record<string, DaySettings> = {};
    const def: DaySettings = { allDay, startTime, endTime };
    for (const date of displaySet) {
      next[date] = { ...def };
    }
    setEntryByDate((prev) => ({ ...prev, ...next }));
  };

  // When only one day is selected, keep its entry in sync with the global time controls
  const soleSelectedDate = rangeStart && (!rangeEnd || rangeStart === rangeEnd) ? rangeStart : null;
  useEffect(() => {
    if (!soleSelectedDate) return;
    setEntryByDate((prev) => ({
      ...prev,
      [soleSelectedDate]: { allDay, startTime, endTime },
    }));
  }, [soleSelectedDate, allDay, startTime, endTime]);

  const handleSave = async () => {
    const dates = [...displaySet].sort();
    // Validate per-day times
    for (const date of dates) {
      const entry = entryByDate[date] ?? defaultDaySettings();
      if (!entry.allDay) {
        const [sh, sm] = entry.startTime.split(":").map(Number);
        const [eh, em] = entry.endTime.split(":").map(Number);
        const startM = (sh ?? 0) * 60 + (sm ?? 0);
        const endM = (eh ?? 0) * 60 + (em ?? 0);
        if (startM >= endM) {
          setError(`End time must be after start time for ${date}.`);
          return;
        }
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
      const entries = dates.map((date) => {
        const entry = entryByDate[date] ?? defaultDaySettings();
        return entry.allDay
          ? { date, allDay: true }
          : { date, allDay: false, startTime: entry.startTime, endTime: entry.endTime };
      });
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
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Set out of office</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-6 pt-3 text-sm text-gray-600 shrink-0">
          Select days you&apos;re out of office or on vacation. Those days won&apos;t show as available for booking. Click and drag from start to end date, or click individual days. Save with no days selected to clear all.
        </p>
        <div className="p-6 flex-1 min-h-0 overflow-y-auto">
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
                      onMouseDown={() => handleDateMouseDown(yearMonth.year, yearMonth.month, day)}
                      onMouseEnter={() => handleDateMouseEnter(yearMonth.year, yearMonth.month, day)}
                      onClick={() => handleDateClick(yearMonth.year, yearMonth.month, day)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors select-none ${
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
                {displaySet.size > 0 && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Apply same time to all selected days</p>
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
                      <button
                        type="button"
                        onClick={applyGlobalToAllSelected}
                        className="text-sm text-neutral-600 hover:text-neutral-800 underline"
                      >
                        Apply to all selected days
                      </button>
                    </div>
                    {displaySet.size > 1 && (
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Or set a different time for each day</p>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                          {[...displaySet].sort().map((dateStr) => {
                            const entry = entryByDate[dateStr] ?? defaultDaySettings();
                            const dateLabel = (() => {
                              const [y, m, d] = dateStr.split("-").map(Number);
                              const dObj = new Date(y, m - 1, d);
                              return dObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                            })();
                            return (
                              <div key={dateStr} className="flex flex-wrap items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                                <span className="text-sm font-medium text-gray-700 w-28 shrink-0">{dateLabel}</span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEntryByDate((prev) => ({
                                        ...prev,
                                        [dateStr]: { ...entry, allDay: true },
                                      }))
                                    }
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      entry.allDay ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    All day
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEntryByDate((prev) => ({
                                        ...prev,
                                        [dateStr]: { ...entry, allDay: false },
                                      }))
                                    }
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      !entry.allDay ? "bg-neutral-800 text-white" : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    Specific
                                  </button>
                                </div>
                                {!entry.allDay && (
                                  <>
                                    <input
                                      type="time"
                                      value={entry.startTime}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (!TIME_REGEX.test(v)) return;
                                        setEntryByDate((prev) => ({
                                          ...prev,
                                          [dateStr]: { ...prev[dateStr]!, startTime: v },
                                        }));
                                      }}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-gray-400 text-xs">to</span>
                                    <input
                                      type="time"
                                      value={entry.endTime}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (!TIME_REGEX.test(v)) return;
                                        setEntryByDate((prev) => ({
                                          ...prev,
                                          [dateStr]: { ...prev[dateStr]!, endTime: v },
                                        }));
                                      }}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              {!loading && displaySet.size === 0 && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No days selected. Click &quot;Save&quot; to clear all out of office, or select days above to set new dates.
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3 justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <div>
            {!loading && displaySet.size > 0 && (
              <button
                type="button"
                onClick={async () => {
                  setRangeStart(null);
                  setRangeEnd(null);
                  setError(null);
                  setSaving(true);
                  try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (!session?.access_token) {
                      setError("Not signed in");
                      return;
                    }
                    const res = await fetch("/api/agent/out-of-office", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ entries: [] }),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      setError(data.error || "Failed to clear");
                      return;
                    }
                    onSaved?.();
                    onClose();
                  } catch (e) {
                    console.error(e);
                    setError("Failed to clear");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Clearing…" : "Clear all out of office"}
              </button>
            )}
          </div>
          <div className="flex gap-3">
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
    </div>
  );
}
