// API route for Daily.co meeting tokens: generate token with host/guest permissions
import { NextRequest, NextResponse } from "next/server";

const DAILY_API_BASE = "https://api.daily.co/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, isOwner, userName, userId } = body;

    if (!roomName || typeof roomName !== "string") {
      return NextResponse.json(
        { error: "Missing required field: roomName" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
      console.error("Daily API: DAILY_API_KEY not set");
      return NextResponse.json(
        { error: "Daily credentials not configured. Set DAILY_API_KEY in environment." },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Room names: alphanumeric, dash, underscore only
    const safeName = roomName.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 128);
    if (!safeName) {
      return NextResponse.json(
        { error: "Invalid room name" },
        { status: 400 }
      );
    }

    // Create meeting token with appropriate permissions
    const tokenPayload: any = {
      room_name: safeName,
      is_owner: isOwner === true, // true for agents (hosts), false for customers (guests)
      enable_screenshare: true,
      start_video_off: false,
      start_audio_off: false,
    };

    // Add user identification if provided
    if (userName) {
      tokenPayload.user_name = userName;
    }
    if (userId) {
      tokenPayload.user_id = userId;
    }

    const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
      method: "POST",
      headers,
      body: JSON.stringify(tokenPayload),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Daily create token error:", tokenRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create meeting token", details: errText },
        { status: 502 }
      );
    }

    const tokenData = await tokenRes.json();
    return NextResponse.json({ token: tokenData.token });
  } catch (e) {
    console.error("Daily token API error:", e);
    return NextResponse.json(
      { error: "Failed to create meeting token", details: (e as Error).message },
      { status: 500 }
    );
  }
}
