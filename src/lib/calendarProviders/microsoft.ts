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
  // Check if OAuth credentials are configured
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Microsoft OAuth not configured - MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET required");
  }

  // Refresh token if expired
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    if (!connection.refresh_token) {
      throw new Error("Microsoft access token expired and no refresh token available");
    }

    // Refresh the token
    const refreshResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
        scope: "https://graph.microsoft.com/Calendars.ReadWrite",
      }),
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Failed to refresh Microsoft token: ${JSON.stringify(error)}`);
    }

    const tokens = await refreshResponse.json();
    accessToken = tokens.access_token;
  }

  // Make API call to Microsoft Graph
  const url = new URL(
    `https://graph.microsoft.com/v1.0/me/calendars/${connection.external_calendar_id}/calendarView`
  );
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);
  url.searchParams.set("$orderby", "start/dateTime");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const events = data.value || [];

  return events.map((event: any) => {
    // Extract appointment ID from singleValueExtendedProperties if present
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
}

