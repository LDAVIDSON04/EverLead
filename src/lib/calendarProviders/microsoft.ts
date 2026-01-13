// src/lib/calendarProviders/microsoft.ts
// Microsoft Graph Calendar API integration for fetching events

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
      // If refresh token is invalid, mark connection as needing reconnection
      if (error.error === "invalid_grant" || error.error === "invalid_request") {
        await supabaseAdmin
          .from("calendar_connections")
          .update({ sync_enabled: false })
          .eq("id", connection.id);
        throw new Error("Refresh token expired or revoked - calendar needs to be reconnected");
      }
      throw new Error(`Failed to refresh Microsoft token: ${JSON.stringify(error)}`);
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

  // Make API call to Microsoft Graph
  const url = new URL(
    `https://graph.microsoft.com/v1.0/me/calendars/${connection.external_calendar_id}/calendarView`
  );
  url.searchParams.set("startDateTime", timeMin);
  url.searchParams.set("endDateTime", timeMax);
  url.searchParams.set("$orderby", "start/dateTime");
  url.searchParams.set("$select", "id,subject,start,end,isAllDay,isCancelled,showAs,location,singleValueExtendedProperties");

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

    // Get start/end times - Microsoft returns ISO strings, normalize them
    // Microsoft can return times with microseconds (.0000000) or timezone offsets
    // Normalize to standard ISO format for consistent parsing
    let startsAt = event.start.dateTime;
    let endsAt = event.end.dateTime;
    
    // If the time has microseconds (7 digits), truncate to milliseconds (3 digits)
    // This ensures consistent parsing across the system
    if (startsAt && startsAt.includes('.')) {
      const parts = startsAt.split('.');
      if (parts[1] && parts[1].length > 3) {
        const timezonePart = parts[1].substring(3);
        startsAt = `${parts[0]}.${parts[1].substring(0, 3)}${timezonePart}`;
      }
    }
    if (endsAt && endsAt.includes('.')) {
      const parts = endsAt.split('.');
      if (parts[1] && parts[1].length > 3) {
        const timezonePart = parts[1].substring(3);
        endsAt = `${parts[0]}.${parts[1].substring(0, 3)}${timezonePart}`;
      }
    }

    // Extract location from Microsoft event
    // Microsoft can have location as a string or an object with displayName/address
    // Handle empty objects and null values properly
    let location: string | null = null;
    if (event.location) {
      if (typeof event.location === 'string') {
        location = event.location.trim() || null;
      } else if (typeof event.location === 'object') {
        // Check if object has any properties (not empty)
        const locationObj = event.location as any;
        if (Object.keys(locationObj).length > 0) {
          if (locationObj.displayName && typeof locationObj.displayName === 'string') {
            location = locationObj.displayName.trim() || null;
          } else if (locationObj.address && typeof locationObj.address === 'string') {
            location = locationObj.address.trim() || null;
          } else if (locationObj.name && typeof locationObj.name === 'string') {
            location = locationObj.name.trim() || null;
          }
        }
        // If object is empty or has no extractable properties, location remains null
      }
    }

    // Extract title/subject from Microsoft event (stored as "subject")
    const title: string | null = event.subject || null;

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
      location, // Include location in the returned event
      title, // Include title in the returned event
    };
  });
}

