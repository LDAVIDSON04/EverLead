# Fix Microsoft OAuth Redirect URI

## The Error:
"invalid_request: The provided value for the input parameter 'redirect_uri' is not valid."

## What to Check:

### 1. Check What Redirect URI Your Code is Using:
The code uses:
- `MICROSOFT_REDIRECT_URI` environment variable (if set)
- OR: `https://soradin.com/api/integrations/microsoft/callback` (default)

### 2. Check Azure App Registration:
1. Go to: https://portal.azure.com
2. Navigate to: **Azure Active Directory** → **App registrations**
3. Find your app (Client ID: `0860fd0e-01be-4e1e-a8f2-b01e6da84243`)
4. Go to: **Authentication**
5. Check **Redirect URIs** section
6. The redirect URI must EXACTLY match one of these:
   - `https://soradin.com/api/integrations/microsoft/callback`
   - OR whatever is in your `MICROSOFT_REDIRECT_URI` env variable

### 3. Add Redirect URI in Azure:
If it's missing, add:
- **Type:** Web
- **Redirect URI:** `https://soradin.com/api/integrations/microsoft/callback`
- Click **Save**

### 4. Important Notes:
- Must be **exact match** (including https, no trailing slash)
- Must be **https** (not http)
- Case-sensitive

## After Fixing:
1. Try connecting Microsoft Calendar again
2. Webhook will be set up automatically
3. 2-minute polling backup is already configured

