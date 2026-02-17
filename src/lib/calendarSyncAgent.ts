// src/lib/calendarSyncAgent.ts
// Calendar sync for agent_id/lead_id schema (old appointments table)

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";
import { getAgentTimezone, CanadianTimezone } from "@/lib/timezone";

type Appointment = {
  id: string;
  agent_id: string;
  lead_id: string;
  requested_date: string;
  requested_window: "morning" | "afternoon" | "evening";
  status: string;
  leads?: {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
  } | null;
};

type CalendarConnection = {
  id: string;
  specialist_id: string; // Note: calendar_connections uses specialist_id, but we'll map agent_id to it
  provider: "google" | "microsoft";
  external_calendar_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  sync_enabled: boolean;
};

/**
 * Syncs an appointment (agent_id/lead_id schema) to Google Calendar
 */
export async function syncAgentAppointmentToGoogleCalendar(
  appointmentId: string
): Promise<void> {
  // Load appointment with lead data
  const { data: appointment, error: appointmentError } = await supabaseAdmin
    .from("appointments")
    .select(
      `
      id,
      agent_id,
      lead_id,
      requested_date,
      requested_window,
      status,
      confirmed_at,
      leads (
        first_name,
        last_name,
        full_name,
        email,
        additional_notes
      )
    `
    )
    .eq("id", appointmentId)
    .single();

  if (appointmentError || !appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  // Only sync confirmed appointments
  if (appointment.status !== "confirmed") {
    return;
  }

  // Check if agent has Google Calendar connected
  // Note: calendar_connections uses specialist_id, but we have agent_id
  // For now, we'll try to find by agent_id (assuming they're the same)
  const { data: connections, error: connectionsError } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("specialist_id", appointment.agent_id)
    .eq("provider", "google")
    .eq("sync_enabled", true)
    .maybeSingle();

  if (connectionsError) {
    console.error("Error loading calendar connections:", connectionsError);
    return;
  }

  if (!connections) {
    // No active connection
    return;
  }

  const connection = connections as CalendarConnection;

  // Check if token is expired and refresh if needed
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    console.log("Google token expired, attempting to refresh...");
    
    if (!connection.refresh_token) {
      console.warn("No refresh token available, cannot refresh Google token");
      return;
    }

    // Refresh the token
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn("Google OAuth credentials not configured, cannot refresh token");
      return;
    }

    try {
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
        console.error("Failed to refresh Google token:", error);
        return;
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      const expiresIn = tokens.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with new token
      const { error: updateError } = await supabaseAdmin
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", connection.id);

      if (updateError) {
        console.error("Failed to update refreshed token:", updateError);
        // Continue with the new token anyway
      } else {
        console.log("✅ Successfully refreshed Google token");
      }
    } catch (error: any) {
      console.error("Error refreshing Google token:", error);
      return;
    }
  }

  // Get agent's timezone from profile or use default
  const { data: agentProfile } = await supabaseAdmin
    .from("profiles")
    .select("metadata, agent_province")
    .eq("id", appointment.agent_id)
    .maybeSingle();
  
  // Use centralized timezone utility
  const agentTimezone = getAgentTimezone(agentProfile?.metadata, agentProfile?.agent_province || null) as CanadianTimezone;

  // Use confirmed_at (exact booking time) if available, otherwise infer from requested_window
  let startsAt: string;
  let endsAt: string;
  
  // Get family name from lead (need this for duration check)
  const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;
  
  if (appointment.confirmed_at) {
    // Use the exact booking time from confirmed_at
    // Convert from UTC to agent's local timezone
    const confirmedDateUTC = DateTime.fromISO(appointment.confirmed_at, { zone: "utc" });
    const confirmedDateLocal = confirmedDateUTC.setZone(agentTimezone);
    
    // Get appointment length - check for agent-created events first (duration in additional_notes)
    let appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
      ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
      : 60;
    
    // Check if this is an agent-created event (duration stored in lead's additional_notes)
    if (lead?.additional_notes) {
      const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
      if (durationMatch) {
        appointmentLengthMinutes = parseInt(durationMatch[1], 10);
      }
    }
    
    const confirmedEndLocal = confirmedDateLocal.plus({ minutes: appointmentLengthMinutes });
    
    // Format as ISO string without timezone offset (Google Calendar uses the timeZone field)
    // Format: "2025-12-19T14:00:00" (local time, timeZone will be "America/Vancouver")
    startsAt = confirmedDateLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    endsAt = confirmedEndLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  } else {
    // Fallback: infer from requested_window (for old appointments without confirmed_at)
    const dateStr = appointment.requested_date;
    let startHour = 9; // Default to morning
    
    if (appointment.requested_window === "afternoon") {
      startHour = 13; // 1 PM
    } else if (appointment.requested_window === "evening") {
      startHour = 17; // 5 PM
    }
    
    const localDateTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`;
    const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
    
    // Get appointment length - check for agent-created events first (duration in additional_notes)
    let appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
      ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
      : 60;
    
    // Check if this is an agent-created event (duration stored in lead's additional_notes)
    if (lead?.additional_notes) {
      const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
      if (durationMatch) {
        appointmentLengthMinutes = parseInt(durationMatch[1], 10);
      }
    }
    
    const localEnd = localStart.plus({ minutes: appointmentLengthMinutes });
    
    // Format as ISO string without timezone offset
    startsAt = localStart.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    endsAt = localEnd.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  }
  
  const familyName = lead?.full_name || 
    (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : "Soradin client");
  
  const summary = `Soradin appointment with ${familyName}`;
  const description = `Funeral planning appointment scheduled through Soradin.`;

  // Build Google Calendar event
  // IMPORTANT: Use agent's timezone, not UTC, so Google Calendar displays the correct local time
  const event = {
    summary,
    description,
    start: {
      dateTime: startsAt,
      timeZone: agentTimezone, // Use agent's actual timezone (e.g., "America/Vancouver")
    },
    end: {
      dateTime: endsAt,
      timeZone: agentTimezone, // Use agent's actual timezone
    },
    extendedProperties: {
      private: {
        soradinAppointmentId: appointment.id,
      },
    },
  };
  
  console.log("📅 Creating Google Calendar event:", {
    summary,
    startsAt,
    endsAt,
    agentTimezone,
    appointmentId: appointment.id,
  });

  // Make actual API call to Google Calendar
  // Use the refreshed token if we refreshed it, otherwise use the original
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Google Calendar API error:", error);
      throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
    }

    const createdEvent = await response.json();
    const providerEventId = createdEvent.id;

    // Upsert external_events record
    const { error: upsertError } = await supabaseAdmin
      .from("external_events")
      .upsert(
        {
          specialist_id: appointment.agent_id, // Map agent_id to specialist_id for external_events
          provider: "google",
          provider_event_id: providerEventId,
          starts_at: startsAt,
          ends_at: endsAt,
          is_all_day: false,
          status: "confirmed",
          is_soradin_created: true,
          appointment_id: appointment.id,
        },
        {
          onConflict: "specialist_id,provider,provider_event_id",
        }
      );

    if (upsertError) {
      console.error("Error saving external event:", upsertError);
      throw new Error("Failed to save external event record");
    }

    console.log(`✅ Successfully synced appointment ${appointmentId} to Google Calendar`);
  } catch (error: any) {
    console.error(`Error syncing appointment ${appointmentId} to Google Calendar:`, error);
    throw error;
  }
}

/**
 * Syncs an appointment (agent_id/lead_id schema) to Microsoft Calendar
 */
export async function syncAgentAppointmentToMicrosoftCalendar(
  appointmentId: string
): Promise<void> {
  // Load appointment with lead data
  const { data: appointment, error: appointmentError } = await supabaseAdmin
    .from("appointments")
    .select(
      `
      id,
      agent_id,
      lead_id,
      requested_date,
      requested_window,
      status,
      confirmed_at,
      leads (
        first_name,
        last_name,
        full_name,
        email,
        additional_notes
      )
    `
    )
    .eq("id", appointmentId)
    .single();

  if (appointmentError || !appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  // Only sync confirmed appointments
  if (appointment.status !== "confirmed") {
    return;
  }

  // Check if agent has Microsoft Calendar connected
  const { data: connections, error: connectionsError } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("specialist_id", appointment.agent_id)
    .eq("provider", "microsoft")
    .eq("sync_enabled", true)
    .maybeSingle();

  if (connectionsError) {
    console.error("Error loading calendar connections:", connectionsError);
    return;
  }

  if (!connections) {
    // No active connection
    return;
  }

  const connection = connections as CalendarConnection;

  // Check if token is expired and refresh if needed
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    console.log("Microsoft token expired, attempting to refresh...");
    
    if (!connection.refresh_token) {
      console.warn("No refresh token available, cannot refresh Microsoft token");
      return;
    }

    // Refresh the token
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

    if (!clientId || !clientSecret) {
      console.warn("Microsoft OAuth credentials not configured, cannot refresh token");
      return;
    }

    try {
      const refreshResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refresh_token,
            grant_type: "refresh_token",
            scope: "https://graph.microsoft.com/Calendars.ReadWrite offline_access",
          }),
        }
      );

      if (!refreshResponse.ok) {
        const error = await refreshResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to refresh Microsoft token:", error);
        return;
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      const expiresIn = tokens.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with new token
      const { error: updateError } = await supabaseAdmin
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
          refresh_token: tokens.refresh_token || connection.refresh_token, // Use new refresh token if provided
        })
        .eq("id", connection.id);

      if (updateError) {
        console.error("Failed to update refreshed token:", updateError);
        // Continue with the new token anyway
      } else {
        console.log("✅ Successfully refreshed Microsoft token");
      }
    } catch (error: any) {
      console.error("Error refreshing Microsoft token:", error);
      return;
    }
  }

  // Get agent's timezone from profile or use default
  const { data: agentProfile } = await supabaseAdmin
    .from("profiles")
    .select("metadata, agent_province")
    .eq("id", appointment.agent_id)
    .maybeSingle();
  
  // Use centralized timezone utility
  const agentTimezone = getAgentTimezone(agentProfile?.metadata, agentProfile?.agent_province || null) as CanadianTimezone;

  // Use confirmed_at (exact booking time) if available, otherwise infer from requested_window
  let startsAt: string;
  let endsAt: string;
  
  // Get family name from lead (need this for duration check)
  const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;
  
  if (appointment.confirmed_at) {
    // Use the exact booking time from confirmed_at
    // Convert from UTC to agent's local timezone
    const confirmedDateUTC = DateTime.fromISO(appointment.confirmed_at, { zone: "utc" });
    const confirmedDateLocal = confirmedDateUTC.setZone(agentTimezone);
    
    // Get appointment length - check for agent-created events first (duration in additional_notes)
    let appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
      ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
      : 60;
    
    // Check if this is an agent-created event (duration stored in lead's additional_notes)
    if (lead?.additional_notes) {
      const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
      if (durationMatch) {
        appointmentLengthMinutes = parseInt(durationMatch[1], 10);
      }
    }
    
    const confirmedEndLocal = confirmedDateLocal.plus({ minutes: appointmentLengthMinutes });
    
    // Format as ISO string without timezone offset (Microsoft Calendar uses the timeZone field)
    // Format: "2025-12-19T14:00:00" (local time, timeZone will be "America/Vancouver")
    startsAt = confirmedDateLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    endsAt = confirmedEndLocal.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  } else {
    // Fallback: infer from requested_window (for old appointments without confirmed_at)
    const dateStr = appointment.requested_date;
    let startHour = 9; // Default to morning
    
    if (appointment.requested_window === "afternoon") {
      startHour = 13; // 1 PM
    } else if (appointment.requested_window === "evening") {
      startHour = 17; // 5 PM
    }
    
    const localDateTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`;
    const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
    
    // Get appointment length - check for agent-created events first (duration in additional_notes)
    let appointmentLengthMinutes = agentProfile?.metadata?.availability?.appointmentLength 
      ? parseInt(agentProfile.metadata.availability.appointmentLength, 10) 
      : 60;
    
    // Check if this is an agent-created event (duration stored in lead's additional_notes)
    if (lead?.additional_notes) {
      const durationMatch = lead.additional_notes.match(/^EVENT_DURATION:(\d+)\|/);
      if (durationMatch) {
        appointmentLengthMinutes = parseInt(durationMatch[1], 10);
      }
    }
    
    const localEnd = localStart.plus({ minutes: appointmentLengthMinutes });
    
    // Format as ISO string without timezone offset
    startsAt = localStart.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    endsAt = localEnd.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  }
  
  const familyName = lead?.full_name || 
    (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : "Soradin client");
  
  const subject = `Soradin appointment with ${familyName}`;
  const body = `Funeral planning appointment scheduled through Soradin.`;

  // Build Microsoft Calendar event
  // IMPORTANT: Use agent's timezone, not UTC, so Microsoft Calendar displays the correct local time
  const event = {
    subject,
    body: {
      contentType: "HTML",
      content: body,
    },
    start: {
      dateTime: startsAt,
      timeZone: agentTimezone, // Use agent's actual timezone (e.g., "America/Vancouver")
    },
    end: {
      dateTime: endsAt,
      timeZone: agentTimezone, // Use agent's actual timezone
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
    singleValueExtendedProperties: [
      {
        id: "String {66f5a359-4659-4830-9070-00047ec6ac6e} Name SoradinAppointmentId",
        value: appointment.id,
      },
    ],
  };
  
  console.log("📅 Creating Microsoft Calendar event:", {
    subject,
    startsAt,
    endsAt,
    agentTimezone,
    appointmentId: appointment.id,
  });

  // Make actual API call to Microsoft Calendar
  // Use the calendar ID from connection, or default to primary calendar
  const calendarId = connection.external_calendar_id || "calendar";
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("Microsoft Calendar API error:", error);
      throw new Error(`Microsoft Calendar API error: ${JSON.stringify(error)}`);
    }

    const createdEvent = await response.json();
    const providerEventId = createdEvent.id;

    // Upsert external_events record
    const { error: upsertError } = await supabaseAdmin
      .from("external_events")
      .upsert(
        {
          specialist_id: appointment.agent_id, // Map agent_id to specialist_id for external_events
          provider: "microsoft",
          provider_event_id: providerEventId,
          starts_at: startsAt,
          ends_at: endsAt,
          is_all_day: false,
          status: "confirmed",
          is_soradin_created: true,
          appointment_id: appointment.id,
        },
        {
          onConflict: "specialist_id,provider,provider_event_id",
        }
      );

    if (upsertError) {
      console.error("Error saving external event:", upsertError);
      throw new Error("Failed to save external event record");
    }

    console.log(`✅ Successfully synced appointment ${appointmentId} to Microsoft Calendar`);
  } catch (error: any) {
    console.error(`Error syncing appointment ${appointmentId} to Microsoft Calendar:`, error);
    throw error;
  }
}

