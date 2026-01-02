# Pre-Launch Checklist (Excluding Password Protection)

Since you're keeping password protection on until launch, here's everything else to verify for 100% readiness.

---

## ✅ Things to Verify (Do These Now)

### 1. Database Migration ⏱️ 2 minutes

**Status**: You think this is done ✅

**Quick Verification**:
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if indexes exist:
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'leads', 'appointments')
  AND indexname IN (
    'idx_profiles_agent_province',
    'idx_leads_province',
    'idx_leads_city',
    'idx_leads_assigned_agent_id',
    'idx_appointments_agent_id'
  )
ORDER BY indexname;
```

**If you see all 5+ indexes**: ✅ Done!
**If indexes are missing**: Run `supabase/migrations/add_critical_indexes_for_scale.sql`

---

### 2. Environment Variables ⏱️ 5 minutes

**Status**: You think this is done ✅

**Quick Check**:
- Does your production site work? → If yes, most env vars are set ✅
- Can agents sign up? → If yes, Supabase is configured ✅
- Can payments process? → If yes, Stripe is configured ✅
- Can emails send? → If yes, Resend is configured ✅

**Full Checklist** (verify in Vercel → Settings → Environment Variables):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `MICROSOFT_CLIENT_ID`
- [ ] `MICROSOFT_CLIENT_SECRET`
- [ ] `MICROSOFT_TENANT_ID`

---

### 3. Error Monitoring ⏱️ Already Done ✅

**Status**: Vercel Analytics is already installed and configured!

**Verification**:
- Go to Vercel Dashboard → Analytics
- Should show web analytics data
- Check **Logs** section for error tracking

**Optional Upgrade** (not required):
- Can add Sentry later if you want more advanced error tracking
- Current setup with Vercel is fine for launch

---

### 4. End-to-End Testing ⏱️ 30 minutes (Recommended)

**Test These Critical Flows**:

#### Flow 1: Family Creates Lead
- [ ] Fill out questionnaire on get-started page
- [ ] Submit form
- [ ] Receive confirmation email
- [ ] Lead appears in database (check admin/agent view)

#### Flow 2: Agent Workflow
- [ ] Agent can sign up
- [ ] Agent can set availability
- [ ] Agent receives lead notification email
- [ ] Lead appears in "Available Leads" page
- [ ] Agent can purchase lead
- [ ] Agent can book appointment
- [ ] Appointment appears in schedule

#### Flow 3: Calendar Sync (Will work after password protection disabled)
- [ ] Google Calendar sync works (test now)
- [ ] Microsoft Calendar sync (will work after launch when password protection is disabled)

#### Flow 4: Payments
- [ ] Stripe checkout works
- [ ] Payment confirmation emails send
- [ ] Billing statements generate correctly
- [ ] PDF download works

---

### 5. Documentation & Support (Optional but Recommended)

- [ ] Terms of Service (if applicable)
- [ ] Privacy Policy (if applicable)
- [ ] Support email/channel set up
- [ ] Basic agent onboarding guide (optional)

---

## 🚀 At Launch Time (Password Protection)

**When you're ready to launch publicly**:

1. Go to Vercel Dashboard → Settings → Deployment Protection
2. **Disable Password Protection**
3. **OR** use OPTIONS Allowlist to allow webhook endpoints:
   - Add `/api/integrations/microsoft/webhook`
   - Add `/api/integrations/google/webhook`
4. Test Microsoft Calendar sync immediately after disabling
5. Verify everything still works

**Note**: Calendar sync (especially Microsoft) won't work until password protection is disabled, but that's fine - you can enable it at launch.

---

## ✅ Summary: What's Left to Do

| Item | Status | Action Needed |
|------|--------|---------------|
| Database Migration | 🤔 Verify | Run SQL query to confirm indexes exist |
| Environment Variables | 🤔 Verify | Quick test of site functionality |
| Error Monitoring | ✅ Done | Vercel Analytics already installed |
| Testing | 🟡 Recommended | Test critical user flows |
| Password Protection | ⏸️ At Launch | Disable when ready to launch publicly |

---

## 🎯 Bottom Line

**You're probably 95% ready!** 

The main things to verify:
1. **Database indexes** - Quick SQL query check (2 min)
2. **End-to-end testing** - Make sure core flows work (30 min)
3. **At launch**: Disable password protection (2 min)

Everything else seems to be in place. Once you verify the database migration and do a quick test of your core flows, you're essentially ready to launch!

**Want me to help you verify the database migration status or create a testing script?**

