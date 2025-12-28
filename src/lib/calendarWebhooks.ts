// src/lib/calendarWebhooks.ts
// Utility functions for setting up calendar webhooks

import { supabaseAdmin } from "./supabaseAdmin";
import type { CalendarConnection } from "./calendarProviders/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";

/**
 * Set up Google Calendar webhook subscription
 */
export async function setupGoogleWebhook(connection: CalendarConnection): Promise<void> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("Google OAuth not configured - skipping webhook setup");
    return;
  }

  try {
    // Refresh token if needed
    let accessToken = connection.access_token;
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      if (!connection.refresh_token) {
        throw new Error("Google access token expired and no refresh token available");
      }

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
        // If refresh token is invalid, connection needs reconnection
        if (error.error === "invalid_grant") {
          await supabaseAdmin
            .from("calendar_connections")
            .update({ sync_enabled: false })
            .eq("id", connection.id);
          throw new Error("Refresh token expired or revoked - calendar needs to be reconnected");
        }
        throw new Error(`Failed to refresh Google token: ${JSON.stringify(error)}`);
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
          refresh_token: tokens.refresh_token || connection.refresh_token,
          expires_at: expiresAt,
        })
        .eq("id", connection.id);
    }

    // Stop existing webhook if there is one (using resource_id if available)
    if (connection.webhook_resource_id) {
      try {
        await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: connection.webhook_channel_id || undefined,
            resourceId: connection.webhook_resource_id,
          }),
        });
        console.log(`Stopped existing webhook for specialist ${connection.specialist_id}`);
      } catch (stopError) {
        // Ignore errors when stopping - webhook might already be expired
        console.warn(`Could not stop existing webhook:`, stopError);
      }
    }

    // Generate unique channel ID
    // Channel ID must be a string, max 64 chars
    // Google recommends UUID format to avoid parsing issues
    // Using a simple format: soradin-{short-uuid}-{timestamp}
    const shortUuid = connection.specialist_id.substring(0, 8).replace(/-/g, '');
    const timestamp = Date.now();
    // Ensure channel ID is alphanumeric only to avoid any parsing issues
    const channelId = `soradin${shortUuid}${timestamp}`.substring(0, 64);
    const webhookUrl = `${BASE_URL}/api/integrations/google/webhook`;
    const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret";

    // Calculate expiration (must be between now and 7 days from now, in seconds since epoch)
    // Google allows max 7 days, but let's use 6 days to be safe
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expirationSeconds = nowSeconds + (6 * 24 * 60 * 60); // 6 days from now

    // Ensure expiration is a valid positive integer and within Google's allowed range
    if (!Number.isInteger(expirationSeconds) || expirationSeconds <= nowSeconds) {
      throw new Error(`Invalid expiration calculation: ${expirationSeconds} (now: ${nowSeconds})`);
    }
    
    // Google requires expiration to be at most 7 days (604800 seconds) from now
    const maxExpiration = nowSeconds + (7 * 24 * 60 * 60);
    if (expirationSeconds > maxExpiration) {
      throw new Error(`Expiration ${expirationSeconds} exceeds Google's maximum of ${maxExpiration}`);
    }

    // Subscribe to calendar push notifications
    // Note: Google's API sometimes has issues with expiration parameter
    // We'll include it but if it fails, we'll retry without it
    const watchPayload: any = {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      token: webhookSecret,
    };
    
    // Only add expiration if it's a valid positive number
    // Some Google API versions have issues with this parameter
    if (expirationSeconds > 0 && expirationSeconds < maxExpiration) {
      watchPayload.expiration = expirationSeconds.toString(); // Try as string to avoid parsing issues
    }

    console.log(`Setting up Google webhook with payload:`, {
      channelId,
      expiration: expirationSeconds,
      expirationDate: new Date(expirationSeconds * 1000).toISOString(),
    });

    const watchResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(watchPayload),
      }
    );

    if (!watchResponse.ok) {
      const error = await watchResponse.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Failed to set up Google webhook: ${JSON.stringify(error)}`);
    }

    const watchData = await watchResponse.json();
    const resourceId = watchData.resourceId;

    // Update calendar connection with webhook info
    await supabaseAdmin
      .from("calendar_connections")
      .update({
        webhook_channel_id: channelId,
        webhook_resource_id: resourceId,
        webhook_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", connection.id);

    console.log(`✅ Google Calendar webhook set up for specialist ${connection.specialist_id}`);
  } catch (error: any) {
    console.error("Error setting up Google Calendar webhook:", error);
    // Don't throw - webhook setup is optional, polling will still work
  }
}

/**
 * Set up Microsoft Calendar webhook subscription
 */
export async function setupMicrosoftWebhook(connection: CalendarConnection): Promise<void> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("Microsoft OAuth not configured - skipping webhook setup");
    return;
  }

  try {
    // Refresh token if needed
    let accessToken = connection.access_token;
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      if (!connection.refresh_token) {
        throw new Error("Microsoft access token expired and no refresh token available");
      }

      const refreshResponse = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
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
            scope: "Calendars.ReadWrite",
          }),
        }
      );

      if (!refreshResponse.ok) {
        const error = await refreshResponse.json().catch(() => ({ error: "Unknown error" }));
        // If refresh token is invalid, connection needs reconnection
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
          refresh_token: tokens.refresh_token || connection.refresh_token,
          expires_at: expiresAt,
        })
        .eq("id", connection.id);
    }

    const webhookUrl = `${BASE_URL}/api/integrations/microsoft/webhook`;
    const subscriptionId = `soradin-${connection.specialist_id}-${Date.now()}`;

  // Add a longer delay to avoid rate limiting if multiple webhooks are being set up
  // Microsoft has strict rate limits for webhook subscriptions
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay

    // Subscribe to calendar change notifications
    const subscriptionResponse = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType: "created,updated,deleted",
          notificationUrl: webhookUrl,
          resource: `/me/calendar/events`,
          expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days (Microsoft max)
          clientState: subscriptionId,
        }),
      }
    );

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Failed to set up Microsoft webhook: ${JSON.stringify(error)}`);
    }

    const subscriptionData = await subscriptionResponse.json();

    // Update calendar connection with webhook info
    await supabaseAdmin
      .from("calendar_connections")
      .update({
        webhook_subscription_id: subscriptionData.id,
        webhook_expires_at: subscriptionData.expirationDateTime,
      })
      .eq("id", connection.id);

    console.log(`✅ Microsoft Calendar webhook set up for specialist ${connection.specialist_id}`);
  } catch (error: any) {
    console.error("Error setting up Microsoft Calendar webhook:", error);
    // Don't throw - webhook setup is optional, polling will still work
  }
}

