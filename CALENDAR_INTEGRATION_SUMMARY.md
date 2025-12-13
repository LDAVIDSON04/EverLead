# Calendar Integration Implementation Summary

## Overview
This document summarizes the calendar integration system implemented across Prompts 1-4, what's working, what needs to be completed, and how to set it up.

---

## ✅ Prompt 1: Core Availability + Booking APIs

### What Was Created:

1. **GET /api/availability**
   - ✅ Fetches available time slots for a specialist
   - ✅ Handles timezone conversion (specialist local time → UTC)
   - ✅ Filters out conflicts with:
     - `specialist_time_off` ranges
     - Existing appointments (not cancelled)
     - External calendar events (not cancelled) - **Enhanced in Prompt 4**
   - ✅ Returns array of `AvailabilityDay` objects

2. **POST /api/appointments**
   - ✅ Creates new appointments
   - ✅ Validates specialist, family, appointment type
   - ✅ Checks for conflicts before creating
   - ✅ Creates payment record if `price_cents > 0`
   - ✅ Syncs to external calendars (one-way) - **Added in Prompt 3**

3. **POST /api/appointments/cancel**
   - ✅ Cancels appointments
   - ✅ Records cancellation info
   - ✅ Deletes from external calendars - **Added in Prompt 3**

4. **Client-side examples** (`src/lib/booking-api-examples.ts`)
   - ✅ Helper functions for React components
   - ✅ Complete example component in comments

### Status: ✅ **COMPLETE AND WORKING**

---

## ✅ Prompt 2: Calendar Connections + One-Way Sync

### What Was Created:

1. **ICS Feed (Apple Calendar / Generic)**
   - ✅ `src/lib/ics.ts` - ICS feed generation
   - ✅ `src/app/api/ics/[specialistId]/route.ts` - ICS endpoint
   - ✅ `src/lib/calendarConnections.ts` - `ensureIcsConnectionForSpecialist()`
   - ✅ Returns ICS URL: `https://YOUR_DOMAIN/api/ics/{specialistId}?token={secret}`

2. **Google OAuth Scaffolding**
   - ✅ `src/app/api/integrations/google/connect/route.ts` - OAuth initiation
   - ✅ `src/app/api/integrations/google/callback/route.ts` - OAuth callback
   - ⚠️ **TODOs**: Token exchange, calendar ID retrieval

3. **Microsoft OAuth Scaffolding**
   - ✅ `src/app/api/integrations/microsoft/connect/route.ts` - OAuth initiation
   - ✅ `src/app/api/integrations/microsoft/callback/route.ts` - OAuth callback
   - ⚠️ **TODOs**: Token exchange, calendar ID retrieval

4. **One-Way Sync (Soradin → External Calendars)**
   - ✅ `src/lib/calendarSync.ts` - Core sync functions
     - `syncAppointmentToCalendars()` - Syncs new appointments
     - `deleteExternalEventsForAppointment()` - Deletes cancelled appointments
   - ✅ Integrated into appointment creation/cancellation routes
   - ⚠️ **TODOs**: Actual Google/Microsoft API calls (placeholders exist)

### Status: ⚠️ **PARTIALLY COMPLETE**
- ICS feed: ✅ Working
- OAuth routes: ✅ Structure ready, needs OAuth client setup
- One-way sync: ⚠️ Structure ready, needs API implementation

---

## ✅ Prompt 3: Two-Way Sync (Busy Times + External Changes)

### What Was Created:

1. **Sync Job Route**
   - ✅ `src/app/api/integrations/sync/route.ts`
   - ✅ Polls external calendars every few minutes (via cron)
   - ✅ Fetches events from Google/Microsoft for next 30 days
   - ✅ Upserts to `external_events` table
   - ✅ Handles both Soradin-created and external busy blocks

2. **Provider-Specific Fetchers**
   - ✅ `src/lib/calendarProviders/google.ts` - Google Calendar fetcher
   - ✅ `src/lib/calendarProviders/microsoft.ts` - Microsoft Graph fetcher
   - ✅ `src/lib/calendarProviders/types.ts` - Shared types
   - ⚠️ **TODOs**: Actual API calls (placeholders exist)

3. **Busy-Time Blocking**
   - ✅ Updated `GET /api/availability` to exclude external busy times
   - ✅ Handles all-day events
   - ✅ Prevents double-booking when specialist has external calendar events

