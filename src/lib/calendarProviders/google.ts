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
  location?: string | null; // Location/city from the calendar event
  title?: string | null; // Event title/subject from the calendar
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

  return events
    .filter((event: any) => {
      // Only sync events that block time. "transparent" = "Show as: Free" in Google
      // (e.g. availability windows); those should not block slots in Soradin.
      if (event.transparency === "transparent") return false;
      return true;
    })
    .map((event: any) => {
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

      // Extract location from Google event
      // Google stores location as a simple string
      const location: string | null = event.location || null;

      // Extract title/subject from Google event (stored as "summary")
      const title: string | null = event.summary || null;

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
        location, // Include location in the returned event
        title, // Include title in the returned event
      };
    });
}

/** Busy window from Google Freebusy API (respects "Show as: Free" – only opaque events) */
export type GoogleBusyWindow = { start: string; end: string };

/**
 * Fetches busy windows from Google Calendar Freebusy API.
 * Only returns times Google considers "busy" (opaque events). Events marked "Show as: Free" are excluded.
 * Use this for availability so we align with Calendly and Google's own busy/free semantics.
 */
export async function fetchGoogleCalendarFreebusy(
  connection: CalendarConnection,
  timeMin: string,
  timeMax: string
): Promise<GoogleBusyWindow[]> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("[Google Freebusy] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET, skipping");
    return [];
  }

  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    if (!connection.refresh_token) {
      console.warn("[Google Freebusy] Token expired and no refresh_token");
      return [];
    }
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    if (!refreshResponse.ok) {
      const errText = await refreshResponse.text();
      console.warn("[Google Freebusy] Token refresh failed:", refreshResponse.status, errText);
      return [];
    }
    const tokens = await refreshResponse.json();
    accessToken = tokens.access_token;
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : connection.expires_at;
    await supabaseAdmin
      .from("calendar_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || connection.refresh_token,
        expires_at: expiresAt,
      })
      .eq("id", connection.id);
  }

  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: connection.external_calendar_id }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.warn("[Google Freebusy] API error:", response.status, errBody);
    return [];
  }
  const data = await response.json();
  const calendarData = data.calendars?.[connection.external_calendar_id];
  const busy = calendarData?.busy;
  if (!Array.isArray(busy)) {
    console.warn("[Google Freebusy] No calendars or busy array for id:", connection.external_calendar_id);
    return [];
  }
  return busy.map((b: { start?: string; end?: string }) => ({
    start: b.start ?? "",
    end: b.end ?? "",
  })).filter((w: GoogleBusyWindow) => w.start && w.end);
}

