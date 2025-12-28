// Detailed webhook test to see exact request/response
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

async function testDetailed() {
  const { data: conn } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('provider', 'google')
    .eq('specialist_id', '5aee0e55-3d54-48fa-835e-4cd4da3e18a9')
    .single();

  if (!conn) {
    console.log('❌ No Google connection found');
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

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
  const shortUuid = conn.specialist_id.substring(0, 8).replace(/-/g, '');
  const timestamp = Date.now();
  const channelId = `soradin${shortUuid}${timestamp}`.substring(0, 64);
  const webhookUrl = `${BASE_URL}/api/integrations/google/webhook`;
  const webhookSecret = process.env.GOOGLE_WEBHOOK_SECRET || "soradin-webhook-secret";
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expirationSeconds = nowSeconds + (6 * 24 * 60 * 60);

  const payload = {
    id: channelId,
    type: "web_hook",
    address: webhookUrl,
    token: webhookSecret,
    expiration: expirationSeconds
  };

  console.log('='.repeat(60));
  console.log('DETAILED WEBHOOK TEST');
  console.log('='.repeat(60));
  console.log('\n📤 REQUEST DETAILS:');
  console.log('URL:', `https://www.googleapis.com/calendar/v3/calendars/${conn.external_calendar_id}/events/watch`);
  console.log('Method: POST');
  console.log('Headers:');
  console.log('  Authorization: Bearer [REDACTED]');
  console.log('  Content-Type: application/json');
  console.log('\n📦 PAYLOAD:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n📊 PAYLOAD ANALYSIS:');
  console.log('  Channel ID length:', channelId.length);
  console.log('  Channel ID format:', /^[a-zA-Z0-9]+$/.test(channelId) ? '✅ Alphanumeric' : '❌ Contains special chars');
  console.log('  Expiration (seconds):', expirationSeconds);
  console.log('  Expiration (date):', new Date(expirationSeconds * 1000).toISOString());
  console.log('  Days from now:', (expirationSeconds - nowSeconds) / (24 * 60 * 60));
  console.log('  Webhook URL:', webhookUrl);
  console.log('  Webhook URL accessible:', '✅ (checked separately)');
  
  console.log('\n📥 SENDING REQUEST...\n');
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${conn.external_calendar_id}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const responseText = await response.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    responseJson = { raw: responseText };
  }

  console.log('📥 RESPONSE:');
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  console.log('\n📄 RESPONSE BODY:');
  console.log(JSON.stringify(responseJson, null, 2));
  
  if (!response.ok) {
    console.log('\n❌ ERROR ANALYSIS:');
    if (responseJson.error) {
      console.log('Error code:', responseJson.error.code);
      console.log('Error message:', responseJson.error.message);
      if (responseJson.error.errors) {
        responseJson.error.errors.forEach((err, i) => {
          console.log(`\nError ${i + 1}:`);
          console.log('  Domain:', err.domain);
          console.log('  Reason:', err.reason);
          console.log('  Message:', err.message);
        });
      }
    }
  } else {
    console.log('\n✅ SUCCESS! Webhook set up successfully');
  }
  
  console.log('\n' + '='.repeat(60));
}

testDetailed().catch(console.error);

