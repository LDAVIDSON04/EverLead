# Microsoft Azure API Permissions Setup

## Problem
Error: `AADSTS70000: The request was denied because one or more scopes requested are unauthorized or expired.`

This means the Azure App Registration doesn't have the required API permissions configured.

## Solution: Add API Permissions in Azure

### Step 1: Go to Azure App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find and click on your app (the one with your `MICROSOFT_CLIENT_ID`)

### Step 2: Add Microsoft Graph API Permissions
1. In your app registration, click **API permissions** in the left sidebar
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions** (not Application permissions)
5. Search for and select:
   - ✅ **Calendars.ReadWrite** - Read and write calendars
   - ✅ **offline_access** - Maintain access to data (for refresh tokens)
6. Click **Add permissions**

### Step 3: Grant Admin Consent
1. After adding permissions, you'll see them listed
2. Click **Grant admin consent for [Your Organization]**
3. Click **Yes** to confirm
4. You should see green checkmarks next to the permissions

### Step 4: Verify Redirect URI (Already Done ✅)
The redirect URI is already correct:
- **Redirect URI**: `https://soradin.com/api/integrations/microsoft/callback`
- **Platform**: Web
- ✅ This is already configured correctly

## Required Permissions Summary
- **Calendars.ReadWrite** (Delegated) - Required for reading and writing calendar events
- **offline_access** (Delegated) - Required for refresh tokens to keep the connection alive

## After Setup
1. Wait 1-2 minutes for Azure to propagate changes
2. Try connecting Microsoft Calendar again
3. The connection should now work!

## Troubleshooting
If it still doesn't work:
1. Make sure you clicked "Grant admin consent" (not just added permissions)
2. Check that permissions show green checkmarks
3. Try disconnecting and reconnecting
4. Check Vercel logs for any new errors

