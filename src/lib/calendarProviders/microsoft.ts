// src/lib/calendarProviders/microsoft.ts
// Microsoft Graph Calendar API integration for fetching events

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
 * Fetches events from Microsoft Calendar for a given time range
 * @param connection - Calendar connection with access token
 * @param timeMin - Start of time range (ISO string)
 * @param timeMax - End of time range (ISO string)
 * @returns Array of normalized external events
 */
export async function fetchMicrosoftCalendarEvents(
  connection: CalendarConnection,
  timeMin: string,
  timeMax: string
): Promise<ExternalEvent[]> {
  // TODO: Refresh token if expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    throw new Error("Microsoft access token expired - refresh not implemented");
  }

  // TODO: Make actual API call to Microsoft Graph
  // Example implementation:
  /*
  const url = new URL(
    `https://graph.microsoft.com/v1.0/me/calendars/${connection.external_calendar_id}/calendarView`
  );
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);
  url.searchParams.set("$orderby", "start/dateTime");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const events = data.value || [];

  return events.map((event: any) => {
    // Extract appointment ID from singleValueExtendedProperties if present
    // Microsoft uses extended properties differently - you'd need to set this when creating
    const appointmentId =
      event.singleValueExtendedProperties?.find(
        (prop: any) => prop.id === "String {66f5a359-4659-4830-9070-00047ec6ac6e} Name SoradinAppointmentId"
      )?.value;

    // Determine if all-day event
    const isAllDay = event.isAllDay || false;

    // Get start/end times
    const startsAt = event.start.dateTime;
    const endsAt = event.end.dateTime;

    // Map status
    const status =
      event.isCancelled || event.showAs === "free"
        ? "cancelled"
        : "confirmed";

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
    "Microsoft Calendar API not implemented yet - OAuth setup required"
  );
  return [];
}

