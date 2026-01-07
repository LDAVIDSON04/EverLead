# Enable HaveIBeenPwned Password Checking

## Overview

HaveIBeenPwned is a security feature that checks user passwords against a database of billions of compromised passwords from known data breaches. This prevents users from using passwords that have been exposed and are vulnerable to attacks.

## Why Enable This?

- **Prevents weak passwords**: Blocks passwords that have been compromised in data breaches
- **Security best practice**: Industry standard for preventing credential stuffing attacks
- **Zero impact on users**: Only rejects compromised passwords during signup/password change
- **Privacy-preserving**: Supabase uses k-anonymity API - passwords are never sent to HaveIBeenPwned in full

## How to Enable

### Step 1: Open Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar

### Step 2: Access Password Settings

1. Click on **Policies** tab (or **Settings** → **Auth**)
2. Scroll down to find **Password** section
3. Look for **Password Security** or **Security** subsection

### Step 3: Enable HaveIBeenPwned Check

1. Find the toggle/checkbox labeled:
   - "Check passwords against HaveIBeenPwned database"
   - OR "Password breach detection"
   - OR "HaveIBeenPwned integration"

2. **Toggle it ON** ✅

3. Save the changes

## Alternative Path (if above doesn't work)

Some Supabase projects have this setting in a different location:

1. Go to **Authentication** → **Configuration**
2. Look for **Password** settings
3. Enable **"Breach detection"** or **"HaveIBeenPwned"**

## What Happens When Enabled?

### During Signup:
- User tries to create account with password
- Password is checked against HaveIBeenPwned (using k-anonymity)
- If password is found in breach database → **Signup is rejected**
- User sees error: *"This password has appeared in a data breach and cannot be used"*

### During Password Change:
- Same validation applies when users change their password
- Existing passwords are NOT checked (only new passwords)

### Privacy Protection:
- Only first 5 characters of password hash are sent to HaveIBeenPwned API
- Full password is NEVER transmitted
- Uses k-anonymity protocol for privacy

## Testing

After enabling:

1. Try to sign up with a known compromised password (e.g., "Password123")
2. Should see error message about password breach
3. Try with a unique, strong password - should work normally

## Troubleshooting

### Can't Find the Setting:
- Make sure you're on the **latest Supabase project version**
- Try searching for "HaveIBeenPwned" or "breach" in settings
- Check if there's a **"Security"** section under Authentication

### Feature Not Available:
- Some older Supabase projects may need to be migrated
- Contact Supabase support if the option doesn't appear

### False Positives:
- Very rare, but if a user has a legitimate unique password that's blocked:
  - They can try a slightly modified version
  - Or contact support for assistance

## Impact on Existing Users

✅ **No impact on existing users:**
- Only applies to NEW passwords (signup or password change)
- Existing passwords continue to work normally
- Users won't be forced to change passwords

## Best Practices

1. **Enable this feature** - It's a security best practice with minimal downside
2. **Combine with password requirements**:
   - Minimum length (already set to 6 characters)
   - Consider requiring uppercase, lowercase, numbers
   - Add this via Supabase Auth settings

3. **Monitor rejection rates**:
   - Check Auth logs for password breach rejections
   - High rejection rate may indicate users need password education

## Additional Security Recommendations

While enabling HaveIBeenPwned:

1. ✅ **Enable HaveIBeenPwned** (this guide)
2. ✅ **Set minimum password length** (already 6 characters - consider increasing to 8+)
3. ✅ **Consider password complexity requirements** (uppercase, lowercase, numbers)
4. ✅ **Enable email verification** (prevent fake accounts)
5. ✅ **Set up rate limiting** (prevent brute force attacks)
6. ✅ **Enable MFA** (multi-factor authentication) for admin accounts

## Verification Checklist

After enabling, verify:

- [ ] Setting is toggled ON in Supabase Dashboard
- [ ] Test signup with compromised password (should fail)
- [ ] Test signup with unique password (should succeed)
- [ ] Existing users can still log in normally
- [ ] Password changes are validated

## Need Help?

If you encounter issues:
1. Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/password-reset)
2. Review [HaveIBeenPwned API documentation](https://haveibeenpwned.com/API/v3)
3. Contact Supabase support if feature is unavailable

