"use client";

import { useEffect } from "react";

interface IntroVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function IntroVideoModal({ open, onClose }: IntroVideoModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="video-modal-title" className="text-lg font-semibold text-slate-900">
            Soradin Introduction
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="aspect-video w-full bg-slate-100">
          {/* Placeholder video - replace URL later with actual EverLead intro video */}
          <iframe
            className="h-full w-full rounded-b-2xl"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Soradin introduction video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