/**
 * Deletes external calendar events for a cancelled appointment (agent_id/lead_id schema)
 * Removes ALL rows for this appointment (is_soradin_created true and false) so deleted
 * events never reappear as "external" duplicates after sync.
 * @param appointmentId - The appointment ID to delete events for
 */
export async function deleteExternalEventsForAgentAppointment(
  appointmentId: string
): Promise<void> {
  // Find ALL external events linked to this appointment (any is_soradin_created)
  const { data: externalEvents, error: fetchError } = await supabaseAdmin
    .from("external_events")
    .select("*")
    .eq("appointment_id", appointmentId);

  if (fetchError) {
    console.error("Error loading external events:", fetchError);
    throw new Error("Failed to load external events");
  }

  if (!externalEvents || externalEvents.length === 0) {
    // No external events to delete
    console.log(`No external events found for appointment ${appointmentId}`);
    return;
  }

  // Load calendar connections for each event
  for (const event of externalEvents) {
    try {
      const { data: connection, error: connectionError } = await supabaseAdmin
        .from("calendar_connections")
        .select("*")
        .eq("specialist_id", event.specialist_id)
        .eq("provider", event.provider)
        .single();

      if (connectionError || !connection) {
        console.warn(
          `Calendar connection not found for event ${event.id}, removing from DB`
        );
        // Always remove row so sync cannot revive it
        await supabaseAdmin.from("external_events").delete().eq("id", event.id);
        continue;
      }

      // Delete from external calendar
      if (event.provider === "google") {
        await deleteFromGoogleCalendar(event, connection as CalendarConnection);
      } else if (event.provider === "microsoft") {
        await deleteFromMicrosoftCalendar(
          event,
          connection as CalendarConnection
        );
      }

      // Delete or mark as cancelled in our DB
      await supabaseAdmin.from("external_events").delete().eq("id", event.id);
      console.log(`✅ Deleted external event ${event.id} from ${event.provider} calendar`);
    } catch (error: any) {
      console.error(
        `Error deleting external event ${event.id} from ${event.provider}:`,
        error
      );
      // Always remove our row so sync cannot re-show this event; provider may still have it until next manual delete/sync
      await supabaseAdmin.from("external_events").delete().eq("id", event.id);
    }
  }
}

