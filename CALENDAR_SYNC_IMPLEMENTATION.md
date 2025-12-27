# Calendar Sync Implementation Summary

## Overview
This implementation ensures that when an agent's coworker or front desk books a meeting in their external calendar (Google/Microsoft), it:
1. **Instantly becomes unavailable** on the Soradin marketplace
2. **Shows up in the agent portal** alongside Soradin appointments

## What Was Implemented

### 1. Fixed Webhook Setup
- **Files Modified:**
  - `src/app/api/integrations/google/callback/route.ts`
  - `src/app/api/integrations/microsoft/callback/route.ts`
- **Changes:** Webhook setup is now synchronous (awaited) so errors are properly logged and can be retried.

### 2. Webhook Renewal System
- **Files Created:**
  - `src/app/api/integrations/setup-webhooks/route.ts` - Utility endpoint to set up/renew webhooks
- **Files Modified:**
  - `src/lib/calendarWebhooks.ts` - Added `renewExpiredWebhooks()` and `isWebhookExpiredOrExpiring()` functions
  - `src/app/api/integrations/sync/route.ts` - Automatically checks and renews expired webhooks during sync

### 3. External Events in Agent Portal
- **Files Modified:**
  - `src/app/api/appointments/mine/route.ts` - Now includes external calendar events alongside Soradin appointments
  - `src/app/agent/(portal)/schedule/page.tsx` - Displays external events with visual indicators

## How It Works

### Real-Time Sync Flow
1. **Coworker books meeting** in agent's Google/Microsoft calendar
2. **Webhook notification** is sent to Soradin (if webhook is active)
3. **Webhook handler** processes the notification and fetches updated events
4. **External event** is stored in `external_events` table
5. **Availability API** automatically blocks that time slot
6. **Agent portal** displays the external event alongside Soradin appointments

### Fallback: Polling Sync
- If webhooks fail or expire, the polling sync (`/api/integrations/sync`) will catch changes
- Polling runs periodically (via cron) and also renews expired webhooks

## API Endpoints

### Setup/Renew Webhooks
```bash
# Set up missing webhooks for all connections
POST /api/integrations/setup-webhooks

# Set up webhooks for a specific specialist
POST /api/integrations/setup-webhooks?specialistId=<uuid>

# Force re-setup even if webhooks exist (useful for renewal)
POST /api/integrations/setup-webhooks?force=true

# Check webhook status
GET /api/integrations/setup-webhooks
```

### Example: Fix Missing Webhooks
```bash
# For the Google connection you showed (with NULL webhook fields)
curl -X POST "https://your-domain.com/api/integrations/setup-webhooks?specialistId=<specialist-id>"
```

## Webhook Expiration

- **Google Calendar:** Webhooks expire after 7 days (Google's maximum)
- **Microsoft Calendar:** Webhooks expire after 3 days (Microsoft's maximum)
- **Auto-Renewal:** The sync route automatically renews webhooks that are expired or expiring within 24 hours

## Testing

### 1. Test Webhook Setup
```bash
# Check current webhook status
curl "https://your-domain.com/api/integrations/setup-webhooks"

# Set up missing webhooks
curl -X POST "https://your-domain.com/api/integrations/setup-webhooks"
```

### 2. Test External Event Display
1. Connect an agent's calendar (Google or Microsoft)
2. Have a coworker book a meeting in that calendar
3. Check the agent's schedule page - the external meeting should appear
4. Try to book an appointment at that time - it should be blocked

### 3. Test Real-Time Sync
1. Ensure webhooks are set up (check status endpoint)
2. Book a meeting in the agent's external calendar
3. Within seconds, it should appear in the agent portal
4. The time slot should be blocked from booking

## Troubleshooting

### Webhooks Not Working
1. **Check webhook status:**
   ```bash
   GET /api/integrations/setup-webhooks
   ```

2. **Manually set up webhooks:**
   ```bash
   POST /api/integrations/setup-webhooks?force=true
   ```

3. **Check logs** for webhook setup errors in the callback routes

### External Events Not Showing
1. **Check if events are being synced:**
   - Look in `external_events` table for entries with `is_soradin_created = false`
   - Check sync route logs

2. **Verify calendar connection:**
   - Ensure `sync_enabled = true` in `calendar_connections` table
   - Check that OAuth tokens are valid

3. **Trigger manual sync:**
   ```bash
   GET /api/integrations/sync
   ```

## Database Schema

### `external_events` Table
- Stores events from external calendars (Google/Microsoft)
- `is_soradin_created = false` means it was booked externally
- `status = 'confirmed'` events block availability
- Used by availability API to exclude time slots

### `calendar_connections` Table
- `webhook_channel_id` (Google) or `webhook_subscription_id` (Microsoft)
- `webhook_expires_at` - When the webhook subscription expires
- `sync_enabled = true` - Connection is active

## Next Steps

1. **Set up cron job** to call `/api/integrations/sync` every 5-15 minutes
2. **Set up cron job** to call `/api/integrations/setup-webhooks` daily to renew expiring webhooks
3. **Monitor webhook expiration** - check status endpoint regularly
4. **Test with real calendar bookings** to verify end-to-end flow

## Notes

- ICS connections don't use webhooks (they're pull-based), so NULL webhook fields are expected for ICS
- Webhook setup failures are logged but don't block calendar connections (polling will still work)
- External events are automatically cleaned up after 30 days if not linked to appointments

