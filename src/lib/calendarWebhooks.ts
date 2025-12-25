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
        throw new Error("Failed to refresh Google token");
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
    }

    // Generate unique channel ID (use specialist_id which matches calendar_connections table)
    const channelId = `soradin-${connection.specialist_id}-${Date.now()}`;
    const webhookUrl = `${BASE_URL}/api/integrations/google/webhook`;
    const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret";

    // Subscribe to calendar push notifications
    const watchResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${connection.external_calendar_id}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          token: webhookSecret,
          // Watch for 7 days (Google max is 7 days, we'll renew before expiry)
          expiration: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        }),
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
        throw new Error("Failed to refresh Microsoft token");
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
    }

    const webhookUrl = `${BASE_URL}/api/integrations/microsoft/webhook`;
    const subscriptionId = `soradin-${connection.specialist_id}-${Date.now()}`;

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

