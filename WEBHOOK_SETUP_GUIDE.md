# Webhook Setup Guide - Step by Step

## Step 1: Check Current Webhook Status

First, let's see which connections are missing webhooks.

### Option A: Using Your Browser
1. Open your browser
2. Navigate to:
   ```
   https://your-domain.com/api/integrations/setup-webhooks
   ```
   (Replace `your-domain.com` with your actual domain, e.g., `everlead.vercel.app` or `localhost:3000` if testing locally)

3. You should see a JSON response showing:
   - `total`: Total number of active calendar connections
   - `withWebhooks`: How many have webhooks set up
   - `missingWebhooks`: How many are missing webhooks
   - `expiredWebhooks`: How many have expired webhooks
   - `connections`: Detailed list of each connection

### Option B: Using Terminal/Command Line
```bash
# Replace with your actual domain
curl https://your-domain.com/api/integrations/setup-webhooks
```

**Example Response:**
```json
{
  "total": 2,
  "withWebhooks": 0,
  "missingWebhooks": 2,
  "expiredWebhooks": 0,
  "connections": [
    {
      "id": "uuid-here",
      "specialist_id": "specialist-uuid",
      "provider": "google",
      "hasWebhook": false,
      "isExpired": false,
      "expiresAt": null
    },
    {
      "id": "uuid-here",
      "specialist_id": "specialist-uuid",
      "provider": "microsoft",
      "hasWebhook": false,
      "isExpired": false,
      "expiresAt": null
    }
  ]
}
```

---

## Step 2: Set Up All Missing Webhooks

Now let's set up webhooks for all connections that are missing them.

### Option A: Using Your Browser
1. Open a new tab
2. Install a browser extension like "REST Client" or use the browser's developer console
3. Or use this simple method:
   - Open your browser's developer console (F12)
   - Go to the Console tab
   - Paste this code:
   ```javascript
   fetch('/api/integrations/setup-webhooks', { method: 'POST' })
     .then(res => res.json())
     .then(data => console.log('Result:', data))
     .catch(err => console.error('Error:', err));
   ```

### Option B: Using Terminal/Command Line (Recommended)
```bash
# Replace with your actual domain
curl -X POST https://your-domain.com/api/integrations/setup-webhooks
```

**Example Response:**
```json
{
  "message": "Webhook setup completed",
  "setup": 2,
  "failed": 0,
  "total": 2,
  "errors": null
}
```

### Option C: Using a Tool like Postman or Insomnia
1. Create a new POST request
2. URL: `https://your-domain.com/api/integrations/setup-webhooks`
3. Method: `POST`
4. No headers or body needed
5. Send the request

---

## Step 3: Verify Webhooks Were Set Up

After running the setup, check the status again:

```bash
curl https://your-domain.com/api/integrations/setup-webhooks
```

You should now see:
- `withWebhooks`: Should match `total` (all connections have webhooks)
- `missingWebhooks`: Should be 0

---

## Step 4: Check the Database (Optional Verification)

You can also verify in your Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor → `calendar_connections`
3. Check the columns:
   - For **Google** connections: `webhook_channel_id` should have a value
   - For **Microsoft** connections: `webhook_subscription_id` should have a value
   - `webhook_expires_at` should have a future date

---

## Troubleshooting

### If Setup Fails

If you see errors in the response, check:

1. **OAuth Credentials:**
   - Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your environment variables
   - Make sure `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` are set

2. **Access Tokens:**
   - The connections need valid OAuth tokens
   - If tokens are expired, the webhook setup will fail
   - You may need to reconnect the calendar

3. **Check Server Logs:**
   - Look at your deployment logs (Vercel, etc.)
   - Check for error messages about webhook setup

### Force Re-Setup (Even if Webhooks Exist)

If you want to force re-setup all webhooks (useful for renewal):

```bash
curl -X POST "https://your-domain.com/api/integrations/setup-webhooks?force=true"
```

### Set Up for a Specific Specialist

If you only want to set up webhooks for one specialist:

```bash
curl -X POST "https://your-domain.com/api/integrations/setup-webhooks?specialistId=<specialist-uuid>"
```

---

## What Happens Next

Once webhooks are set up:

1. **Google Calendar webhooks** expire after 7 days (Google's limit)
2. **Microsoft Calendar webhooks** expire after 3 days (Microsoft's limit)
3. The system will automatically renew them when:
   - The sync route runs (`/api/integrations/sync`)
   - You manually call the setup endpoint again

---

## Quick Reference

```bash
# Check status
GET /api/integrations/setup-webhooks

# Set up missing webhooks
POST /api/integrations/setup-webhooks

# Force re-setup all webhooks
POST /api/integrations/setup-webhooks?force=true

# Set up for specific specialist
POST /api/integrations/setup-webhooks?specialistId=<uuid>
```