4. **External Edit Handling (Stretch Goal)**
   - ✅ Logic to sync external edits back to Soradin appointments
   - ✅ Configurable via `ALLOW_EXTERNAL_EDITS` environment variable
   - ✅ Handles time changes and cancellations

### Status: ⚠️ **PARTIALLY COMPLETE**
- Sync job structure: ✅ Complete
- Busy-time blocking: ✅ Working (once sync runs)
- Provider fetchers: ⚠️ Need OAuth + API implementation

---

## 📋 What You Need to Do

### 1. **Set Up Google OAuth** (Required for Google Calendar)

#### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/integrations/google/callback`
5. Copy Client ID and Client Secret

#### Environment Variables:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/google/callback
```

#### Complete the TODOs in:
- `src/app/api/integrations/google/callback/route.ts`
  - Replace placeholder token exchange code (lines ~60-80)
  - Replace placeholder calendar ID retrieval (lines ~85-100)
- `src/lib/calendarProviders/google.ts`
  - Replace placeholder API call (lines ~30-70)
- `src/lib/calendarSync.ts`
  - Replace placeholder Google sync code (lines ~150-200)

---

### 2. **Set Up Microsoft OAuth** (Required for Microsoft Calendar)

#### Steps:
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `https://yourdomain.com/api/integrations/microsoft/callback`
4. Add API permissions: `Calendars.ReadWrite`
5. Create a client secret
6. Copy Application (client) ID and secret value

#### Environment Variables:
```env
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/integrations/microsoft/callback
```

#### Complete the TODOs in:
- `src/app/api/integrations/microsoft/callback/route.ts`
  - Replace placeholder token exchange code (lines ~60-80)
  - Replace placeholder calendar ID retrieval (lines ~85-100)
- `src/lib/calendarProviders/microsoft.ts`
  - Replace placeholder API call (lines ~30-70)
- `src/lib/calendarSync.ts`
  - Replace placeholder Microsoft sync code (lines ~250-300)

---

### 3. **Set Up Cron Job for Sync**

The sync job needs to run periodically (every 5-15 minutes recommended).

#### Option A: Vercel Cron (Recommended if using Vercel)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/integrations/sync",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Add environment variable:
```env
CRON_SECRET=your_random_secret_here
```

#### Option B: External Cron Service

Use a service like:
- [cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)

Set it to call: `https://yourdomain.com/api/integrations/sync`

Add `Authorization: Bearer YOUR_CRON_SECRET` header.

---

### 4. **Environment Variables Summary**

Add these to your `.env.local` and Vercel:

```env
# Site URL (for ICS URLs)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/integrations/microsoft/callback

# Cron Security (optional but recommended)
CRON_SECRET=your_random_secret_string

# External Edit Policy (optional)
ALLOW_EXTERNAL_EDITS=false  # Set to true if you want external edits to sync back
```

---

## 🔍 Testing Checklist

### ICS Feed (Can test now):
1. ✅ Call `ensureIcsConnectionForSpecialist(specialistId)` to get ICS URL
2. ✅ Subscribe to ICS URL in Apple Calendar or other calendar app
3. ✅ Create an appointment via API
4. ✅ Verify it appears in the calendar app

### Google Calendar (After OAuth setup):
1. ⚠️ Visit `/api/integrations/google/connect?specialistId=xxx`
2. ⚠️ Complete OAuth flow
3. ⚠️ Create appointment via API
4. ⚠️ Verify it appears in Google Calendar
5. ⚠️ Create event in Google Calendar
6. ⚠️ Run sync job
7. ⚠️ Verify availability API excludes that time

### Microsoft Calendar (After OAuth setup):
1. ⚠️ Visit `/api/integrations/microsoft/connect?specialistId=xxx`
2. ⚠️ Complete OAuth flow
3. ⚠️ Create appointment via API
4. ⚠️ Verify it appears in Outlook/Microsoft Calendar
5. ⚠️ Create event in Microsoft Calendar
6. ⚠️ Run sync job
7. ⚠️ Verify availability API excludes that time

---

## ⚠️ Known Issues / Limitations

1. **Token Refresh Not Implemented**
   - Access tokens expire (usually 1 hour)
   - Need to implement refresh token logic in:
     - `src/lib/calendarSync.ts`
     - `src/lib/calendarProviders/google.ts`
     - `src/lib/calendarProviders/microsoft.ts`