/**
 * Deletes event from Google Calendar
 */
async function deleteFromGoogleCalendar(
  event: any,
  connection: CalendarConnection
): Promise<void> {
  // Check if token is expired and refresh if needed
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    console.log("Google token expired, attempting to refresh...");
    
    if (!connection.refresh_token) {
      console.warn("No refresh token available, cannot refresh Google token");
      throw new Error("Google token expired and no refresh token available");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    try {
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
        throw new Error(`Failed to refresh Google token: ${JSON.stringify(error)}`);
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      const expiresIn = tokens.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with new token
      await supabaseAdmin
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("id", connection.id);
    } catch (error: any) {
      console.error("Error refreshing Google token:", error);
      throw error;
    }
  }

  // Make actual API call to delete from Google Calendar
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events/${event.provider_event_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    // 404 is OK (event already deleted)
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
  }

  console.log(`✅ Successfully deleted event ${event.provider_event_id} from Google Calendar`);
}

/**
 * Deletes event from Microsoft Calendar
 */
async function deleteFromMicrosoftCalendar(
  event: any,
  connection: CalendarConnection
): Promise<void> {
  // Check if token is expired and refresh if needed
  let accessToken = connection.access_token;
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    console.log("Microsoft token expired, attempting to refresh...");
    
    if (!connection.refresh_token) {
      console.warn("No refresh token available, cannot refresh Microsoft token");
      throw new Error("Microsoft token expired and no refresh token available");
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";

    if (!clientId || !clientSecret) {
      throw new Error("Microsoft OAuth credentials not configured");
    }

    try {
      const refreshResponse = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: connection.refresh_token,
            grant_type: "refresh_token",
            scope: "https://graph.microsoft.com/Calendars.ReadWrite offline_access",
          }),
        }
      );

      if (!refreshResponse.ok) {
        const error = await refreshResponse.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(`Failed to refresh Microsoft token: ${JSON.stringify(error)}`);
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      const expiresIn = tokens.expires_in || 3600;
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update the connection with new token
      await supabaseAdmin
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt.toISOString(),
          refresh_token: tokens.refresh_token || connection.refresh_token,
        })
        .eq("id", connection.id);
    } catch (error: any) {
      console.error("Error refreshing Microsoft token:", error);
      throw error;
    }
  }

  // Make actual API call to delete from Microsoft Graph
  const calendarId = connection.external_calendar_id || "calendar";
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events/${event.provider_event_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    // 404 is OK (event already deleted)
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
  }

  console.log(`✅ Successfully deleted event ${event.provider_event_id} from Microsoft Calendar`);
}

