# Google Calendar Webhook Troubleshooting

## Current Issue
Getting error: `Invalid ttl value for channel -1765043378` when trying to set up Google Calendar webhooks.

## Error Details
- **Error Code:** 400
- **Reason:** `pushInvalidTtl`
- **Message:** `Invalid ttl value for channel -1765043378`

## What We've Verified
✅ Token is valid and working  
✅ Expiration calculation is correct (6 days from now in seconds since epoch)  
✅ Channel ID format is valid  
✅ Request payload format matches Google's API spec  
✅ Webhook URL is accessible (returns 401, which is expected)  

## Possible Causes

### 1. Domain Verification Required
Google may require the webhook URL domain (`soradin.com`) to be verified in Google Cloud Console.

**Check:**
- Go to Google Cloud Console → APIs & Services → Domain Verification
- Verify that `soradin.com` is verified
- If not verified, add it and complete verification

### 2. Calendar API Push Notifications Not Enabled
The Calendar API might need push notifications specifically enabled.

**Check:**
- Go to Google Cloud Console → APIs & Services → Enabled APIs
- Ensure "Google Calendar API" is enabled
- Check if there's a separate "Push Notifications" setting

### 3. OAuth Consent Screen Configuration
The OAuth consent screen might need to be in "Production" mode for webhooks to work.

**Check:**
- Go to Google Cloud Console → APIs & Services → OAuth consent screen
- Ensure app is in "Production" mode (not "Testing")
- Verify all required scopes are approved

### 4. API Quota/Limits
There might be a quota limit on push notification channels.

**Check:**
- Go to Google Cloud Console → APIs & Services → Quotas
- Look for "Calendar API" quotas
- Check if there are limits on "watch" or "push" operations

### 5. Service Account vs OAuth
Webhooks might require a Service Account instead of OAuth user tokens.

**Check:**
- Verify if Google Calendar push notifications work with OAuth user tokens
- Consider if Service Account is required instead

## Next Steps

1. **Verify Domain in Google Cloud Console:**
   - Navigate to Domain Verification
   - Add `soradin.com` if not already verified
   - Complete verification process

2. **Check API Settings:**
   - Ensure Calendar API is fully enabled
   - Look for any "Push Notifications" or "Webhooks" specific settings

3. **Review OAuth Configuration:**
   - Ensure OAuth consent screen is in Production mode
   - Verify scopes include `https://www.googleapis.com/auth/calendar.events`

4. **Test with Google's API Explorer:**
   - Use Google's API Explorer to test the watch endpoint directly
   - This will help isolate if it's a code issue or configuration issue

## Current Workaround

The polling sync (`/api/integrations/sync`) will still work and catch calendar changes every 5-15 minutes. It's not instant like webhooks, but it will work.

## References
- [Google Calendar API - Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [Google Calendar API - Watch Events](https://developers.google.com/calendar/api/v3/reference/events/watch)

