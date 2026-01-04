// src/app/api/integrations/microsoft/webhook/route.ts
// Microsoft Calendar Webhooks (Change Notifications)
// Receives real-time notifications when calendar events change

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchMicrosoftCalendarEvents } from "@/lib/calendarProviders/microsoft";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Handle browser access / health check
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: "Microsoft Calendar webhook endpoint",
    status: "active",
    note: "This endpoint receives POST requests from Microsoft Graph. Direct browser access is for verification only."
  }, { status: 200 });
}

/**
 * POST: Handle webhook notifications from Microsoft Graph
 */
export async function POST(req: NextRequest) {
  try {
    // Microsoft sends validation requests first
    // Check both header name variations (Microsoft sometimes uses different casing)
    // Also check query parameters as Microsoft sometimes sends validation tokens there
    const validationToken = 
      req.headers.get("validation-token") || 
      req.headers.get("Validation-Token") ||
      req.headers.get("VALIDATION-TOKEN") ||
      req.nextUrl.searchParams.get("validationToken");
    
    if (validationToken) {
      console.log("Microsoft webhook validation request received");
      // Return validation token IMMEDIATELY to confirm subscription
      // Must return 200 OK with the validation token as plain text
      // This is critical - Microsoft requires a fast response (< 3 seconds)
      return new NextResponse(validationToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Parse notification body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      // If body parsing fails, might be a validation request without proper header
      console.warn("Failed to parse webhook body, might be validation request:", parseError);
      return new NextResponse("OK", { status: 200 });
    }
    
    const notifications = body.value || [];

    console.log("Microsoft Calendar webhook received:", {
      notificationCount: notifications.length,
    });

    // Process each notification
    for (const notification of notifications) {
      try {
        await handleMicrosoftNotification(notification);
      } catch (error: any) {
        console.error("Error processing Microsoft notification:", error);
        // Continue with other notifications
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Microsoft Calendar webhook:", error);
    // Always return 200 to Microsoft to prevent retries for transient errors
    // But log the error for debugging
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

/**
 * Handle a single Microsoft notification
 */
async function handleMicrosoftNotification(notification: any) {
  const subscriptionId = notification.subscriptionId;
  const resource = notification.resource;
  const changeType = notification.changeType; // created, updated, deleted

  console.log("Processing Microsoft notification:", {
    subscriptionId,
    resource,
    changeType,
  });

  // Find the calendar connection by subscription_id
  const { data: connection, error } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("provider", "microsoft")
    .eq("webhook_subscription_id", subscriptionId)
    .maybeSingle();

  if (error || !connection) {
    console.error("Could not find calendar connection for subscription:", subscriptionId);
    return;
  }

  // Fetch recent events to get the updated data
  const now = new Date();
  const timeMin = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1 hour ago
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await fetchMicrosoftCalendarEvents(
      connection as CalendarConnection,
      timeMin,
      timeMax
    );

    const fetchedEventIds = new Set<string>();
    // Process each event
    for (const event of events) {
      await processExternalEvent(connection as CalendarConnection, event);
      fetchedEventIds.add(event.providerEventId);
    }

    // Delete events from database that no longer exist in Microsoft Calendar
    await deleteMissingEvents(connection as CalendarConnection, fetchedEventIds, timeMin, timeMax);

    console.log(`Updated events for Microsoft Calendar ${subscriptionId} after ${changeType} notification`);
  } catch (error: any) {
    console.error("Error updating Microsoft Calendar events:", error);
  }
}

/**
 * Deletes events from database that no longer exist in Microsoft Calendar
 */
async function deleteMissingEvents(
  connection: CalendarConnection,
  fetchedEventIds: Set<string>,
  timeMin: string,
  timeMax: string
): Promise<void> {
  try {
    const { data: dbEvents, error: fetchError } = await supabaseAdmin
      .from("external_events")
      .select("id, provider_event_id, appointment_id, is_soradin_created")
      .eq("specialist_id", connection.specialist_id)
      .eq("provider", connection.provider)
      .gte("starts_at", timeMin)
      .lte("starts_at", timeMax);

    if (fetchError || !dbEvents) {
      console.error("Error fetching events for deletion check:", fetchError);
      return;
    }

    const eventsToDelete = dbEvents.filter(
      (dbEvent) => !fetchedEventIds.has(dbEvent.provider_event_id)
    );

    if (eventsToDelete.length === 0) {
      return;
    }

    console.log(`🗑️ Webhook: Found ${eventsToDelete.length} events to delete (no longer in Microsoft Calendar)`);

    const allowExternalEdits = process.env.ALLOW_EXTERNAL_EDITS === "true" || false;

    for (const eventToDelete of eventsToDelete) {
      if (eventToDelete.is_soradin_created && eventToDelete.appointment_id && allowExternalEdits) {
        console.log(`⚠️ Webhook: Soradin appointment ${eventToDelete.appointment_id} was deleted in Microsoft Calendar - cancelling`);
        
        const { error: cancelError } = await supabaseAdmin
          .from("appointments")
          .update({
            status: "cancelled",
            notes: `Cancelled externally via Microsoft Calendar on ${new Date().toISOString()}`,
          })
          .eq("id", eventToDelete.appointment_id);

        if (cancelError) {
          console.error(`Failed to cancel appointment ${eventToDelete.appointment_id}:`, cancelError);
        }
      }

      const { error: deleteError } = await supabaseAdmin
        .from("external_events")
        .delete()
        .eq("id", eventToDelete.id);

      if (deleteError) {
        console.error(`Error deleting external event ${eventToDelete.id}:`, deleteError);
      }
    }
  } catch (error: any) {
    console.error("Error in deleteMissingEvents:", error);
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

