// Direct script to set up webhooks - bypasses HTTP endpoint
// Run with: node setup-webhooks-direct.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

// Import webhook setup functions
async function setupGoogleWebhook(connection) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("⚠️ Google OAuth not configured - skipping webhook setup");
    return;
  }

  try {
    // Try using existing token first, only refresh if it fails
    let accessToken = connection.access_token;
    let needsRefresh = connection.expires_at && new Date(connection.expires_at) < new Date();
    
    // If token is expired, try to refresh it
    if (needsRefresh && connection.refresh_token) {
      console.log(`  ⏳ Token expired, attempting to refresh...`);
      try {
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

        if (refreshResponse.ok) {
          const tokens = await refreshResponse.json();
          accessToken = tokens.access_token;
          console.log(`  ✅ Token refreshed successfully`);
        } else {
          const errorText = await refreshResponse.text();
          console.log(`  ⚠️ Refresh failed: ${errorText}`);
          console.log(`  💡 The calendar needs to be reconnected. Trying with existing token anyway...`);
          // Continue with existing token - it might still work
        }
      } catch (refreshError) {
        console.log(`  ⚠️ Refresh error: ${refreshError.message}`);
        console.log(`  💡 Trying with existing token anyway...`);
        // Continue with existing token
      }
    }

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "https://soradin.com";
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
          // Expiration must be in seconds since epoch, max 7 days from now
          expiration: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
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
  } catch (error) {
    console.error(`❌ Error setting up Google Calendar webhook:`, error.message);
    throw error;
  }
}

async function setupMicrosoftWebhook(connection) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("⚠️ Microsoft OAuth not configured - skipping webhook setup");
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

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "https://soradin.com";
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
          expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
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
  } catch (error) {
    console.error(`❌ Error setting up Microsoft Calendar webhook:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🔍 Checking webhook status...\n');

  // Get all active connections missing webhooks
  const { data: connections, error } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("sync_enabled", true)
    .in("provider", ["google", "microsoft"])
    .or("webhook_channel_id.is.null,webhook_subscription_id.is.null,webhook_expires_at.is.null");

  if (error) {
    console.error('❌ Error loading connections:', error);
    process.exit(1);
  }

  if (!connections || connections.length === 0) {
    console.log('✅ All webhooks are already set up!');
    process.exit(0);
  }

  console.log(`📊 Found ${connections.length} connection(s) missing webhooks:\n`);
  connections.forEach(conn => {
    console.log(`  - ${conn.provider} for specialist ${conn.specialist_id}`);
  });
  console.log('');

  const results = {
    setup: 0,
    failed: 0,
    errors: [],
  };

  for (const connection of connections) {
    try {
      if (connection.provider === "google") {
        await setupGoogleWebhook(connection);
        results.setup++;
      } else if (connection.provider === "microsoft") {
        await setupMicrosoftWebhook(connection);
        results.setup++;
      }
    } catch (error) {
      results.failed++;
      const errorMsg = `Failed to set up ${connection.provider} webhook for specialist ${connection.specialist_id}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Set up: ${results.setup}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  // Verify final status
  console.log('\n🔍 Verifying final status...\n');
  const { data: finalConnections } = await supabaseAdmin
    .from("calendar_connections")
    .select("id, specialist_id, provider, webhook_channel_id, webhook_subscription_id, webhook_expires_at")
    .eq("sync_enabled", true)
    .in("provider", ["google", "microsoft"]);

  const now = new Date();
  let withWebhooks = 0;
  let missingWebhooks = 0;
  let expiredWebhooks = 0;

  finalConnections?.forEach(conn => {
    const hasWebhook = conn.provider === "google" 
      ? !!conn.webhook_channel_id 
      : !!conn.webhook_subscription_id;
    const isExpired = conn.webhook_expires_at && new Date(conn.webhook_expires_at) < now;

    if (hasWebhook) {
      withWebhooks++;
    } else {
      missingWebhooks++;
    }

    if (isExpired) {
      expiredWebhooks++;
    }
  });

  console.log(`📊 Final Status:`);
  console.log(`  Total: ${finalConnections?.length || 0}`);
  console.log(`  ✅ With webhooks: ${withWebhooks}`);
  console.log(`  ❌ Missing: ${missingWebhooks}`);
  console.log(`  ⏰ Expired: ${expiredWebhooks}`);

  if (missingWebhooks === 0) {
    console.log('\n🎉 Success! All webhooks are now set up!');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

