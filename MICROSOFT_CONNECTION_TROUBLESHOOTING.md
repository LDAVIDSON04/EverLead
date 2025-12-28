# Microsoft Connection Troubleshooting

## Current Issue:
Connection shows `invalid_grant` error even though redirect URI was added.

## Possible Causes:

### 1. Authorization Code Expired
- OAuth codes expire quickly (usually within minutes)
- **Fix:** Try connecting again (generate a fresh code)

### 2. Redirect URI Mismatch
Even if you added it, check:
- ✅ Exact match: `https://soradin.com/api/integrations/microsoft/callback`
- ✅ No trailing slash
- ✅ Case-sensitive (lowercase `soradin`)
- ✅ Must be in "Web" platform type (not Mobile/Desktop)

### 3. Multiple Redirect URIs
- Azure might have old/wrong URIs
- **Fix:** Remove any incorrect URIs, keep only the correct one

### 4. Client Secret Issue
- If client secret changed, it won't work
- **Fix:** Verify client secret in environment variables matches Azure

## Steps to Fix:

### Step 1: Verify Redirect URI in Azure
1. Go to: https://portal.azure.com
2. Azure Active Directory → App registrations
3. Find your app → Authentication
4. Check Redirect URIs:
   - Should have: `https://soradin.com/api/integrations/microsoft/callback`
   - Remove any other incorrect URIs
   - Make sure it's "Web" type (not Mobile/Desktop)

### Step 2: Try Connecting Again
- The authorization code might have expired
- Click "Connect" again in agent portal
- This will generate a fresh OAuth code

### Step 3: Check Environment Variables
Make sure these are set in Vercel:
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (should be `https://soradin.com`)

## After Fixing:
1. Connection should work
2. Webhook will be set up automatically
3. 2-minute polling backup is already running

