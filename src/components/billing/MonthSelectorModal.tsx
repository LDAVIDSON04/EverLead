"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";

interface MonthSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onMonthSelect: (year: number, month: number) => void;
  loadingStatement: boolean;
}

export function MonthSelectorModal({
  open,
  onClose,
  selectedYear,
  onYearChange,
  onMonthSelect,
  loadingStatement,
}: MonthSelectorModalProps) {
  // Handle Esc key to close modal
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Statement Period
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Year Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-800 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-4 gap-3">
            {monthNames.map((monthName, index) => {
              const month = index + 1;
              const monthAbbrev = monthName.substring(0, 3);
              return (
                <button
                  key={month}
                  onClick={() => onMonthSelect(selectedYear, month)}
                  disabled={loadingStatement}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-navy-800 hover:bg-navy-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText
                    size={28}
                    className={`mb-2 ${loadingStatement ? "text-gray-400" : "text-gray-600"}`}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {monthAbbrev}
                  </span>
                </button>
              );
            })}
          </div>

          {loadingStatement && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Loading statement...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

