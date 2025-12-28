# Microsoft Calendar Setup - Complete Guide

## ✅ What's Already Set Up:

1. **Microsoft Webhooks** - Code is ready (uses Microsoft Graph API, different from Google)
2. **2-Minute Polling Backup** - Already configured in `vercel.json`
3. **Webhook Endpoint** - `/api/integrations/microsoft/webhook` is ready
4. **Sync Endpoint** - Handles both Google and Microsoft

## ❌ Current Issue: Redirect URI Mismatch

**Error:** "invalid_request: The provided value for the input parameter 'redirect_uri' is not valid"

### Fix Steps:

1. **Go to Azure Portal:**
   - https://portal.azure.com
   - Sign in with your Microsoft account

2. **Navigate to App Registration:**
   - Go to: **Azure Active Directory** → **App registrations**
   - Find your app (Client ID: `0860fd0e-01be-4e1e-a8f2-b01e6da84243`)
   - OR search for "Soradin" in the app registrations

3. **Add Redirect URI:**
   - Click on your app
   - Go to: **Authentication** (left menu)
   - Scroll to **Redirect URIs** section
   - Click **"+ Add a platform"** or **"+ Add URI"**
   - Select **Web**
   - Add this EXACT URI:
     ```
     https://soradin.com/api/integrations/microsoft/callback
     ```
   - Click **Save**

4. **Important:**
   - Must be **exact match** (case-sensitive, no trailing slash)
   - Must be **https** (not http)
   - The URI in Azure must match what your code sends

## After Fixing Redirect URI:

1. **Try connecting Microsoft Calendar again** in agent portal
2. **Webhook will be set up automatically** during connection
3. **2-minute polling backup** is already running

## Microsoft Webhooks vs Google:

**Good News:** Microsoft uses Graph API which is different from Google Calendar API
- Microsoft webhooks might work even if Google doesn't!
- Microsoft doesn't have the same TTL error issue
- Microsoft webhooks are generally more reliable

## Testing:

After fixing redirect URI and connecting:
1. Run: `node setup-webhooks-direct.js`
2. Check if Microsoft webhook is set up
3. Test by creating a meeting in Microsoft Calendar
4. It should sync to Soradin within seconds (if webhook works) or 2 minutes (polling backup)

