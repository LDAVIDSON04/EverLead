# Supabase Security Issues - Fix Guide

This document addresses the two security issues detected in your Supabase project.

## Issue 1: Function `public.is_admin` has a role mutable search_path

### What This Means

The `is_admin` function uses `SECURITY DEFINER`, which means it runs with the privileges of the function owner. Without a fixed `search_path`, this creates a security vulnerability where an attacker could potentially manipulate the search_path to execute malicious code in a different schema context.

### Fix Applied

A migration has been created (`fix_is_admin_function_search_path.sql`) that:

1. Sets a fixed `search_path = ''` (empty string) on the function
2. This forces the use of fully qualified names (like `public.profiles`)
3. Prevents search_path manipulation attacks

The function already uses fully qualified names (`public.profiles`), so this change is safe and maintains the same functionality.

### How to Apply

1. **Option A: Run the migration automatically** (if using Supabase CLI):
   ```bash
   supabase migration up
   ```

2. **Option B: Run manually in Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Open the file `supabase/migrations/fix_is_admin_function_search_path.sql`
   - Copy and paste the SQL into the editor
   - Click **Run**

### Verification

After applying the fix, verify it worked:

1. Go to **Database** → **Functions** in Supabase dashboard
2. Find the `is_admin` function
3. Check that it shows `search_path = ''` in the function definition
4. The security warning should disappear after a few minutes

---

## Issue 2: Enable HaveIBeenPwned Password Checking

### What This Means

HaveIBeenPwned is a database of billions of leaked passwords. Supabase Auth can check user passwords against this database to prevent users from using compromised passwords that have been exposed in data breaches.

### Why This Matters

- **Security**: Prevents users from using passwords that are known to be compromised
- **Best Practice**: Recommended security practice for all applications
- **User Protection**: Helps protect users even if they reuse passwords elsewhere

### How to Enable

**Steps:**

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Go to **Authentication** → **Settings**

2. **Find Password Policy Section:**
   - Scroll down to find password policy settings
   - Look for "Password Security" or "HaveIBeenPwned" option

3. **Enable the Feature:**
   - Toggle ON "Check passwords against HaveIBeenPwned database"
   - Or look for "Enable breached password detection"
   - Save the settings

4. **Alternative (if not in UI):**
   - Go to **Authentication** → **URL Configuration** or **Providers**
   - Look for password policy settings
   - Enable "Breached Password Detection" or similar

### What Happens After Enabling

- New users registering will have their passwords checked
- If a password is found in the HaveIBeenPwned database, registration will be rejected
- Users will see a message like: "This password has been found in a data breach. Please choose a different password."
- Existing users are not affected (only new registrations/password changes)

### Privacy Note

Supabase uses the HaveIBeenPwned API in a privacy-preserving way:
- Only a hash prefix of the password is sent (not the full password)
- The actual password never leaves your server
- The check happens server-side through Supabase's infrastructure

### Verification

After enabling:

1. Try registering a test user with a known compromised password (like "password123")
2. You should see an error message indicating the password has been breached
3. The security warning in Supabase dashboard should disappear after a few minutes

---

## Summary Checklist

- [ ] Applied migration `fix_is_admin_function_search_path.sql`
- [ ] Verified `is_admin` function has fixed search_path
- [ ] Enabled HaveIBeenPwned password checking in Auth settings
- [ ] Tested that compromised passwords are rejected
- [ ] Verified both security warnings are resolved in Supabase dashboard

---

## Additional Security Recommendations

1. **Enable MFA (Multi-Factor Authentication)** for admin users
2. **Review RLS Policies** regularly to ensure proper access control
3. **Monitor Authentication Logs** for suspicious activity
4. **Keep Supabase CLI and dependencies updated**
5. **Use strong API keys** and rotate them periodically
6. **Enable rate limiting** on authentication endpoints (if available)

---

## Support

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Security Guide**: https://supabase.com/docs/guides/platform/security
- **HaveIBeenPwned**: https://haveibeenpwned.com/API/v3

