# Webhook Issues Found in Google Cloud Console

## Critical Issues Found:

### 1. ⚠️ App Verification Required
**Status:** "Your app requires verification by Google"
**Impact:** This might be blocking webhook functionality
**Action:** Go to "Verification Center" and submit for verification

### 2. ⚠️ No Billing Account
**Status:** "Your app does not have an associated Cloud billing account"
**Impact:** Some Google APIs require billing to be enabled
**Action:** Add a billing account to your Google Cloud project

### 3. ⚠️ Project Contacts Issue
**Status:** "Your app does not have the right number of project owners/editors"
**Impact:** May affect API access
**Action:** Add more project owners/editors

### 4. ⚠️ No "Watch" Quotas Visible
**Status:** Only seeing "Queries per minute" quotas, no "watch" or "channels" quotas
**Impact:** Watch operations might not be enabled or have different limits
**Action:** Check if Calendar API watch operations are enabled

## What We Still Need:

### OAuth Consent Screen
**Direct Link:** https://console.cloud.google.com/apis/credentials/consent?project=soradin

**Or:**
1. Go to: APIs & Services → Credentials
2. Look for "OAuth consent screen" tab at the top
3. Screenshot showing:
   - Publishing status (Testing vs Production)
   - Test users list
   - Scopes section

## Next Steps:

1. **Add Billing Account** (Most Important!)
   - Go to: Billing → Link a billing account
   - This might be required for webhook operations

2. **Submit App for Verification**
   - Go to: Verification Center (from OAuth Overview)
   - Submit your app for verification

3. **Check OAuth Consent Screen**
   - See if it's in "Testing" or "Production" mode
   - Verify test users are added

4. **Check for Watch Quotas**
   - In the Quotas page, search for "watch" or "channel"
   - See if there are specific quotas for watch operations

