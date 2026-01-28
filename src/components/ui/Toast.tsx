"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: Check,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-neutral-600 border-neutral-700",
    error: "bg-red-600 border-red-700",
    info: "bg-blue-600 border-blue-700",
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 text-white min-w-[300px] max-w-md transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${colors[type]}`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// Toast manager for global use
let toastContainer: HTMLDivElement | null = null;
let toastQueue: Array<{ id: string; message: string; type: ToastType; duration: number }> = [];

export function showToast(message: string, type: ToastType = "success", duration = 4000) {
  if (typeof window === "undefined") return;

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(toastContainer);
  }

  const id = `toast-${Date.now()}-${Math.random()}`;
  const toastDiv = document.createElement("div");
  toastContainer.appendChild(toastDiv);

  const icons = {
    success: Check,
    error: AlertCircle,
    info: Info,
  };

  const colors = {
    success: "bg-neutral-600 border-neutral-700",
    error: "bg-red-600 border-red-700",
    info: "bg-blue-600 border-blue-700",
  };

  const Icon = icons[type];
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${type === "success" ? "<path d=\"M20 6L9 17l-5-5\"/>" : type === "error" ? "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"/>" : "<circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"/>"}</svg>`;

  toastDiv.className = `flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 text-white min-w-[300px] max-w-md transform transition-all duration-300 translate-x-0 opacity-100 ${colors[type]}`;
  toastDiv.innerHTML = `
    <div class="flex-shrink-0">${iconSvg}</div>
    <p class="flex-1 text-sm font-medium">${message}</p>
    <button class="flex-shrink-0 hover:opacity-80 transition-opacity" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  setTimeout(() => {
    toastDiv.style.transform = "translateX(100%)";
    toastDiv.style.opacity = "0";
    setTimeout(() => {
      if (toastDiv.parentElement) {
        toastDiv.parentElement.removeChild(toastDiv);
      }
    }, 300);
  }, duration);
}

