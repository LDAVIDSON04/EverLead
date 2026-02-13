"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
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
        setSelectedDates(new Set((data.dates || []).filter((d: unknown) => typeof d === "string")));
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

  const toggleDate = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const key = toYYYYMMDD(d);
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        setError("Not signed in");
        return;
      }
      const dates = Array.from(selectedDates).sort();
      const res = await fetch("/api/agent/out-of-office", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ dates }),
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
          Select days you’re out of office or on vacation. Those days won’t show as available for booking.
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
                                  const isSelected = selectedDates.has(dateStr);
                                  return (
                                    <button
                                      key={dateStr}
                                      type="button"
                                      onClick={() => toggleDate(yearMonth.year, yearMonth.month, day)}
                                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                          ? "bg-neutral-800 text-white hover:bg-neutral-700"
                                          : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
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
