// src/lib/calendarProviders/google.ts
// Google Calendar API integration for fetching events

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { CalendarConnection } from "./types";

export type ExternalEvent = {
  providerEventId: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  isAllDay: boolean;
  status: "confirmed" | "cancelled";
  appointmentId?: string; // from our marker if present
};

/**
 * Fetches events from Google Calendar for a given time range
 * @param connection - Calendar connection with access token
 * @param timeMin - Start of time range (ISO string)
 * @param timeMax - End of time range (ISO string)
 * @returns Array of normalized external events
 */
export async function fetchGoogleCalendarEvents(
  connection: CalendarConnection,
  timeMin: string,
  timeMax: string
): Promise<ExternalEvent[]> {
  // Check if OAuth credentials are configured
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
  }

  // Refresh token if expired
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    if (!connection.refresh_token) {
      throw new Error("Google access token expired and no refresh token available");
    }

    // Refresh the token
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.json().catch(() => ({ error: "Unknown error" }));
      // If refresh token is invalid, mark connection as needing reconnection
      if (error.error === "invalid_grant") {
        await supabaseAdmin
          .from("calendar_connections")
          .update({ sync_enabled: false })
          .eq("id", connection.id);
        throw new Error("Refresh token expired or revoked - calendar needs to be reconnected");
      }
      throw new Error(`Failed to refresh Google token: ${JSON.stringify(error)}`);
    }

    const tokens = await refreshResponse.json();
    accessToken = tokens.access_token;
    
    // Save refreshed tokens back to database
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : connection.expires_at;
    
    await supabaseAdmin
      .from("calendar_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || connection.refresh_token, // Keep existing if not provided
        expires_at: expiresAt,
      })
      .eq("id", connection.id);
  }

  // Make API call to Google Calendar
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const events = data.items || [];

  return events.map((event: any) => {
    // Extract appointment ID from extended properties if present
    const appointmentId =
      event.extendedProperties?.private?.soradinAppointmentId;

    // Determine if all-day event
    const isAllDay = !!event.start.date; // date field means all-day

    // Get start/end times
    const startsAt = isAllDay
      ? `${event.start.date}T00:00:00Z`
      : event.start.dateTime;
    const endsAt = isAllDay
      ? `${event.end.date}T00:00:00Z`
      : event.end.dateTime;

    // Map status
    const status =
      event.status === "cancelled" ? "cancelled" : "confirmed";

    return {
      providerEventId: event.id,
      startsAt,
      endsAt,
      isAllDay,
      status,
      appointmentId,
    };
  });
}

