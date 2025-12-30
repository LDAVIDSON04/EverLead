"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

function Badge({ className = "", children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default function CalendarSyncPage() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkConnections() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("metadata")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.metadata) {
          const metadata = profile.metadata as any;
          setGoogleConnected(!!metadata.google_calendar_access_token);
          setMicrosoftConnected(!!metadata.microsoft_calendar_access_token);
        }
      } catch (error) {
        console.error("Error checking calendar connections:", error);
      } finally {
        setLoading(false);
      }
    }

    checkConnections();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Calendar Sync</h1>
        <p className="text-gray-600 text-sm">
          Connect your calendar to automatically sync appointments and avoid double-bookings. This is optional but recommended.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <strong>Note:</strong> Calendar syncing is optional. Soradin will only offer time slots that follow
          your availability rules AND do not conflict with your connected calendars. If you work with a team, 
          you may need your administrator's approval to sync your calendar.
        </div>
      </div>

      {/* Calendar Connections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Google Calendar</div>
              {googleConnected && <div className="text-sm text-gray-500">Last synced: Recently</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (!session?.access_token) {
                        alert("Please log in to reconnect your calendar");
                        return;
                      }
                      // Disconnect first, then redirect to connect
                      await fetch("/api/integrations/google/disconnect", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      });
                      // Redirect to connect (will allow account selection)
                      window.location.href = `/api/integrations/google/connect?specialistId=${session.user.id}`;
                    } catch (err) {
                      console.error("Error reconnecting Google Calendar:", err);
                      alert("Failed to reconnect. Please try again.");
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (!session?.access_token) {
                      alert("Please log in to connect your calendar");
                      return;
                    }
                    // Redirect to connect (will allow account selection)
                    window.location.href = `/api/integrations/google/connect?specialistId=${session.user.id}`;
                  } catch (err) {
                    console.error("Error connecting Google Calendar:", err);
                    alert("Failed to connect. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-sky-600" />
            </div>
            <div>
              <div className="font-medium">Microsoft Calendar</div>
              {microsoftConnected && <div className="text-sm text-gray-500">Last synced: Recently</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {microsoftConnected ? (
              <>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (!session?.access_token) {
                        alert("Please log in to reconnect your calendar");
                        return;
                      }
                      // Disconnect first, then redirect to connect
                      await fetch("/api/integrations/microsoft/disconnect", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      });
                      // Redirect to connect (will allow account selection)
                      window.location.href = `/api/integrations/microsoft/connect?specialistId=${session.user.id}`;
                    } catch (err) {
                      console.error("Error reconnecting Microsoft Calendar:", err);
                      alert("Failed to reconnect. Please try again.");
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (!session?.access_token) {
                      alert("Please log in to connect your calendar");
                      return;
                    }
                    // Redirect to connect (will allow account selection)
                    window.location.href = `/api/integrations/microsoft/connect?specialistId=${session.user.id}`;
                  } catch (err) {
                    console.error("Error connecting Microsoft Calendar:", err);
                    alert("Failed to connect. Please try again.");
                  }
                }}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
              >
                Connect Microsoft Calendar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

