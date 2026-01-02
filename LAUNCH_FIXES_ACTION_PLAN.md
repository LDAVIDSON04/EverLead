# Launch Fixes Action Plan - From 85% to 100% Ready

**Goal**: Fix all critical blockers and recommended improvements to be fully launch-ready

---

## ✅ Quick Checklist

- [ ] **1. Database Migration** (2 minutes) - 🔴 CRITICAL
- [ ] **2. Vercel Password Protection** (10 minutes) - 🔴 CRITICAL  
- [ ] **3. Environment Variables Verification** (15 minutes) - 🔴 CRITICAL
- [ ] **4. Error Monitoring Setup** (1-2 hours) - 🟡 RECOMMENDED
- [ ] **5. End-to-End Testing** (30 minutes) - 🟡 RECOMMENDED

---

## 🔴 CRITICAL FIXES (Must Do Before Launch)

### Fix #1: Run Database Migration ⏱️ 2 minutes

**Why**: Without these indexes, database queries will be 5-10x slower under load. This is critical for performance.

**Steps**:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `supabase/migrations/add_critical_indexes_for_scale.sql`
6. Copy the entire contents of the file
7. Paste into the SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)
9. Verify you see "Success. No rows returned" (indexes don't return rows, this is normal)

**Verification**:
- Check that all indexes were created successfully
- No error messages in the SQL Editor

**File Location**: `supabase/migrations/add_critical_indexes_for_scale.sql`

---

### Fix #2: Configure Vercel Password Protection ⏱️ 10-15 minutes

**Why**: Password protection is blocking Microsoft webhook validation requests, breaking calendar sync.

**Problem**: Vercel's password protection blocks ALL requests, including webhooks from Microsoft/Google.

**Solution Options**:

#### Option A: Remove Password Protection (Recommended for Launch)
If you're ready to launch publicly:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Deployment Protection**
4. Find **Password Protection** section
5. **Disable** password protection
6. Click **Save**

**Note**: Your webhook endpoints already have security (token validation), so they're safe without password protection.

#### Option B: Use Vercel's OPTIONS Allowlist (Alternative)
If you want to keep password protection but allow webhooks:

1. Go to Vercel Dashboard → **Settings** → **Deployment Protection**
2. Find **OPTIONS Allowlist** section
3. Toggle it to **Enabled**
4. Click **Add path**
5. Add: `/api/integrations/microsoft/webhook`
6. Add: `/api/integrations/google/webhook`
7. Save changes

**Recommended**: **Option A** - Remove password protection if you're launching publicly. Your authentication system provides security for user-facing pages, and webhook endpoints validate tokens.

**Verification**:
- Try accessing your site without a password → Should work
- Test Microsoft Calendar sync → Should now work
- Google Calendar sync → Should continue working

---

### Fix #3: Verify Environment Variables ⏱️ 15 minutes

**Why**: Missing environment variables will cause the app to break in production.

**Steps**:
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify all the following variables are set:

#### Required Environment Variables Checklist

##### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

##### Stripe
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)

##### Email (Resend)
- [ ] `RESEND_API_KEY` - Resend API key for sending emails

##### Google Maps
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for geocoding

##### Google OAuth (Calendar Integration)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

##### Microsoft OAuth (Calendar Integration)
- [ ] `MICROSOFT_CLIENT_ID` - Microsoft Azure app client ID
- [ ] `MICROSOFT_CLIENT_SECRET` - Microsoft Azure app client secret
- [ ] `MICROSOFT_TENANT_ID` - Microsoft Azure tenant ID

##### Bot Protection
- [ ] **✅ No environment variable needed** - `botid` package works automatically (already configured in `next.config.ts` and `src/app/layout.tsx`)

**How to Verify Each Variable**:
- Check that each variable has a value (not empty)
- For secret keys, verify they start with the correct prefix (e.g., `sk_` for Stripe, `eyJ` for JWT tokens)
- Test that the app works after verification

**If a Variable is Missing**:
1. Get the value from the service provider (Supabase, Stripe, etc.)
2. Add it in Vercel: **Settings** → **Environment Variables** → **Add New**
3. Select the appropriate environments (Production, Preview, Development)
4. Redeploy if needed (Vercel auto-redeploys on env var changes for some variables)

---

## 🟡 RECOMMENDED FIXES (Do Before Heavy Traffic)

### Fix #4: Set Up Error Monitoring ⏱️ 1-2 hours

**Why**: Currently errors only log to console. You need to know when things break in production.

**Good News**: You already have Vercel Analytics installed! ✅

#### Option A: Use Vercel Analytics & Logs (Easiest - Already Installed!)

