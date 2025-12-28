# Google Calendar Webhook Issue - Support Needed

## Current Status

**Error:** `pushInvalidTtl` - "Invalid ttl value for channel -1765129336"

**What We've Tried:**
1. ✅ Added billing account
2. ✅ Verified OAuth settings
3. ✅ Tested different expiration formats
4. ✅ Tested without expiration parameter
5. ✅ Tested different channel ID formats
6. ✅ Verified request format matches Google's API spec

**Result:** Error persists with negative number, suggesting Google API is misinterpreting the request

## Likely Causes

1. **App Verification Required**
   - Your app shows "requires verification by Google"
   - Webhooks might require verified apps, even with test users
   - **Action:** Complete app verification process

2. **Google API Bug**
   - The negative number in error suggests Google is calculating TTL incorrectly
   - This might be a known Google API issue
   - **Action:** Contact Google Support

3. **Missing API Feature**
   - Watch operations might need to be enabled separately
   - Or there might be a quota/limit we're hitting
   - **Action:** Check with Google Support

## Next Steps

### Option 1: Complete App Verification
1. Go to: Verification Center (from OAuth Overview)
2. Submit your app for verification
3. Wait for Google's approval (1-4 weeks)
4. Try webhook setup again after verification

### Option 2: Contact Google Support
- Report the `pushInvalidTtl` error with negative number
- Provide the exact error message
- Ask if webhooks require app verification
- Ask if there's a known issue with this error

### Option 3: Use Polling (Current Workaround)
- Polling every 2 minutes is working
- Provides near-instant sync (2 min delay)
- This is a reliable workaround until webhooks work

## Current Workaround Status

✅ **Calendar sync is working** via polling every 2 minutes
✅ **Two-way sync works** - appointments sync both ways
✅ **Time blocking works** - external events block Soradin slots
⚠️ **Not instant** - 2 minute delay instead of seconds

