// src/lib/calendarSyncAgent.ts
// Calendar sync for agent_id/lead_id schema (old appointments table)

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";

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
      leads (
        first_name,
        last_name,
        full_name,
        email
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

  // Check if token is expired
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    console.warn("Google token expired, refresh not implemented yet");
    return;
  }

  // Get agent's timezone from profile or use default
  const { data: agentProfile } = await supabaseAdmin
    .from("profiles")
    .select("metadata, agent_province")
    .eq("id", appointment.agent_id)
    .maybeSingle();
  
  let agentTimezone = "America/Vancouver"; // Default fallback
  if (agentProfile?.metadata?.timezone) {
    agentTimezone = agentProfile.metadata.timezone;
  } else if (agentProfile?.metadata?.availability?.timezone) {
    agentTimezone = agentProfile.metadata.availability.timezone;
  } else if (agentProfile?.agent_province) {
    // Infer from province
    const province = agentProfile.agent_province.toUpperCase();
    if (province === "BC" || province === "BRITISH COLUMBIA") {
      agentTimezone = "America/Vancouver";
    } else if (province === "AB" || province === "ALBERTA") {
      agentTimezone = "America/Edmonton";
    } else if (province === "SK" || province === "SASKATCHEWAN") {
      agentTimezone = "America/Regina";
    } else if (province === "MB" || province === "MANITOBA") {
      agentTimezone = "America/Winnipeg";
    } else if (province === "ON" || province === "ONTARIO") {
      agentTimezone = "America/Toronto";
    } else if (province === "QC" || province === "QUEBEC") {
      agentTimezone = "America/Montreal";
    }
  }

  // Convert requested_date + requested_window to ISO timestamps
  const dateStr = appointment.requested_date;
  let startHour = 9; // Default to morning
  
  if (appointment.requested_window === "afternoon") {
    startHour = 13; // 1 PM
  } else if (appointment.requested_window === "evening") {
    startHour = 17; // 5 PM
  }
  
  const localDateTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`;
  const localStart = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });
  const localEnd = localStart.plus({ hours: 1 });
  
  const startsAt = localStart.toUTC().toISO();
  const endsAt = localEnd.toUTC().toISO();

  // Get family name from lead
  const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;
  const familyName = lead?.full_name || 
    (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : "Soradin client");
  
  const summary = `Soradin appointment with ${familyName}`;
  const description = `Funeral planning appointment scheduled through Soradin.`;

  // Build Google Calendar event
  const event = {
    summary,
    description,
    start: {
      dateTime: startsAt,
      timeZone: "UTC",
    },
    end: {
      dateTime: endsAt,
      timeZone: "UTC",
    },
    extendedProperties: {
      private: {
        soradinAppointmentId: appointment.id,
      },
    },
  };

  // Make actual API call to Google Calendar
  try {
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
