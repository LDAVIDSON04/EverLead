"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";

export default function AgentSettingsPage() {
  useRequireRole("agent");
  const searchParams = useSearchParams();

  const calendar = searchParams.get("calendar"); // e.g. "connected"
  const provider = searchParams.get("provider"); // optional: "google" | "microsoft"
  const error = searchParams.get("error"); // optional error message/code

  const showConnected = calendar === "connected";
  const showDisconnected = calendar === "disconnected";

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-500">
              Manage your calendar connections and basic preferences.
            </p>
          </div>

          <Link
            href="/agent/schedule"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Back to Schedule
          </Link>
        </div>

        {/* Status banners */}
        <div className="space-y-3 mb-6">
          {showConnected && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              ✅ Calendar connected{provider ? ` (${provider})` : ""}. You can
              close this tab and return to your schedule.
            </div>
          )}

          {showDisconnected && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
              Calendar disconnected.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              ⚠️ Calendar connection error: <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Calendar connections card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg text-gray-900 mb-1">Calendar connections</h3>
          <p className="text-sm text-gray-500 mb-5">
            Connect Google or Microsoft to prevent double bookings by syncing busy times.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href="/api/integrations/google/connect"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <span>Connect Google Calendar</span>
              <span aria-hidden>→</span>
            </a>

            <a
              href="/api/integrations/microsoft/connect"
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <span>Connect Microsoft Calendar</span>
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Tip: After connecting, you should see a "Connected ✅" message here.
          </div>
        </div>
      </div>
    </div>
  );
}

