// src/app/api/integrations/google/webhook/route.ts
// Google Calendar Push Notifications (Webhooks)
// Receives real-time notifications when calendar events change

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchGoogleCalendarEvents } from "@/lib/calendarProviders/google";
import { isEventBlocklistedAndRemove } from "@/lib/calendarSyncAgent";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Google Calendar webhook verification token
const WEBHOOK_SECRET = process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret";

// Google Calendar webhook IP ranges (for additional security validation)
// These are Google's known IP ranges - we can validate against them if needed
// Note: Google may use various IPs, so this is optional validation
const GOOGLE_IP_RANGES = [
  // Google Cloud IP ranges (approximate)
  "66.249.0.0/16",
  "64.233.160.0/19",
  "72.14.192.0/18",
  "209.85.128.0/17",
  "216.239.32.0/19",
  "108.177.8.0/21",
  "173.194.0.0/16",
  // Add more as needed
];

/**
 * Basic IP validation (optional - Google IPs can vary)
 * This is a lightweight check that won't block legitimate requests
 */
function isValidGoogleIP(ip: string | null): boolean {
  if (!ip || !process.env.VALIDATE_GOOGLE_IPS || process.env.VALIDATE_GOOGLE_IPS !== "true") {
    // Skip validation if not enabled
    return true;
  }
  // For now, always return true - implement proper CIDR matching if needed
  // This is a placeholder for future IP validation
  return true;
}

/**
 * GET: Verify webhook subscription (Google requires this for initial setup)
 * Also handles browser access for testing
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    // Google Calendar webhook verification
    return new NextResponse(challenge, { status: 200 });
  }
  
  // Return a helpful message for browser access
  return NextResponse.json({ 
    message: "Google Calendar webhook endpoint",
    status: "active",
    note: "This endpoint receives POST requests from Google Calendar. Direct browser access is for verification only."
  }, { status: 200 });
}

/**
 * POST: Handle webhook notifications from Google Calendar
 */
export async function POST(req: NextRequest) {
  try {
    // Get client IP for validation (optional)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Optional: Validate IP is from Google (if validation is enabled)
    if (!isValidGoogleIP(clientIP)) {
      console.warn("Webhook request from unknown IP:", clientIP);
      // Don't block - Google may use various IPs, but log for monitoring
    }

    // Verify webhook secret (if configured)
    const authHeader = req.headers.get("x-goog-channel-token");
    if (WEBHOOK_SECRET && WEBHOOK_SECRET !== "soradin-webhook-secret") {
      // Only validate if a custom secret is set
      if (authHeader !== WEBHOOK_SECRET) {
        console.warn("Invalid webhook secret from IP:", clientIP);
        // Still process but log warning - Google doesn't always send this header
      }
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

  if (error) {
    console.error("Error looking up calendar connection for channel:", channelId, error);
    return;
  }

  if (!connection) {
    // Better error handling: log available connections for debugging
    const { data: allConnections } = await supabaseAdmin
      .from("calendar_connections")
      .select("id, specialist_id, provider, webhook_channel_id")
      .eq("provider", "google");
    
    console.warn("Could not find calendar connection for channel:", channelId, {
      receivedChannelId: channelId,
      availableConnections: allConnections?.map((c: any) => ({
        id: c.id,
        specialist_id: c.specialist_id,
        channel_id: c.webhook_channel_id
      })) || [],
      totalConnections: allConnections?.length || 0
    });
    // This is non-fatal - calendar sync will work via regular sync, just not real-time
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

  if (error) {
    console.error("Error looking up calendar connection for channel:", channelId, error);
    return;
  }

  if (!connection) {
    // Better error handling: log available connections for debugging
    const { data: allConnections } = await supabaseAdmin
      .from("calendar_connections")
      .select("id, specialist_id, provider, webhook_channel_id")
      .eq("provider", "google");
    
    console.warn("Could not find calendar connection for channel:", channelId, {
      receivedChannelId: channelId,
      availableConnections: allConnections?.map((c: any) => ({
        id: c.id,
        specialist_id: c.specialist_id,
        channel_id: c.webhook_channel_id
      })) || [],
      totalConnections: allConnections?.length || 0
    });
    // This is non-fatal - calendar sync will work via regular sync, just not real-time
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
  const blocklisted = await isEventBlocklistedAndRemove(
    connection.specialist_id,
    connection.provider,
    event.providerEventId
  );
  if (blocklisted) {
    console.log(`Skipping blocklisted event ${event.providerEventId} (user deleted it)`);
    return;
  }

  const isSoradinCreated = !!event.appointmentId;

  // If this event was created by Soradin (has appointmentId), don't re-import if the appointment was deleted
  if (event.appointmentId) {
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("id", event.appointmentId)
      .maybeSingle();
    if (!appointment) {
      console.log(`Skipping re-import of Soradin event ${event.providerEventId} (appointment ${event.appointmentId} was deleted)`);
      await supabaseAdmin
        .from("external_events")
        .delete()
        .eq("specialist_id", connection.specialist_id)
        .eq("provider", connection.provider)
        .eq("provider_event_id", event.providerEventId);
      return;
    }
  }

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

