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

    // TODO: Exchange authorization code for access token and refresh token
    // This requires making a POST request to Microsoft's token endpoint
    // Example implementation:
    /*
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
          scope: "Calendars.ReadWrite",
        }),
      }
    );

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
    // This requires calling Microsoft Graph API:
    /*
    const calendarResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/calendar",
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

    // Placeholder values (replace with actual values from OAuth flow above)
    const access_token = "TODO_REPLACE_WITH_ACTUAL_TOKEN";
    const refresh_token = "TODO_REPLACE_WITH_ACTUAL_REFRESH_TOKEN";
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
    const externalCalendarId = "TODO_REPLACE_WITH_ACTUAL_CALENDAR_ID";

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
      return NextResponse.json(
        { error: "Failed to save calendar connection" },
        { status: 500 }
      );
    }

    // Redirect to success page
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent/settings?calendar=connected&provider=microsoft`
    );
  } catch (error: any) {
    console.error("Error in /api/integrations/microsoft/callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/agent/settings?error=${encodeURIComponent(error.message || "Connection failed")}`
    );
  }
}

