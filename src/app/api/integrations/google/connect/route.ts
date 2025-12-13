// src/app/api/integrations/google/connect/route.ts
// Initiates Google Calendar OAuth flow
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // TODO: Get specialist ID from authenticated session
    // For now, accept as query param (you'll want to get this from auth in production)
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");

    if (!specialistId) {
      return NextResponse.json(
        { error: "Specialist ID is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }

    // Google OAuth scopes for calendar access
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    // Generate state parameter (should include specialistId and be cryptographically random)
    // TODO: Use a proper state generation and storage mechanism
    const state = Buffer.from(
      JSON.stringify({ specialistId, timestamp: Date.now() })
    ).toString("base64");

    // Build Google OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline"); // Required for refresh token
    authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
    authUrl.searchParams.set("state", state);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Error in /api/integrations/google/connect:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

