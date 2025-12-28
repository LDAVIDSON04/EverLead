# Google Cloud Console Domain Verification for Webhooks

## Step 1: Go to Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project (the one with your OAuth app)

## Step 2: Navigate to Domain Verification

1. Click the hamburger menu (☰) in the top left
2. Go to: **APIs & Services** → **Domain Verification**
   - Direct link: https://console.cloud.google.com/apis/credentials/domainverification

## Step 3: Add Your Domain

1. Click **"ADD DOMAIN"** or **"VERIFY A NEW DOMAIN"**
2. Enter: `soradin.com`
3. Click **"CONTINUE"** or **"VERIFY"**

## Step 4: Get the TXT Record

Google will show you a TXT record to add:
- **Name/Host:** `@` or `soradin.com` (or leave blank for root)
- **Type:** `TXT`
- **Value:** Something like `google-site-verification=XXXXXXXXXXXXX`

## Step 5: Add TXT Record in Squarespace

1. Go to your Squarespace DNS settings (where you just added the Google Workspace one)
2. Click **"ADD RECORD"** or **"ADD PRESET"**
3. Select **"TXT"** record type
4. Add:
   - **HOST:** `@` (or leave blank)
   - **TYPE:** `TXT`
   - **DATA:** The full value from Google (including `google-site-verification=`)
5. Click **"SAVE"**

## Step 6: Verify in Google Cloud Console

1. Go back to Google Cloud Console → Domain Verification
2. Click **"VERIFY"** or wait for automatic verification
3. It may take a few minutes to propagate

## Step 7: Test Webhook Again

Once verified, we'll try setting up the webhook again.

