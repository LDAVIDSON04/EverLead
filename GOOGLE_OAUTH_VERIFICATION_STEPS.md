# Google OAuth Verification Submission Guide

## Prerequisites Before Submitting

You'll need these ready:
1. ✅ Privacy Policy URL (must be publicly accessible)
2. ✅ Terms of Service URL (must be publicly accessible)  
3. ✅ Support email address
4. ✅ App description explaining why you need Calendar access

## Step-by-Step Verification Process

### Step 1: Prepare Required URLs

**Privacy Policy:**
- Create a privacy policy page at: `https://soradin.com/privacy`
- Or use your existing privacy page if you have one
- Must be publicly accessible (no login required)

**Terms of Service:**
- Create a terms page at: `https://soradin.com/terms`
- Or use your existing terms page if you have one
- Must be publicly accessible (no login required)

**Support Email:**
- Use a support email (e.g., support@soradin.com or your main email)
- This email will receive verification updates from Google

### Step 2: Go to OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** → **OAuth consent screen**

### Step 3: Complete App Information

Fill out all required fields:

**App information:**
- **App name:** Soradin (or your app name)
- **User support email:** Your support email
- **App logo:** Upload a logo (optional but recommended)
- **Application home page:** `https://soradin.com`
- **Application privacy policy link:** `https://soradin.com/privacy`
- **Application terms of service link:** `https://soradin.com/terms`
- **Authorized domains:** Add `soradin.com`

**Developer contact information:**
- **Email addresses:** Your email (liamdavidson072@gmail.com)

### Step 4: Review Scopes

Google will show you the scopes you're requesting:
- `https://www.googleapis.com/auth/calendar.events`

**For each scope, you'll need to justify:**
- **Why you need this scope:** 
  Example: "We need calendar access to sync appointments between our platform and agents' Google Calendars. This allows agents to see their Soradin appointments in their Google Calendar and prevents double-booking when their front desk schedules meetings."

### Step 5: Submit for Verification

1. Scroll to the bottom of the OAuth consent screen
2. Click **"SUBMIT FOR VERIFICATION"** or **"PUBLISH APP"**
3. Fill out the verification form:
   - **App type:** Web application
   - **Scopes justification:** Explain why you need Calendar access
   - **How you use the data:** Explain that you only access calendar events to sync appointments
   - **Data handling:** Explain your data security practices
4. Submit the form

### Step 6: Wait for Review

**Timeline:**
- Initial review: 1-3 business days
- If more info needed: Additional 1-2 weeks
- Total: Usually 1-4 weeks

**What happens:**
- Google will review your submission
- They may ask for additional information
- You'll receive emails at your support email with updates

## Quick Start: Add Test Users NOW

While waiting for verification, add test users so you can use the app immediately:

1. In **OAuth consent screen**, scroll to **"Test users"**
2. Click **"+ ADD USERS"**
3. Add emails of agents who need access now
4. Click **"ADD"**

**Result:** These users can use the app immediately without waiting for verification.

## What You Need to Create

### Privacy Policy Page

Create `/privacy` page with:
- What data you collect
- How you use it
- How you protect it
- Contact information

### Terms of Service Page

Create `/terms` page with:
- Terms of use
- User responsibilities
- Service limitations
- Contact information

## Verification Justification Example

**Why you need Calendar access:**
```
Our application syncs appointments between the Soradin platform and 
agents' Google Calendars. This integration allows:

1. Agents to see their Soradin appointments in their Google Calendar
2. Automatic blocking of time slots when front desk staff books meetings
3. Real-time sync to prevent double-booking
4. Two-way calendar synchronization

We only access calendar events (read/write) and do not access any 
other Google data. All calendar data is handled securely and in 
accordance with our privacy policy.
```

## After Submission

1. **Check email regularly** - Google will contact you via your support email
2. **Respond quickly** - If they ask for more info, respond within 48 hours
3. **Monitor status** - Check the OAuth consent screen for status updates

## Status Meanings

- **Draft:** Not submitted yet
- **Testing:** Only test users can use it
- **In production (unverified):** Anyone can see it but will get warning
- **In production (verified):** Fully verified, no warnings

## Important Notes

- **You can still use the app** with test users while waiting
- **Verification is required** for public use (any agent can connect)
- **The process takes time** - plan for 1-4 weeks
- **Be thorough** in your justification - incomplete info delays approval

