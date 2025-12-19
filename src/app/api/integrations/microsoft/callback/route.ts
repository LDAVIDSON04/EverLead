// src/app/api/integrations/microsoft/callback/route.ts
// Handles Microsoft OAuth callback and stores calendar connection
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
        `${baseUrl}/agent?error=${encodeURIComponent(`OAuth error: ${error}. Please try connecting again.`)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Parse state to get specialistId
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

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri =
      process.env.MICROSOFT_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/microsoft/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Microsoft OAuth not configured" },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token and refresh token
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
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
          scope: "Calendars.ReadWrite offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({ error: "Unknown error" }));
      console.error("Microsoft OAuth token exchange failed:", error);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent(`Token exchange failed: ${error.error || JSON.stringify(error)}`)}`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent("Failed to get access token from Microsoft")}`
      );
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    // Get the primary calendar ID
    const calendarResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/calendar",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let externalCalendarId = "calendar"; // Default fallback
    if (calendarResponse.ok) {
      const calendar = await calendarResponse.json();
      externalCalendarId = calendar.id || "calendar";
    } else {
      console.warn("Failed to get primary calendar, using default 'calendar'");
    }

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
        `${baseUrl}/agent?error=${encodeURIComponent("Failed to verify account. Please log in and try again.")}`
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
          `${baseUrl}/agent?error=${encodeURIComponent("Failed to create account. Please log in and try again.")}`
        );
      }
    }

    // Values are now set from OAuth flow above

    // Upsert calendar connection
    const { error: upsertError } = await supabaseServer
      .from("calendar_connections")
      .upsert(
        {
          specialist_id: specialistId,
          provider: "microsoft",
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
        `${baseUrl}/agent?error=${encodeURIComponent("Failed to save calendar connection. Please log in and try again.")}`
      );
    }

    // Redirect to login page with success message - user can log back in and go to settings
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent?calendarConnected=microsoft&message=${encodeURIComponent("Microsoft Calendar connected successfully! Please log in to continue.")}`
    );
  } catch (error: any) {
    console.error("Error in /api/integrations/microsoft/callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent?error=${encodeURIComponent("Connection failed. Please log in and try again.")}`
    );
  }
}