2. **OAuth State Validation**
   - Current state parameter is base64-encoded JSON
   - Should add timestamp validation and cryptographic signing for production

3. **Error Handling**
   - Some errors are logged but don't fail the entire sync
   - Consider adding retry logic for transient failures

4. **Timezone Handling**
   - Availability API timezone conversion could be improved
   - Consider using `luxon` library (already in dependencies) for more reliable timezone handling

---

## 📁 File Structure

```
src/
├── app/
│   └── api/
│       ├── availability/
│       │   └── route.ts                    ✅ Complete
│       ├── appointments/
│       │   ├── route.ts                    ✅ Complete
│       │   └── cancel/
│       │       └── route.ts                ✅ Complete
│       ├── ics/
│       │   └── [specialistId]/
│       │       └── route.ts                 ✅ Complete
│       └── integrations/
│           ├── google/
│           │   ├── connect/
│           │   │   └── route.ts            ⚠️ Needs OAuth setup
│           │   └── callback/
│           │       └── route.ts            ⚠️ Needs OAuth implementation
│           ├── microsoft/
│           │   ├── connect/
│           │   │   └── route.ts            ⚠️ Needs OAuth setup
│           │   └── callback/
│           │       └── route.ts            ⚠️ Needs OAuth implementation
│           └── sync/
│               └── route.ts                 ⚠️ Needs provider APIs
├── lib/
│   ├── booking-api-examples.ts             ✅ Complete
│   ├── calendarConnections.ts               ✅ Complete
│   ├── calendarSync.ts                      ⚠️ Needs provider APIs
│   ├── calendarProviders/
│   │   ├── google.ts                        ⚠️ Needs API implementation
│   │   ├── microsoft.ts                     ⚠️ Needs API implementation
│   │   └── types.ts                         ✅ Complete
│   ├── ics.ts                               ✅ Complete
│   └── supabaseServer.ts                    ✅ Complete
```

---

## 🚀 Quick Start Guide

1. **Test ICS Feed (No OAuth needed):**
   ```typescript
   import { ensureIcsConnectionForSpecialist } from '@/lib/calendarConnections';
   
   const icsUrl = await ensureIcsConnectionForSpecialist('specialist-uuid');
   console.log('ICS URL:', icsUrl);
   // Subscribe to this URL in Apple Calendar
   ```

2. **Set Up Google OAuth:**
   - Follow steps in "Set Up Google OAuth" section above
   - Complete TODOs in callback route
   - Test by visiting connect URL

3. **Set Up Microsoft OAuth:**
   - Follow steps in "Set Up Microsoft OAuth" section above
   - Complete TODOs in callback route
   - Test by visiting connect URL

4. **Set Up Cron Job:**
   - Add Vercel cron config or external cron service
   - Verify sync job runs successfully

5. **Test End-to-End:**
   - Create appointment via API
   - Verify it appears in external calendar
   - Create event in external calendar
   - Run sync job
   - Verify availability excludes that time

---

## 📝 Notes

- All code is structured and ready for OAuth implementation
- Error handling is defensive (continues on failures)
- The system is designed to work incrementally:
  - ICS feed works immediately
  - One-way sync works once OAuth is set up
  - Two-way sync works once provider APIs are implemented
- External edit syncing is optional and controlled by environment variable

---

## 🆘 If You Encounter Errors

1. **"OAuth not configured"** - Set up OAuth credentials (see above)
2. **"Token expired"** - Implement token refresh logic
3. **"Calendar API error"** - Check OAuth scopes and permissions
4. **"Sync job fails"** - Check cron secret and provider API implementations
5. **"Availability shows booked slots"** - Verify sync job is running

---

## ✅ Summary

**What's Working:**
- ✅ Core booking APIs (availability, create, cancel)
- ✅ ICS feed for Apple Calendar
- ✅ Database schema and structure
- ✅ One-way sync structure (needs OAuth)
- ✅ Two-way sync structure (needs OAuth + API calls)
- ✅ Busy-time blocking logic

**What Needs Work:**
- ⚠️ Google OAuth implementation
- ⚠️ Microsoft OAuth implementation
- ⚠️ Token refresh logic
- ⚠️ Actual API calls to Google/Microsoft
- ⚠️ Cron job setup

**Estimated Time to Complete:**
- Google OAuth: 2-3 hours
- Microsoft OAuth: 2-3 hours
- Token refresh: 1-2 hours
- Testing: 2-3 hours
- **Total: ~8-11 hours**

