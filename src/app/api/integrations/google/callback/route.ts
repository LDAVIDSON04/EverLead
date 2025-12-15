// src/app/api/integrations/google/callback/route.ts
// Handles Google OAuth callback and stores calendar connection
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent(`OAuth error: ${error}`)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Parse state to get specialistId
    // TODO: Validate state properly (check timestamp, verify it wasn't tampered with)
    let specialistId: string;
    try {
      const stateData = JSON.parse(
        Buffer.from(state, "base64").toString("utf-8")
      );
      specialistId = stateData.specialistId;
    } catch {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    // TODO: Exchange authorization code for access token and refresh token
    // This requires making a POST request to Google's token endpoint
    // Example implementation:
    /*
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    */

    // TODO: Get the primary calendar ID
    // This requires calling Google Calendar API:
    /*
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      throw new Error("Failed to get primary calendar");
    }

    const calendar = await calendarResponse.json();
    const externalCalendarId = calendar.id;
    */

    // Check if specialist exists, create if not
    const { data: existingSpecialist, error: checkError } = await supabaseServer
      .from("specialists")
      .select("id")
      .eq("id", specialistId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking specialist:", checkError);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent("Failed to verify specialist account")}`
      );
    }

    // Create specialist record if it doesn't exist
    if (!existingSpecialist) {
      const { error: createError } = await supabaseServer
        .from("specialists")
        .insert({
          id: specialistId,
          status: "pending",
          is_active: false,
          display_name: "Specialist",
          timezone: "America/Edmonton",
        });

      if (createError) {
        console.error("Error creating specialist:", createError);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
        return NextResponse.redirect(
          `${baseUrl}/agent/settings?error=${encodeURIComponent("Failed to create specialist account")}`
        );
      }
    }

    // Placeholder values (replace with actual values from OAuth flow above)
    const access_token = "TODO_REPLACE_WITH_ACTUAL_TOKEN";
    const refresh_token = "TODO_REPLACE_WITH_ACTUAL_REFRESH_TOKEN";
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    const externalCalendarId = "primary"; // Usually "primary" for Google

    // Upsert calendar connection
    const { error: upsertError } = await supabaseServer
      .from("calendar_connections")
      .upsert(
        {
          specialist_id: specialistId,
          provider: "google",
          external_calendar_id: externalCalendarId,
          access_token,
          refresh_token,
          expires_at: expiresAt.toISOString(),
          sync_enabled: true,
        },
        {
          onConflict: "specialist_id,provider",
        }
      );

    if (upsertError) {
      console.error("Error saving calendar connection:", upsertError);
      console.error("Error details:", JSON.stringify(upsertError, null, 2));
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent(`Failed to save calendar connection: ${upsertError.message || upsertError.code || "Unknown error"}`)}`
      );
    }

    // Redirect to success page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent/settings?calendar=connected&provider=google`
    );
  } catch (error: any) {
    console.error("Error in /api/integrations/google/callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent/settings?error=${encodeURIComponent(error.message || "Connection failed")}`
    );
  }
}

