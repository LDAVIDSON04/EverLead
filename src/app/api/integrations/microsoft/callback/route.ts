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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const redirectUri =
      process.env.MICROSOFT_REDIRECT_URI ||
      `${baseUrl}/api/integrations/microsoft/callback`;

    console.log("Microsoft OAuth callback:", {
      baseUrl,
      redirectUri,
      hasCode: !!code,
      hasState: !!state,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

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
      const errorText = await tokenResponse.text().catch(() => "");
      console.error("Microsoft OAuth token exchange failed:", {
        error,
        errorText,
        redirectUri,
        status: tokenResponse.status,
        requestBody: {
          code: code ? "present" : "missing",
          client_id: clientId ? "present" : "missing",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        },
      });
      
      // Provide more helpful error message
      let errorMessage = `Token exchange failed: ${error.error || JSON.stringify(error)}`;
      if (error.error === "invalid_grant") {
        errorMessage += `. The redirect URI "${redirectUri}" must be EXACTLY registered in Azure App Registration → Authentication → Redirect URIs. Check for typos, case sensitivity, trailing slashes, or wrong platform type.`;
      }
      
      return NextResponse.redirect(
        `${baseUrl}/agent/settings?error=${encodeURIComponent(errorMessage)}`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
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
        return NextResponse.redirect(
          `${baseUrl}/agent?error=${encodeURIComponent("Failed to create account. Please log in and try again.")}`
        );
      }
    }

    // Values are now set from OAuth flow above

    // Upsert calendar connection
    const { data: savedConnection, error: upsertError } = await supabaseServer
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
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error saving calendar connection:", upsertError);
      console.error("Error details:", JSON.stringify(upsertError, null, 2));
      return NextResponse.redirect(
        `${baseUrl}/agent?error=${encodeURIComponent("Failed to save calendar connection. Please log in and try again.")}`
      );
    }

    // Set up webhook subscription for real-time updates
    // This is critical for instant sync when coworkers book meetings
    // Note: Set up asynchronously with a delay to avoid rate limiting during initial connection
    if (savedConnection) {
      // Set up webhook asynchronously after a delay to avoid rate limiting
      // The sync cron job will also attempt to set up webhooks if they're missing
      setTimeout(async () => {
        try {
          const { setupMicrosoftWebhook } = await import("@/lib/calendarWebhooks");
          await setupMicrosoftWebhook(savedConnection as any);
          console.log(`✅ Microsoft Calendar webhook set up successfully for specialist ${specialistId}`);
        } catch (webhookError: any) {
          // Log error but don't fail the connection - polling will still work
          console.error("⚠️ Failed to set up Microsoft webhook (non-blocking):", webhookError);
          // Connection is still saved, webhook can be set up later via utility endpoint or sync cron
        }
      }, 5000); // Wait 5 seconds before setting up webhook to avoid rate limiting
      console.log(`⏳ Microsoft Calendar webhook will be set up in 5 seconds (async, non-blocking)`);
    }

    // Redirect to login page with success message - user can log back in and go to settings
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

