// src/app/api/integrations/microsoft/connect/route.ts
// Initiates Microsoft Calendar OAuth flow
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // TODO: Get specialist ID from authenticated session
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");

    if (!specialistId) {
      return NextResponse.json(
        { error: "Specialist ID is required" },
        { status: 400 }
      );
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri =
      process.env.MICROSOFT_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"}/api/integrations/microsoft/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Microsoft OAuth not configured" },
        { status: 500 }
      );
    }

    // Microsoft Graph scopes for calendar access
    const scopes = ["Calendars.ReadWrite"].join(" ");

    // Generate state parameter
    // TODO: Use a proper state generation and storage mechanism
    const state = Buffer.from(
      JSON.stringify({ specialistId, timestamp: Date.now() })
    ).toString("base64");

    // Build Microsoft OAuth URL
    const authUrl = new URL(
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    );
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("state", state);

    // Redirect to Microsoft OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Error in /api/integrations/microsoft/connect:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

