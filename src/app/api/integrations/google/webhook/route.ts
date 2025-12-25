// src/app/api/integrations/google/webhook/route.ts
// Google Calendar Push Notifications (Webhooks)
// Receives real-time notifications when calendar events change

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchGoogleCalendarEvents } from "@/lib/calendarProviders/google";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Google Calendar webhook verification token
const WEBHOOK_SECRET = process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret";

/**
 * GET: Verify webhook subscription (Google requires this for initial setup)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    // Google Calendar webhook verification
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

/**
 * POST: Handle webhook notifications from Google Calendar
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret (if configured)
    const authHeader = req.headers.get("x-goog-channel-token");
    if (WEBHOOK_SECRET && authHeader !== WEBHOOK_SECRET) {
      console.warn("Invalid webhook secret");
      // Still process but log warning
    }

    // Get channel information from headers
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    const resourceUri = req.headers.get("x-goog-resource-uri");

    console.log("Google Calendar webhook received:", {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
    });

    // Handle different notification types
    if (resourceState === "sync") {
      // Initial sync notification - fetch all events
      await handleSyncNotification(channelId, resourceUri);
    } else if (resourceState === "exists" || resourceState === "not_exists") {
      // Event was created, updated, or deleted
      await handleEventChange(channelId, resourceUri);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Google Calendar webhook:", error);
    // Still return 200 to prevent Google from retrying
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

/**
 * Handle sync notification - fetch all events for the calendar
 */
async function handleSyncNotification(channelId: string | null, resourceUri: string | null) {
  if (!channelId || !resourceUri) {
    console.warn("Missing channel info for sync notification");
    return;
  }

  // Find the calendar connection by channel_id
  const { data: connection, error } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("provider", "google")
    .eq("webhook_channel_id", channelId)
    .maybeSingle();

  if (error || !connection) {
    console.error("Could not find calendar connection for channel:", channelId);
    return;
  }

  // Fetch all events from the calendar
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await fetchGoogleCalendarEvents(
      connection as CalendarConnection,
      timeMin,
      timeMax
    );

    // Process each event
    for (const event of events) {
      await processExternalEvent(connection as CalendarConnection, event);
    }

    console.log(`Synced ${events.length} events for Google Calendar ${channelId}`);
  } catch (error: any) {
    console.error("Error syncing Google Calendar events:", error);
  }
}

/**
 * Handle event change notification - fetch specific event or all events
 */
async function handleEventChange(channelId: string | null, resourceUri: string | null) {
  if (!channelId || !resourceUri) {
    console.warn("Missing channel info for event change notification");
    return;
  }

  // Find the calendar connection
  const { data: connection, error } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("provider", "google")
    .eq("webhook_channel_id", channelId)
    .maybeSingle();

  if (error || !connection) {
    console.error("Could not find calendar connection for channel:", channelId);
    return;
  }

  // Fetch recent events (last 1 hour to next 30 days) to catch the change
  const now = new Date();
  const timeMin = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1 hour ago
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await fetchGoogleCalendarEvents(
      connection as CalendarConnection,
      timeMin,
      timeMax
    );

    // Process each event (upsert will handle updates)
    for (const event of events) {
      await processExternalEvent(connection as CalendarConnection, event);
    }

    console.log(`Updated events for Google Calendar ${channelId} after change notification`);
  } catch (error: any) {
    console.error("Error updating Google Calendar events:", error);
  }
}

/**
 * Process and store an external event
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

  const { error: upsertError } = await supabaseAdmin
    .from("external_events")
    .upsert(upsertData, {
      onConflict: "specialist_id,provider,provider_event_id",
    });

  if (upsertError) {
    throw new Error(`Failed to upsert external event: ${upsertError.message}`);
  }
}