**Steps**:
1. Vercel Analytics is already in your `package.json` and `layout.tsx` ✅
2. Go to Vercel Dashboard → Your Project → **Analytics**
3. Enable **Web Analytics** (if not already enabled)
4. For error tracking, check **Logs** section in Vercel Dashboard
5. Monitor logs regularly for errors

**Pros**: Free, already installed, no code changes needed  
**Cons**: Basic error tracking, requires manual log checking

#### Option B: Sentry (Recommended for Production - Optional)

**Why**: Professional error tracking with alerts, stack traces, user context.

**Steps**:
1. Sign up at https://sentry.io (free tier available)
2. Create a new project (choose Next.js)
3. Install Sentry:
   ```bash
   npm install @sentry/nextjs
   ```
4. Run Sentry wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
5. Follow the wizard prompts
6. Add `SENTRY_DSN` to Vercel environment variables
7. Deploy

**Pros**: Professional error tracking, alerts, better debugging  
**Cons**: Requires setup, free tier has limits

**Recommendation**: Start with **Option A** (Vercel Analytics/Logs) for now. You can add Sentry later if you want more advanced monitoring.

**Verification**:
- Trigger a test error in your app
- Check Vercel Logs dashboard
- Verify you can see the error details

---

## ✅ RECOMMENDED: End-to-End Testing ⏱️ 30 minutes

After fixing the critical issues, test these flows:

### Test Flow 1: Family Creates Lead
1. [ ] Go to your public site
2. [ ] Fill out the questionnaire (get-started page)
3. [ ] Submit the form
4. [ ] Verify you receive a confirmation email
5. [ ] Verify the lead appears in your database

### Test Flow 2: Agent Signs Up & Receives Lead
1. [ ] Sign up as a new agent
2. [ ] Complete agent onboarding
3. [ ] Set availability (recurring or daily)
4. [ ] Verify agent receives email notification for the lead you created
5. [ ] Verify lead appears in "Available Leads" page

### Test Flow 3: Agent Purchases Lead & Books Appointment
1. [ ] Agent purchases a lead (Stripe checkout)
2. [ ] Verify payment succeeds
3. [ ] Verify agent can access full lead details
4. [ ] Agent books an appointment with the family
5. [ ] Verify appointment appears in agent's schedule
6. [ ] Verify family receives booking confirmation email

### Test Flow 4: Calendar Sync
1. [ ] Connect Google Calendar (if not already connected)
2. [ ] Verify calendar events sync to schedule page
3. [ ] Connect Microsoft Calendar (this should now work after Fix #2)
4. [ ] Verify Microsoft calendar events sync
5. [ ] Create an appointment in Soradin
6. [ ] Verify it appears in external calendar (if sync is configured)

### Test Flow 5: Payment & Billing
1. [ ] View agent billing page
2. [ ] Check monthly statements
3. [ ] Download a PDF statement
4. [ ] Verify payment history is accurate

---

## 🎯 Summary: What We're Fixing

| Fix | Priority | Time | Impact |
|-----|----------|------|--------|
| Database Migration | 🔴 CRITICAL | 2 min | Performance (5-10x improvement) |
| Password Protection | 🔴 CRITICAL | 10 min | Microsoft Calendar sync (feature broken) |
| Environment Variables | 🔴 CRITICAL | 15 min | App functionality (could break) |
| Error Monitoring | 🟡 RECOMMENDED | 1-2 hrs | Production observability |
| End-to-End Testing | 🟡 RECOMMENDED | 30 min | Confidence in launch |

**Total Time**: ~30 minutes for critical fixes, ~3-4 hours including recommended improvements

---

## 🚀 After Completing These Fixes

1. ✅ **You're 100% launch-ready!**
2. ✅ All critical blockers resolved
3. ✅ System optimized for performance
4. ✅ Production monitoring in place
5. ✅ Confidence from testing

**Next Steps**:
- Launch to a small beta group (soft launch recommended)
- Monitor for issues in first week
- Fix any edge cases discovered
- Full public launch when ready

---

## 📞 Need Help?

If you run into issues with any of these fixes:
1. Check the error messages carefully
2. Review the verification steps
3. Check Vercel/Supabase documentation
4. Test in a preview deployment first

**Most Common Issues**:
- **Database migration errors**: Usually means indexes already exist (safe to ignore duplicate index errors)
- **Password protection won't disable**: Check Vercel plan limits (some plans may not allow disabling)
- **Environment variable not working**: Make sure you redeployed after adding it
- **Calendar sync still broken**: Double-check webhook URLs in OAuth apps match your production domain

---

**You've got this! Let's get Soradin to 100% ready! 🚀**