/**
 * Deletes a single external event by row id (for agent "delete from schedule").
 * Removes from Google/Microsoft calendar when possible, then always removes our row
 * so the event never reappears on sync.
 */
export async function deleteSingleExternalEvent(
  externalEventId: string,
  specialistId: string
): Promise<void> {
  const { data: event, error: fetchError } = await supabaseAdmin
    .from("external_events")
    .select("*")
    .eq("id", externalEventId)
    .single();

  if (fetchError || !event) {
    throw new Error("External event not found");
  }

  if (event.specialist_id !== specialistId) {
    throw new Error("Not allowed to delete this event");
  }

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("specialist_id", event.specialist_id)
    .eq("provider", event.provider)
    .single();

  try {
    if (!connectionError && connection) {
      if (event.provider === "google") {
        await deleteFromGoogleCalendar(event, connection as CalendarConnection);
      } else if (event.provider === "microsoft") {
        await deleteFromMicrosoftCalendar(event, connection as CalendarConnection);
      }
    }
  } catch (err: any) {
    console.error("Error deleting from provider calendar (will still remove from our DB):", err);
  }

  const { error: deleteError } = await supabaseAdmin
    .from("external_events")
    .delete()
    .eq("id", externalEventId);

  if (deleteError) {
    console.error("Error deleting external_events row:", deleteError);
    throw new Error("Failed to remove event from schedule");
  }

  console.log(`✅ Deleted external event ${externalEventId} from schedule and provider`);
}
