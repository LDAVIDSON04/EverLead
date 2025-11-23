# Google Maps API Key Setup Guide

## Step 1: Get Your API Key from Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "Soradin Maps")

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - ✅ **Maps JavaScript API** (for the interactive map)
     - ✅ **Geocoding API** (for converting addresses to coordinates)
     - ✅ **Places API** (optional, for better search results)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (it will look like: `AIzaSy...`)

5. **Restrict Your API Key (Recommended for Security)**
   - Click on your newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose only:
     - Maps JavaScript API
     - Geocoding API
     - Places API (if you enabled it)
   - Under "Application restrictions", you can optionally restrict to your domain
   - Click "Save"

## Step 2: Add API Key to Your Project

### For Local Development (.env.local)

Add this line to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with the actual API key you copied.

### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add a new variable:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your API key
   - **Environment**: Production, Preview, and Development (check all)
4. Click "Save"
5. Redeploy your application for changes to take effect

## Step 3: Verify It Works

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Log in as an agent and go to "Available leads"
3. Click the location indicator (top right)
4. The location modal should open with a map
5. If you see an error about the API key, double-check:
   - The key is correct in `.env.local`
   - The required APIs are enabled
   - You've restarted the dev server

## Troubleshooting

**Error: "Google Maps API key not found"**
- Make sure the variable name is exactly `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restart your dev server after adding the key
- Check that the key doesn't have extra spaces

**Error: "This API project is not authorized to use this API"**
- Go back to Google Cloud Console
- Make sure all required APIs are enabled
- Wait a few minutes for changes to propagate

**Map doesn't load**
- Check browser console for errors
- Verify the API key restrictions allow your domain
- Make sure billing is enabled (Google requires a billing account, but gives $200/month free credit)

## Cost Information

- Google Maps provides **$200/month in free credits**
- This covers approximately:
  - 28,000 map loads
  - 40,000 geocoding requests
- For most small-to-medium applications, this is more than enough
- You'll only be charged if you exceed the free tier

