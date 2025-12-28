# How to Find the Missing Google Cloud Console Pages

## 1. OAuth Consent Screen (Most Important!)

**Direct Link:**
https://console.cloud.google.com/apis/credentials/consent?project=soradin

**Or Navigate:**
1. In Google Cloud Console, click the hamburger menu (☰) in the top left
2. Go to: **APIs & Services** → **OAuth consent screen**
3. You should see:
   - Publishing status (should say "In production")
   - Test users section (where you added your email)
   - Scopes section (should show `calendar.events`)

**What to Screenshot:**
- The entire OAuth consent screen page
- Especially the "Publishing status" section at the top
- The "Scopes" section showing what permissions you're requesting

## 2. API Quotas Page

**Direct Link:**
https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas?project=soradin

**Or Navigate:**
1. In Google Cloud Console, click the hamburger menu (☰)
2. Go to: **APIs & Services** → **Quotas**
3. In the search box at the top, type: `Calendar API`
4. Look for quotas related to:
   - "watch" operations
   - "channels" operations
   - Any rate limits

**What to Screenshot:**
- The quotas page after searching for "Calendar API"
- Any quotas that mention "watch" or "channels"

## Alternative: Check OAuth Consent Screen via Different Path

If you can't find it via the menu:
1. Go to: **APIs & Services** → **Credentials**
2. At the top of that page, you should see tabs or links
3. Look for "OAuth consent screen" tab or link
4. Click it

## What We're Looking For:

**OAuth Consent Screen:**
- ✅ Publishing status: "In production" (not "Testing")
- ✅ Test users: Your email should be listed
- ✅ Scopes: Should include `https://www.googleapis.com/auth/calendar.events`

**API Quotas:**
- Any limits on "watch" or "channels" operations
- Daily/hourly rate limits

