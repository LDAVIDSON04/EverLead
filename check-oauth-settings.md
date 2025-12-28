# Check These Google Cloud Console Settings

## 1. OAuth Consent Screen
- Go to: APIs & Services → OAuth consent screen
- Check:
  - ✅ App is in "Production" mode (not "Testing")
  - ✅ Test users are added (you already did this)
  - ✅ Scopes include: `https://www.googleapis.com/auth/calendar.events`

## 2. Calendar API
- Go to: APIs & Services → Enabled APIs
- Check:
  - ✅ "Google Calendar API" is enabled
  - Look for any "Push Notifications" or "Webhooks" specific settings

## 3. OAuth 2.0 Client ID
- Go to: APIs & Services → Credentials
- Check your OAuth 2.0 Client ID:
  - ✅ Authorized redirect URIs includes your callback URL
  - ✅ Application type is "Web application"

## 4. API Quotas
- Go to: APIs & Services → Quotas
- Search for "Calendar API"
- Check if there are limits on:
  - "watch" operations
  - "push" operations
  - "channels" operations

## 5. Try This Alternative
If webhooks still don't work, we can:
- Use shorter polling intervals (every 1-2 minutes instead of 5-15)
- Set up a cron job to sync more frequently
