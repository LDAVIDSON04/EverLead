// src/app/api/integrations/microsoft/webhook/route.ts
// Microsoft Calendar Webhooks (Change Notifications)
// Receives real-time notifications when calendar events change

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchMicrosoftCalendarEvents } from "@/lib/calendarProviders/microsoft";
import type { CalendarConnection } from "@/lib/calendarProviders/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Microsoft webhook security token (optional additional validation)
const MICROSOFT_WEBHOOK_SECRET = process.env.MICROSOFT_WEBHOOK_SECRET;

// Microsoft Graph API IP ranges (for additional security validation)
// Note: Microsoft uses various IPs, so this is optional validation
const MICROSOFT_IP_RANGES = [
  // Microsoft Azure IP ranges (approximate)
  "13.64.0.0/11",
  "13.96.0.0/13",
  "13.104.0.0/14",
  // Add more as needed
];

/**
 * Basic IP validation (optional - Microsoft IPs can vary)
 * This is a lightweight check that won't block legitimate requests
 */
function isValidMicrosoftIP(ip: string | null): boolean {
  if (!ip || !process.env.VALIDATE_MICROSOFT_IPS || process.env.VALIDATE_MICROSOFT_IPS !== "true") {
    // Skip validation if not enabled
    return true;
  }
  // For now, always return true - implement proper CIDR matching if needed
  // This is a placeholder for future IP validation
  return true;
}

// Make this route publicly accessible (no authentication required)
// Microsoft webhooks need to be accessible without auth for validation
// Security: We validate using Microsoft's validation tokens and optional IP checking

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
    // Get client IP for validation (optional)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Microsoft sends validation tokens in the query parameter OR request body
    // Check query parameter first (most common method)
    const { searchParams } = new URL(req.url);
    const validationToken = searchParams.get("validationToken");
    
    if (validationToken) {
      console.log("✅ Microsoft webhook validation request received (from query param, IP:", clientIP + "):", validationToken.substring(0, 50) + "...");
      // Microsoft requires us to return the validation token exactly as received
      return new NextResponse(validationToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Optional: Validate IP is from Microsoft (if validation is enabled)
    if (!isValidMicrosoftIP(clientIP)) {
      console.warn("Webhook request from unknown IP:", clientIP);
      // Don't block - Microsoft may use various IPs, but log for monitoring
    }

    // Log all headers for debugging (only if not validation)
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log("Microsoft webhook request received (IP:", clientIP + "):", {
      method: req.method,
      url: req.url,
      headers: allHeaders,
      hasBody: !!req.body,
    });

    // Microsoft may also send validation token in the request body as plain text
    // Check the raw body first before trying to parse as JSON
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);
    
    // Read body as text first to catch validation tokens
    let textBody: string;
    try {
      textBody = await req.text();
      console.log("Request body (first 200 chars):", textBody.substring(0, 200));
      
      // If it's a short string (likely validation token), return it
      if (textBody && textBody.length > 0 && textBody.length < 500 && !textBody.trim().startsWith("{")) {
        console.log("✅ Microsoft webhook validation request received (from body):", textBody.substring(0, 50) + "...");
        return new NextResponse(textBody, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache",
          },
        });
      }
      
      // If it's JSON, parse and handle
      if (textBody.trim().startsWith("{")) {
        try {
          const body = JSON.parse(textBody);
          return await handleNotificationBody(body);
        } catch (parseError) {
          console.error("Failed to parse JSON body:", parseError);
          return new NextResponse("OK", { status: 200 });
        }
      }
      
      // If it's empty or unknown format, return OK
      return new NextResponse("OK", { status: 200 });
    } catch (textError: any) {
      console.error("Failed to read request body:", textError);
      // Return OK to prevent Microsoft from retrying
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

