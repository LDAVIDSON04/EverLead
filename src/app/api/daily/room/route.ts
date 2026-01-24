// API route for Daily.co room: get-or-create room by name, return room URL
import { NextRequest, NextResponse } from "next/server";

const DAILY_API_BASE = "https://api.daily.co/v1";

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name");
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Missing required query: name" },
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
    const safeName = name.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 128);
    if (!safeName) {
      return NextResponse.json(
        { error: "Invalid room name" },
        { status: 400 }
      );
    }

    let res = await fetch(`${DAILY_API_BASE}/rooms/${encodeURIComponent(safeName)}`, {
      method: "GET",
      headers,
    });

    if (res.status === 404) {
      const createRes = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: safeName,
          privacy: "public",
          properties: {
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("Daily create room error:", createRes.status, errText);
        return NextResponse.json(
          { error: "Failed to create Daily room", details: errText },
          { status: 502 }
        );
      }

      const room = await createRes.json();
      return NextResponse.json({ url: room.url, name: room.name });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Daily get room error:", res.status, errText);
      return NextResponse.json(
        { error: "Failed to get Daily room", details: errText },
        { status: 502 }
      );
    }

    const room = await res.json();
    return NextResponse.json({ url: room.url, name: room.name });
  } catch (e) {
    console.error("Daily room API error:", e);
    return NextResponse.json(
      { error: "Failed to get or create room", details: (e as Error).message },
      { status: 500 }
    );
  }
}
