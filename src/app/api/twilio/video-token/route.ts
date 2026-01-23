// API route for generating Twilio Video access tokens
import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, identity } = body;

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: "Missing required fields: roomName and identity" },
        { status: 400 }
      );
    }

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_API_KEY_SID || !process.env.TWILIO_API_KEY_SECRET) {
      return NextResponse.json(
        { error: "Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, and TWILIO_API_KEY_SECRET in your environment variables." },
        { status: 500 }
      );
    }

    // Create an access token
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // Create a video grant for the room
    const videoGrant = new VideoGrant({
      room: roomName,
    });

    // Create an access token
    // For API Keys: use Account SID, API Key SID (as Signing Key SID), and API Key Secret (as Signing Key Secret)
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!, // This is the Signing Key SID when using API Keys
      process.env.TWILIO_API_KEY_SECRET!, // This is the Signing Key Secret when using API Keys
      { identity }
    );

    // Add the grant to the token
    token.addGrant(videoGrant);

    // Serialize the token to a JWT string
    const jwt = token.toJwt();

    return NextResponse.json({
      token: jwt,
      roomName,
      identity,
    });
  } catch (error: any) {
    console.error("Twilio Video token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate access token", details: error.message },
      { status: 500 }
    );
  }
}
