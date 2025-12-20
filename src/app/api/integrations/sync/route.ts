// src/app/api/integrations/sync/route.ts
// Two-way calendar sync job (polling-based)
// This should be triggered by a cron job (e.g., Vercel Cron every 5-15 minutes)

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { fetchGoogleCalendarEvents } from "@/lib/calendarProviders/google";
import { fetchMicrosoftCalendarEvents } from "@/lib/calendarProviders/microsoft";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Optional: Add authentication/authorization check for cron jobs
// Vercel Cron sends a header you can verify
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Optional: Verify this is a legitimate cron request
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate time window (next 30 days)
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Load all active calendar connections
    const { data: connections, error: connectionsError } = await supabaseServer
      .from("calendar_connections")
      .select("*")
      .eq("sync_enabled", true)
      .in("provider", ["google", "microsoft"]);

    if (connectionsError) {
      console.error("Error loading calendar connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to load calendar connections" },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: "No active calendar connections to sync",
        synced: 0,
      });
    }

    let totalSynced = 0;
    const errors: string[] = [];

    // Sync each connection
    for (const connection of connections as CalendarConnection[]) {
      try {
        await syncConnection(connection, timeMin, timeMax);
        totalSynced++;
      } catch (error: any) {
        const errorMsg = `Error syncing ${connection.provider} for specialist ${connection.specialist_id}: ${error.message}`;
        console.error(errorMsg, error);
        errors.push(errorMsg);
        // Continue with other connections even if one fails
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      synced: totalSynced,
      total: connections.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in /api/integrations/sync:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Syncs a single calendar connection
 */
async function syncConnection(
  connection: CalendarConnection,
  timeMin: string,
  timeMax: string
): Promise<void> {
  // Fetch events from external calendar
  let externalEvents;
  try {
    if (connection.provider === "google") {
      externalEvents = await fetchGoogleCalendarEvents(
        connection,
        timeMin,
        timeMax
      );
    } else if (connection.provider === "microsoft") {
      externalEvents = await fetchMicrosoftCalendarEvents(
        connection,
        timeMin,
        timeMax
      );
    } else {
      throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  } catch (error: any) {
    // If OAuth not configured, skip this connection gracefully
    if (error.message.includes("OAuth not configured") || 
        error.message.includes("not configured")) {
      console.warn(
        `Skipping ${connection.provider} sync - OAuth not configured: ${error.message}`
      );
      return;
    }
    // For other errors, log but don't fail the entire sync job
    console.error(
      `Error fetching ${connection.provider} calendar events:`,
      error.message
    );
    throw error;
  }

  // Process each external event
  for (const event of externalEvents) {
    try {
      await processExternalEvent(connection, event);
    } catch (error: any) {
      console.error(
        `Error processing event ${event.providerEventId}:`,
        error
      );
      // Continue with other events even if one fails
    }
  }

  // Clean up old events outside the sync window (optional)
  // This keeps the external_events table from growing indefinitely
  await cleanupOldEvents(connection.specialist_id, connection.provider, timeMin);
}

/**
 * Processes a single external event and upserts it to external_events table
 */
async function processExternalEvent(
  connection: CalendarConnection,
  event: {
    providerEventId: string;
    startsAt: string;
    endsAt: string;
    isAllDay: boolean;
    status: "confirmed" | "cancelled";
    appointmentId?: string;
  }
): Promise<void> {
  const isSoradinCreated = !!event.appointmentId;

  // Upsert external_events record
  const { data: existingEvent, error: fetchError } = await supabaseServer
    .from("external_events")
    .select("id, appointment_id, starts_at, ends_at, status")
    .eq("specialist_id", connection.specialist_id)
    .eq("provider", connection.provider)
    .eq("provider_event_id", event.providerEventId)
    .single();

  // Prepare upsert data
  const upsertData: any = {
    specialist_id: connection.specialist_id,
    provider: connection.provider,
    provider_event_id: event.providerEventId,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    is_all_day: event.isAllDay,
    status: event.status,
    is_soradin_created: isSoradinCreated,
    appointment_id: event.appointmentId || null,
  };

  // Upsert the event
  const { error: upsertError } = await supabaseServer
    .from("external_events")
    .upsert(upsertData, {
      onConflict: "specialist_id,provider,provider_event_id",
    });

  if (upsertError) {
    throw new Error(`Failed to upsert external event: ${upsertError.message}`);
  }

  // ============================================
  // STRETCH GOAL: Handle external edits to Soradin-created events
  // ============================================
  // If this is a Soradin-created event that was edited externally,
  // we can optionally sync those changes back to the Soradin appointment.
  // 
  // POLICY DECISION: You can configure whether external edits are allowed:
  // - If ALLOW_EXTERNAL_EDITS=true: Sync time changes and cancellations back
  // - If ALLOW_EXTERNAL_EDITS=false: Only use external events for busy-time blocking
  // ============================================

  if (isSoradinCreated && event.appointmentId) {
    const allowExternalEdits =
      process.env.ALLOW_EXTERNAL_EDITS === "true" || false;

    if (allowExternalEdits) {
      // Check if this is an update to an existing event
      if (existingEvent) {
        const timeChanged =
          existingEvent.starts_at !== event.startsAt ||
          existingEvent.ends_at !== event.endsAt;
        const statusChanged = existingEvent.status !== event.status;

        // If time changed, update the Soradin appointment
        if (timeChanged) {
          const { error: updateError } = await supabaseServer
            .from("appointments")
            .update({
              starts_at: event.startsAt,
              ends_at: event.endsAt,
            })
            .eq("id", event.appointmentId);

          if (updateError) {
            console.error(
              `Failed to sync time change for appointment ${event.appointmentId}:`,
              updateError
            );
          } else {
            console.log(
              `Synced time change from ${connection.provider} to appointment ${event.appointmentId}`
            );
          }
        }

        // If status changed to cancelled, cancel the Soradin appointment
        if (statusChanged && event.status === "cancelled") {
          const { error: cancelError } = await supabaseServer
            .from("appointments")
            .update({
              status: "cancelled",
              notes: `Cancelled externally via ${connection.provider} calendar on ${new Date().toISOString()}. ${existingEvent.status || ""}`.trim(),
            })
            .eq("id", event.appointmentId);

          if (cancelError) {
            console.error(
              `Failed to sync cancellation for appointment ${event.appointmentId}:`,
              cancelError
            );
          } else {
            console.log(
              `Synced cancellation from ${connection.provider} to appointment ${event.appointmentId}`
            );
          }
        }
      }
    }
  }
}

/**
 * Cleans up old external events outside the sync window
 */
async function cleanupOldEvents(
  specialistId: string,
  provider: string,
  timeMin: string
): Promise<void> {
  // Delete events that are older than the sync window and not linked to appointments
  const { error } = await supabaseServer
    .from("external_events")
    .delete()
    .eq("specialist_id", specialistId)
    .eq("provider", provider)
    .lt("ends_at", timeMin)
    .is("appointment_id", null);

  if (error) {
    console.error("Error cleaning up old events:", error);
    // Don't throw - this is a cleanup operation
  }
}

