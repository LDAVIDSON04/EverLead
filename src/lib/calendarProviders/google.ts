// src/lib/calendarProviders/google.ts
// Google Calendar API integration for fetching events

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
  // TODO: Refresh token if expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    throw new Error("Google access token expired - refresh not implemented");
  }

  // TODO: Make actual API call to Google Calendar
  // Example implementation:
  /*
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events`
  );
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
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
  */

  // Placeholder: Return empty array until OAuth is implemented
  console.warn(
    "Google Calendar API not implemented yet - OAuth setup required"
  );
  return [];
}

