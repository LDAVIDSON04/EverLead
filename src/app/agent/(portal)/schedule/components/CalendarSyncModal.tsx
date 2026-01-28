"use client";

import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { X } from "lucide-react";

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Google Calendar Icon SVG
function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#4285F4"/>
      <path d="M7 11H9V13H7V11ZM11 11H13V13H11V11ZM15 11H17V13H15V11ZM7 15H9V17H7V15ZM11 15H13V17H11V15ZM15 15H17V17H15V15Z" fill="#34A853"/>
      <path d="M16 6V8H19V6H16Z" fill="#EA4335"/>
      <path d="M8 6V8H11V6H8Z" fill="#FBBC04"/>
    </svg>
  );
}

// Microsoft Calendar Icon SVG (using Microsoft brand colors)
function MicrosoftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#0078D4"/>
      <rect x="7" y="11" width="2" height="2" fill="#0078D4"/>
      <rect x="11" y="11" width="2" height="2" fill="#0078D4"/>
      <rect x="15" y="11" width="2" height="2" fill="#0078D4"/>
      <rect x="7" y="15" width="2" height="2" fill="#0078D4"/>
      <rect x="11" y="15" width="2" height="2" fill="#0078D4"/>
      <rect x="15" y="15" width="2" height="2" fill="#0078D4"/>
      <path d="M8 6V8H11V6H8Z" fill="#0078D4"/>
      <path d="M16 6V8H19V6H16Z" fill="#0078D4"/>
    </svg>
  );
}

export function CalendarSyncModal({ isOpen, onClose }: CalendarSyncModalProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkConnections();
    }
  }, [isOpen]);

  async function checkConnections() {
    try {
      setLoading(true);
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: connections, error } = await supabaseClient
        .from("calendar_connections")
        .select("provider")
        .eq("specialist_id", user.id);

      if (error) {
        console.error("Error fetching calendar connections:", error);
      } else if (connections) {
        setGoogleConnected(connections.some((c: any) => c.provider === "google"));
        setMicrosoftConnected(connections.some((c: any) => c.provider === "microsoft"));
      }
    } catch (error) {
      console.error("Error checking calendar connections:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(provider: "google" | "microsoft") {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!session?.access_token || !user) {
        alert("Please log in to connect your calendar");
        return;
      }

      // Redirect to connect endpoint
      window.location.href = `/api/integrations/${provider}/connect?specialistId=${user.id}`;
    } catch (err) {
      console.error(`Error connecting ${provider} calendar:`, err);
      alert("Failed to connect. Please try again.");
    }
  }

  async function handleDisconnect(provider: "google" | "microsoft") {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        alert("Please log in to disconnect your calendar");
        return;
      }

      const res = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }

      // Refresh connection status
      await checkConnections();
    } catch (err) {
      console.error(`Error disconnecting ${provider} calendar:`, err);
      alert("Failed to disconnect. Please try again.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Calendar Sync</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Connect your calendar to automatically sync appointments and avoid double-bookings.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-gray-200 flex-shrink-0">
                    <GoogleIcon />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Google Calendar</div>
                    {googleConnected && (
                      <div className="text-xs text-gray-500">Connected</div>
                    )}
                  </div>
                </div>
                {googleConnected ? (
                  <button
                    onClick={() => handleDisconnect("google")}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect("google")}
                    className="px-4 py-2 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors whitespace-nowrap"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Microsoft Calendar */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border border-gray-200 flex-shrink-0">
                    <MicrosoftIcon />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Microsoft Calendar</div>
                    {microsoftConnected && (
                      <div className="text-xs text-gray-500">Connected</div>
                    )}
                  </div>
                </div>
                {microsoftConnected ? (
                  <button
                    onClick={() => handleDisconnect("microsoft")}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect("microsoft")}
                    className="px-4 py-2 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors whitespace-nowrap"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
