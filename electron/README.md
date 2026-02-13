# Soradin Agent Portal – Desktop App (Electron)

This folder contains the Electron wrapper so agents can use the Soradin agent portal as a desktop app (Mac/Windows) instead of only in the browser.

## What it does

- **Welcome screen** first: **Create account** (in-app 3-step form) or **Log in** (in-app login with email/password).
- **In-app login**: Log in without leaving the app; you’re then taken to the agent portal. Your session is **remembered** so next time you open the app you go straight to the portal.
- Same portal and features as the web; external links (e.g. password reset, help) open in the system browser.

## Prerequisites

- Node.js 18+
- npm (or yarn)

## Auth config (required for login)

The app needs your Supabase project URL and anon key to log in. **Do not commit real keys.**

1. Copy the example file:
   ```bash
   cp auth-config.example.json auth-config.json
   ```
2. Edit `auth-config.json` and set:
   - `url`: your Supabase project URL (same as `NEXT_PUBLIC_SUPABASE_URL`, e.g. `https://xxxx.supabase.co`)
   - `anonKey`: your Supabase anon key (same as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

Alternatively set env vars when running: `ELECTRON_SUPABASE_URL` and `ELECTRON_SUPABASE_ANON_KEY`.

From the repo root you can generate `auth-config.json` from `.env.local` (if it has the Supabase vars):

```bash
node electron/create-auth-config.js
```

`auth-config.json` is gitignored so it won’t be committed.

## Run locally (development)

```bash
cd electron
npm install
# Create auth-config.json (see "Auth config" above) so login works
npm start
```

The app opens the welcome screen; use **Log in** for in-app login, or **Create account** for the in-app signup flow. To point the portal at a different URL (e.g. localhost):

```bash
PORTAL_URL=http://localhost:3000/agent npm start
```

**App name on Mac:** The app sets the menu bar to **"Soradin"**. When you run `npm start`, the **Dock icon hover** still shows **"Electron"** because macOS uses the running executable name (the `electron` binary). To see **"Soradin"** when you hover the Dock icon (and use the real app icon/name), build once then run the packaged app:

```bash
npm run build:mac
npm run start:packaged
```

Or in one step: `npm run build:mac:run`. The built app is in `dist/Soradin.app` (or `dist/mac-arm64/Soradin.app` on Apple Silicon – open that folder and double‑click Soradin.app if `start:packaged` can't find it).

**What’s the difference between `npm start` and “the real app”?**  
- **`npm start`** runs the **Electron dev runner**: it uses the `electron` package from node_modules and loads your code. The process name is “Electron,” so the Dock shows “Electron.” It’s the same app behavior, but it’s not a standalone app.  
- **“The real app”** = the **built** app: run `npm run build:mac` (or `build:win`) to produce a standalone **Soradin.app** (Mac) or installer (Windows). That bundle has its own name (“Soradin”), icon, and metadata. When you open *that* app, the Dock and system treat it as “Soradin.” So: this repo is the **source**; the “real app” is the **built output** (the .app or .exe you’d give to users).

## Build installers

From the `electron` folder:

```bash
cd electron
npm install
npm run build        # Build for current OS (Mac or Windows)
npm run build:mac    # Mac: .dmg + .zip in electron/dist/
npm run build:win   # Windows: .exe installer in electron/dist/
```

- **Mac:** Build on a Mac. Output: `dist/Soradin Agent Portal-1.0.0.dmg` (and .zip).
- **Windows:** Build on Windows (or use CI). Output: `dist/Soradin Agent Portal Setup 1.0.0.exe`.

## Distribution and Download page

The site has a Download page at **soradin.com/download** with the app icon and Download for Mac / Download for Windows buttons.

To make the buttons work: (1) Build with `npm run build:mac` and/or `npm run build:win`. (2) Create `public/downloads/` and copy the built installers there as `Soradin-Agent-Portal-mac.dmg` and `Soradin-Agent-Portal-win.exe`. (3) Deploy. Alternatively host the installers elsewhere and set the URLs in `src/app/download/page.tsx`.

## Distribution (alternative)

1. Upload the `.dmg` (Mac) and/or `.exe` (Windows) to your site or file host.
2. Add a “Download desktop app” link on soradin.com (e.g. `/agent` or a dedicated `/download` page) that points to these files.

## Custom icon

The app uses `icon.png` (white logo on black background). Source: `icon-source.png` (white on transparent). To regenerate `icon.png` after changing the logo, run `npm run prepare-icon`. The app name and icon are set in the build config so the **built** app shows “Soradin” and your icon in the Dock and elsewhere.
