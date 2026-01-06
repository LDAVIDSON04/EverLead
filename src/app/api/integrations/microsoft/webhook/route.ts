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
      console.log("Microsoft webhook validation request received (from header/query)");
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

    // Microsoft may also send validation token in the request body as plain text
    // Check the raw body first before trying to parse as JSON
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("text/plain") || !contentType.includes("application/json")) {
      try {
        const textBody = await req.text();
        // If it's a short string (likely validation token), return it
        if (textBody && textBody.length < 200 && !textBody.startsWith("{")) {
          console.log("Microsoft webhook validation request received (from body)");
          return new NextResponse(textBody, {
            status: 200,
            headers: {
              "Content-Type": "text/plain",
              "Cache-Control": "no-cache",
            },
          });
        }
        // If it's not a validation token, try to parse as JSON
        try {
          const body = JSON.parse(textBody);
          return await handleNotificationBody(body);
        } catch {
          // If parsing fails, return OK anyway
          return new NextResponse("OK", { status: 200 });
        }
      } catch (textError) {
        console.warn("Failed to read request body:", textError);
        return new NextResponse("OK", { status: 200 });
      }
    }

    // Parse notification body as JSON
    let body;
    try {
      body = await req.json();
      return await handleNotificationBody(body);
    } catch (parseError) {
      // If body parsing fails, might be a validation request without proper header
      console.warn("Failed to parse webhook body, might be validation request:", parseError);
      return new NextResponse("OK", { status: 200 });
    }
  } catch (error: any) {
    console.error("Error processing Microsoft Calendar webhook:", error);
    // Always return 200 to Microsoft to prevent retries for transient errors
    // But log the error for debugging
    return new NextResponse("OK", { status: 200 });
  }
}

/**
 * Handle notification body (after validation check)
 */
async function handleNotificationBody(body: any) {
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

    // Process each event
    for (const event of events) {
      await processExternalEvent(connection as CalendarConnection, event);
    }

    console.log(`Updated events for Microsoft Calendar ${subscriptionId} after ${changeType} notification`);
  } catch (error: any) {
    console.error("Error updating Microsoft Calendar events:", error);
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

