// Test script to debug Google Calendar webhook setup
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testWebhook() {
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('provider', 'google')
    .eq('sync_enabled', true)
    .single();

  if (!conn) {
    console.log('No Google connection found');
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Refresh token if needed
  let accessToken = conn.access_token;
  if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: conn.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tokens = await refreshResponse.json();
    accessToken = tokens.access_token;
  }

  // Test with minimal payload
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expirationSeconds = nowSeconds + (6 * 24 * 60 * 60);
  
  const testPayload = {
    id: `test-${Date.now()}`,
    type: "web_hook",
    address: "https://soradin.com/api/integrations/google/webhook",
    token: process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret",
    expiration: expirationSeconds
  };

  console.log('Test payload:', JSON.stringify(testPayload, null, 2));
  console.log('Expiration date:', new Date(expirationSeconds * 1000).toISOString());
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${conn.external_calendar_id}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    }
  );

  const result = await response.text();
  console.log('Response status:', response.status);
  console.log('Response:', result);
}

testWebhook().catch(console.error);