/**
 * Check if a webhook is expired or about to expire (within 24 hours)
 */
export function isWebhookExpiredOrExpiring(connection: CalendarConnection): boolean {
  if (!connection.webhook_expires_at) {
    return true; // No webhook set up
  }
  
  const expiresAt = new Date(connection.webhook_expires_at);
  const now = new Date();
  const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Consider expired if already expired or expiring within 24 hours
  return hoursUntilExpiry <= 24;
}

/**
 * Renew expired or expiring webhooks for all active connections
 * This should be called periodically (e.g., daily via cron)
 */
export async function renewExpiredWebhooks(): Promise<{
  renewed: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    renewed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get all active connections with webhooks that are expired or expiring
    const { data: connections, error } = await supabaseAdmin
      .from("calendar_connections")
      .select("*")
      .eq("sync_enabled", true)
      .in("provider", ["google", "microsoft"])
      .or("webhook_expires_at.is.null,webhook_expires_at.lt.now()");

    if (error) {
      throw new Error(`Failed to load connections: ${error.message}`);
    }

    if (!connections || connections.length === 0) {
      return results;
    }

    // Also check for connections expiring within 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const { data: expiringConnections, error: expiringError } = await supabaseAdmin
      .from("calendar_connections")
      .select("*")
      .eq("sync_enabled", true)
      .in("provider", ["google", "microsoft"])
      .gte("webhook_expires_at", now.toISOString())
      .lte("webhook_expires_at", tomorrow.toISOString());

    if (!expiringError && expiringConnections) {
      connections.push(...expiringConnections);
    }

    // Remove duplicates
    const uniqueConnections = Array.from(
      new Map(connections.map((conn: any) => [conn.id, conn])).values()
    );

    for (const connection of uniqueConnections as CalendarConnection[]) {
      if (isWebhookExpiredOrExpiring(connection)) {
        try {
          if (connection.provider === "google") {
            await setupGoogleWebhook(connection);
          } else if (connection.provider === "microsoft") {
            await setupMicrosoftWebhook(connection);
          }
          results.renewed++;
          console.log(
            `✅ Renewed ${connection.provider} webhook for specialist ${connection.specialist_id}`
          );
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Failed to renew ${connection.provider} webhook for specialist ${connection.specialist_id}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error("Error renewing expired webhooks:", error);
    throw error;
  }
}

