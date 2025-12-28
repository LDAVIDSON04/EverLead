# Microsoft Redirect URI Fix Checklist

## The Error:
`invalid_grant` - Token exchange failed

## What This Means:
The redirect URI in Azure doesn't match what your code is sending.

## Exact Steps to Fix:

### 1. Go to Azure Portal
- https://portal.azure.com
- Sign in

### 2. Find Your App Registration
- Go to: **Azure Active Directory** → **App registrations**
- Search for your app or find Client ID: `0860fd0e-01be-4e1e-a8f2-b01e6da84243`

### 3. Check Authentication Settings
- Click on your app
- Go to: **Authentication** (left menu)
- Scroll to **Redirect URIs** section

### 4. Add/Verify Redirect URI
**Must add EXACTLY this:**
```
https://soradin.com/api/integrations/microsoft/callback
```

**Important:**
- ✅ Must be **https** (not http)
- ✅ Must be **exact match** (case-sensitive)
- ✅ **No trailing slash** (not `/callback/`)
- ✅ Must match exactly what your code sends

### 5. Save and Try Again
- Click **Save** in Azure
- Wait 1-2 minutes for changes to propagate
- Try connecting Microsoft Calendar again in agent portal

## Common Mistakes:
- ❌ Using `http://` instead of `https://`
- ❌ Adding trailing slash: `/callback/`
- ❌ Wrong case: `Soradin.com` instead of `soradin.com`
- ❌ Missing `/api/integrations/microsoft/callback` path

## After Fixing:
1. The connection should work
2. Webhook will be set up automatically
3. 2-minute polling backup is already running

