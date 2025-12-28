# Webhook Diagnostic Information Needed

## What I Need to See:

### 1. Google Cloud Console Screenshots

**OAuth Consent Screen:**
- Go to: APIs & Services → OAuth consent screen
- Screenshot showing:
  - Publishing status (should say "In production")
  - Test users section
  - Scopes section (should show `calendar.events`)

**Calendar API:**
- Go to: APIs & Services → Enabled APIs
- Search for "Google Calendar API"
- Screenshot showing it's enabled
- Check if there are any additional settings or "Push Notifications" options

**API Quotas:**
- Go to: APIs & Services → Quotas
- Search for "Calendar API"
- Screenshot showing quotas for:
  - "watch" operations
  - "channels" operations
  - Any rate limits

**Credentials:**
- Go to: APIs & Services → Credentials
- Click on your OAuth 2.0 Client ID
- Screenshot showing:
  - Authorized redirect URIs
  - Application type

### 2. What We Know So Far:

✅ **Working:**
- OAuth connection is active
- Tokens are valid
- Calendar sync works (polling every 2 minutes)
- Request format is correct
- Payload is valid

❌ **Not Working:**
- Google API returns: `pushInvalidTtl` error
- Error message: "Invalid ttl value for channel -1765126323"
- The negative number suggests Google is misinterpreting something

### 3. Microsoft Webhooks:

**Question:** Do you have a Microsoft Calendar connection?
- If yes, we should test Microsoft webhooks - they might work even if Google doesn't!
- Microsoft uses a different API and might not have the same issue

### 4. Next Steps:

1. **Share the screenshots above** - this will help identify any missing settings
2. **Test Microsoft webhooks** - if you have Microsoft connected, let's try it
3. **Try alternative approaches** - we can try different webhook formats or methods

## Run This for More Details:

```bash
node test-webhook-detailed.js
```

This shows the exact request/response we're sending to Google.

