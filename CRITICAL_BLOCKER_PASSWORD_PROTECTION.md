# 🚨 CRITICAL BLOCKER: Password Protection

## The Issue

Your Microsoft Calendar webhook is failing because **password protection is still enabled** and blocking webhook validation requests.

**Evidence from your logs**:
```
Error setting up Microsoft Calendar webhook: 
"Subscription validation request failed. HTTP status code is 'Unauthorized'"
```

This means Microsoft's servers can't validate the webhook because they're being blocked by password protection.

---

## Quick Fix (2 minutes)

### Option 1: Disable Password Protection (Recommended if launching publicly)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Settings** → **Deployment Protection**
4. Find **Password Protection**
5. Toggle it to **OFF** / **Disabled**
6. Click **Save**

**That's it!** Your webhooks will immediately start working.

### Option 2: Keep Password Protection but Allow Webhooks

If you want to keep password protection for some reason:

1. Go to: https://vercel.com/dashboard → Settings → Deployment Protection
2. Find **OPTIONS Allowlist** section
3. Enable it
4. Add these paths:
   - `/api/integrations/microsoft/webhook`
   - `/api/integrations/google/webhook`
5. Save

---

## Verification

After disabling password protection:

1. Try to connect Microsoft Calendar again
2. Check logs - you should no longer see "Unauthorized" errors
3. Webhook should validate successfully

---

## Why This is Safe

Your webhook endpoints already have security:
- They validate tokens from Microsoft/Google
- They check request signatures
- They're not user-facing pages

Disabling password protection doesn't remove security - it just allows Microsoft/Google to reach your webhooks.

---

**This is the #1 blocker. Once you fix this, Microsoft Calendar sync will work!**

