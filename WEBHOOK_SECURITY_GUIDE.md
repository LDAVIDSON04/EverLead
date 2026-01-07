# Webhook Security & Password Protection Guide

## Overview

For **instant webhook sync** to work, the webhook endpoints must be publicly accessible. Vercel's password protection will block webhooks from Google and Microsoft calendars.

## Solution Options

### Option 1: Disable Password Protection (Recommended for Production)

**For Production:**
- Disable Vercel password protection in your production deployment
- Password protection is typically only needed for staging/preview deployments
- Production apps should use proper authentication (Supabase Auth) instead

**To Disable:**
1. Go to Vercel Dashboard → Your Project → Settings → Deployment Protection
2. Disable password protection for production environment
3. Keep it enabled for preview/staging if needed

### Option 2: Use Separate Webhook Deployment (Advanced)

If you must keep password protection, create a separate Vercel deployment specifically for webhooks:
- Create a new Vercel project with only the webhook endpoints
- Keep this deployment public (no password protection)
- Point webhooks to this separate URL

## Current Security Measures

Our webhook endpoints already have multiple security layers:

### 1. **Validation Tokens**
- **Google**: Uses `x-goog-channel-token` header validation (if `GOOGLE_WEBHOOK_SECRET` is set)
- **Microsoft**: Uses validation tokens in query params/body that must be echoed back

### 2. **HTTPS Only**
- All webhook endpoints require HTTPS (enforced by Vercel)

### 3. **IP Validation** (Optional)
- Can be enabled via environment variables:
  - `VALIDATE_GOOGLE_IPS=true` - Validates Google IP ranges
  - `VALIDATE_MICROSOFT_IPS=true` - Validates Microsoft IP ranges
- Currently disabled by default (Google/Microsoft IPs vary widely)

### 4. **Database Validation**
- Webhooks verify calendar connections exist in database before processing
- Events are only saved if linked to valid specialist accounts

### 5. **Rate Limiting**
- Vercel automatically rate limits requests
- Webhook endpoints log all requests for monitoring

## Environment Variables

Optional security configuration:

```bash
# Google Webhook Secret (optional - for additional validation)
GOOGLE_WEBHOOK_SECRET=your-secret-here

# Microsoft Webhook Secret (optional - for additional validation)  
MICROSOFT_WEBHOOK_SECRET=your-secret-here

# Enable IP validation (optional - may block legitimate requests)
VALIDATE_GOOGLE_IPS=true
VALIDATE_MICROSOFT_IPS=true
```

## Testing Webhooks

After disabling password protection:

1. **Test Google Webhook:**
   ```bash
   curl https://your-domain.com/api/integrations/google/webhook
   ```

2. **Test Microsoft Webhook:**
   ```bash
   curl https://your-domain.com/api/integrations/microsoft/webhook?validationToken=test123
   ```

3. Both should return `200 OK` responses

## Monitoring

Check your Vercel logs for:
- `✅ Microsoft webhook validation request received` - Validation successful
- `✅ Google Calendar webhook received` - Webhook processed
- Any warnings about invalid secrets or unknown IPs

## Recommendation

**For instant webhook sync:**
1. Disable password protection in production
2. Keep webhook endpoints public (they're already secured with validation tokens)
3. Monitor logs for any suspicious activity
4. Use Supabase Auth for user authentication (separate from deployment protection)

Password protection is a deployment-level feature for staging/preview environments, not a substitute for proper application-level authentication.

