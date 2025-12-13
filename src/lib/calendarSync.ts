// src/lib/calendarSync.ts
// One-way sync from Soradin appointments to external calendars (Google, Microsoft)

import { supabaseServer } from "@/lib/supabaseServer";

type Appointment = {
  id: string;
  specialist_id: string;
  family_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  families?: {
    full_name: string | null;
  } | null;
};

type CalendarConnection = {
  id: string;
  specialist_id: string;
  provider: "google" | "microsoft";
  external_calendar_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  sync_enabled: boolean;
};

/**
 * Syncs a Soradin appointment to external calendars (Google, Microsoft)
 * @param appointmentId - The appointment ID to sync
 */
export async function syncAppointmentToCalendars(
  appointmentId: string
): Promise<void> {
  // Load appointment with related data
  const { data: appointment, error: appointmentError } = await supabaseServer
    .from("appointments")
    .select(
      `
      id,
      specialist_id,
      family_id,
      starts_at,
      ends_at,
      status,
      families (
        full_name
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

  // Load active calendar connections for this specialist
  const { data: connections, error: connectionsError } = await supabaseServer
    .from("calendar_connections")
    .select("*")
    .eq("specialist_id", appointment.specialist_id)
    .eq("sync_enabled", true)
    .in("provider", ["google", "microsoft"]);

  if (connectionsError) {
    console.error("Error loading calendar connections:", connectionsError);
    throw new Error("Failed to load calendar connections");
  }

  if (!connections || connections.length === 0) {
    // No active connections, nothing to sync
    return;
  }

  // Sync to each connected calendar
  for (const connection of connections as CalendarConnection[]) {
    try {
      if (connection.provider === "google") {
        await syncToGoogleCalendar(appointment, connection);
      } else if (connection.provider === "microsoft") {
        await syncToMicrosoftCalendar(appointment, connection);
      }
    } catch (error: any) {
      console.error(
        `Error syncing to ${connection.provider} for appointment ${appointmentId}:`,
        error
      );
      // Continue with other connections even if one fails
    }
  }
}

/**
 * Syncs appointment to Google Calendar
 */
async function syncToGoogleCalendar(
  appointment: Appointment,
  connection: CalendarConnection
): Promise<void> {
  // TODO: Refresh access token if expired
  // Check if token is expired and refresh if needed
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    // await refreshGoogleToken(connection);
    console.warn("Google token expired, refresh not implemented yet");
    return;
  }

  const familyName = appointment.families?.full_name || "Soradin client";
  const summary = `Soradin appointment with ${familyName}`;
  const description = `Funeral planning appointment scheduled through Soradin.`;

  // Build Google Calendar event
  const event = {
    summary,
    description,
    start: {
      dateTime: appointment.starts_at,
      timeZone: "UTC",
    },
    end: {
      dateTime: appointment.ends_at,
      timeZone: "UTC",
    },
    // Use extended properties to link back to Soradin appointment
    extendedProperties: {
      private: {
        soradinAppointmentId: appointment.id,
      },
    },
  };

  // TODO: Make actual API call to Google Calendar
  // Example:
  /*
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
  }

  const createdEvent = await response.json();
  const providerEventId = createdEvent.id;
  */

  // Placeholder: In real implementation, use the providerEventId from the API response
  const providerEventId = `google_${appointment.id}_${Date.now()}`;

  // Upsert external_events record
  const { error: upsertError } = await supabaseServer
    .from("external_events")
    .upsert(
      {
        specialist_id: appointment.specialist_id,
        provider: "google",
        provider_event_id: providerEventId,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
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
}

/**
 * Syncs appointment to Microsoft Calendar
 */
async function syncToMicrosoftCalendar(
  appointment: Appointment,
  connection: CalendarConnection
): Promise<void> {
  // TODO: Refresh access token if expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    console.warn("Microsoft token expired, refresh not implemented yet");
    return;
  }

  const familyName = appointment.families?.full_name || "Soradin client";
  const subject = `Soradin appointment with ${familyName}`;
  const body = {
    contentType: "HTML",
    content: `<p>Funeral planning appointment scheduled through Soradin.</p>`,
  };

  // Build Microsoft Graph Calendar event
  const event = {
    subject,
    body,
    start: {
      dateTime: appointment.starts_at,
      timeZone: "UTC",
    },
    end: {
      dateTime: appointment.ends_at,
      timeZone: "UTC",
    },
    // TODO: Add Teams meeting link if desired
    // isOnlineMeeting: true,
    // onlineMeetingProvider: "teamsForBusiness",
  };

  // TODO: Make actual API call to Microsoft Graph
  // Example:
  /*
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${connection.external_calendar_id}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
  }

  const createdEvent = await response.json();
  const providerEventId = createdEvent.id;
  */

  // Placeholder: In real implementation, use the providerEventId from the API response
  const providerEventId = `microsoft_${appointment.id}_${Date.now()}`;

  // Upsert external_events record
  const { error: upsertError } = await supabaseServer
    .from("external_events")
    .upsert(
      {
        specialist_id: appointment.specialist_id,
        provider: "microsoft",
        provider_event_id: providerEventId,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
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
}

/**
 * Deletes external calendar events for a cancelled appointment
 * @param appointmentId - The appointment ID to delete events for
 */
export async function deleteExternalEventsForAppointment(
  appointmentId: string
): Promise<void> {
  // Find external events linked to this appointment
  const { data: externalEvents, error: fetchError } = await supabaseServer
    .from("external_events")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("is_soradin_created", true);

  if (fetchError) {
    console.error("Error loading external events:", fetchError);
    throw new Error("Failed to load external events");
  }

  if (!externalEvents || externalEvents.length === 0) {
    // No external events to delete
    return;
  }

  // Load calendar connections for each event
  for (const event of externalEvents) {
    try {
      const { data: connection, error: connectionError } = await supabaseServer
        .from("calendar_connections")
        .select("*")
        .eq("specialist_id", event.specialist_id)
        .eq("provider", event.provider)
        .single();

      if (connectionError || !connection) {
        console.warn(
          `Calendar connection not found for event ${event.id}, marking as cancelled`
        );
        // Mark as cancelled in DB
        await supabaseServer
          .from("external_events")
          .update({ status: "cancelled" })
          .eq("id", event.id);
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
      await supabaseServer.from("external_events").delete().eq("id", event.id);
    } catch (error: any) {
      console.error(
        `Error deleting external event ${event.id} from ${event.provider}:`,
        error
      );
      // Mark as cancelled in DB even if deletion fails
      await supabaseServer
        .from("external_events")
        .update({ status: "cancelled" })
        .eq("id", event.id);
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
  // TODO: Refresh token if expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    console.warn("Google token expired, refresh not implemented yet");
    return;
  }

  // TODO: Make actual API call to delete from Google Calendar
  /*
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events/${event.provider_event_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    // 404 is OK (event already deleted)
    const error = await response.json();
    throw new Error(`Google Calendar API error: ${JSON.stringify(error)}`);
  }
  */
}

/**
 * Deletes event from Microsoft Calendar
 */
async function deleteFromMicrosoftCalendar(
  event: any,
  connection: CalendarConnection
): Promise<void> {
  // TODO: Refresh token if expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    // TODO: Implement token refresh
    console.warn("Microsoft token expired, refresh not implemented yet");
    return;
  }

  // TODO: Make actual API call to delete from Microsoft Graph
  /*
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${connection.external_calendar_id}/events/${event.provider_event_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    // 404 is OK (event already deleted)
    const error = await response.json();
    throw new Error(`Microsoft Graph API error: ${JSON.stringify(error)}`);
  }
  */
}

