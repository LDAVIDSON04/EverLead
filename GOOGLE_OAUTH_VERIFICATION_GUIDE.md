# Google OAuth Verification Guide

## Current Situation
Your app is in "Production" mode but not verified by Google. This causes:
1. The warning screen you're seeing
2. Possibly the webhook TTL error (unverified apps may have API restrictions)

## Option 1: Add Test Users (Quickest - Use Immediately)

You can add test users to your OAuth app so they can use it without verification:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **OAuth consent screen**
3. Scroll down to **"Test users"** section
4. Click **"+ ADD USERS"**
5. Add email addresses of users who need access:
   - Your email (liamdavidson072@gmail.com)
   - Any agent emails who will connect calendars
6. Click **"ADD"**

**Result:** These users can use the app immediately without the warning screen.

**Limitation:** Only test users can use the app. New users will still see the warning.

## Option 2: Submit for Verification (Required for Public Use)

If you want anyone to be able to use the app:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **OAuth consent screen**
3. Click **"PUBLISH APP"** or **"SUBMIT FOR VERIFICATION"**
4. Fill out the verification form:
   - App information
   - Scopes justification (why you need Calendar access)
   - Privacy policy URL
   - Terms of service URL
   - Support email
5. Submit for review

**Timeline:** 1-4 weeks for Google to review and approve

**Required:**
- Privacy Policy URL (must be publicly accessible)
- Terms of Service URL (must be publicly accessible)
- Support email
- Justification for each sensitive scope

## Option 3: Use Testing Mode (Temporary)

You can switch back to "Testing" mode:

1. Go to **OAuth consent screen**
2. Change **"Publishing status"** back to **"Testing"**
3. Add test users
4. Use the app while preparing for verification

**Note:** Testing mode apps expire after 7 days and need to be refreshed.

## Recommendation

**For now:** Use Option 1 (Add Test Users) so you can:
- Use the app immediately
- Test webhooks
- Continue development

**Then:** Submit for verification (Option 2) so the app can be used publicly.

## Webhook Issue

The webhook TTL error might be related to the unverified app status. Once you add test users and the app is properly configured, try setting up the webhook again. Unverified apps in production mode may have restrictions on certain API features.

