// API route for Daily.co room: get-or-create room by name, return room URL with optional token
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DAILY_API_BASE = "https://api.daily.co/v1";
const MEETING_EXPIRY_MINUTES_AFTER_START = 90;

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name");
    let role = req.nextUrl.searchParams.get("role"); // "host" (agent) or "guest" (customer)
    const userName = req.nextUrl.searchParams.get("userName");
    const userId = req.nextUrl.searchParams.get("userId");

    // Agent fallback: for appointment rooms, "Agent | ..." identity is always the host (fixes missing role in URL)
    const isAppointmentRoom = typeof name === "string" && name.startsWith("appointment-");
    const isAgentIdentity = typeof userName === "string" && userName.startsWith("Agent | ");
    if (isAppointmentRoom && isAgentIdentity && role !== "guest") {
      role = "host";
    }

    // For appointment rooms: compute token expiry = 90 min after scheduled start (privacy: link not valid forever)
    let tokenExpiryUnix: number | null = null;
    if (isAppointmentRoom && name) {
      const appointmentId = name.replace(/^appointment-/, "").trim();
      if (appointmentId && supabaseAdmin) {
        const { data: apt } = await supabaseAdmin
          .from("appointments")
          .select("starts_at, confirmed_at")
          .eq("id", appointmentId)
          .maybeSingle();
        const startIso = apt?.starts_at || apt?.confirmed_at;
        if (startIso) {
          const startMs = new Date(startIso).getTime();
          tokenExpiryUnix = Math.floor((startMs + MEETING_EXPIRY_MINUTES_AFTER_START * 60 * 1000) / 1000);
        } else {
          tokenExpiryUnix = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
        }
      } else if (appointmentId) {
        // Can't fetch appointment (e.g. no DB): still expire in 2h so link never lasts forever
        tokenExpiryUnix = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
      }
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Missing required query: name" },
        { status: 400 }
      );
    }

    // Refuse to issue token if this appointment's meeting window has expired
    if (tokenExpiryUnix !== null && tokenExpiryUnix < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { error: "This meeting link has expired." },
        { status: 403 }
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

    // Check if room exists
    let res = await fetch(`${DAILY_API_BASE}/rooms/${encodeURIComponent(safeName)}`, {
      method: "GET",
      headers,
    });

    // Create room if it doesn't exist (private with knocking enabled for waiting room)
    if (res.status === 404) {
      const createRes = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: safeName,
          privacy: "private", // Private room requires tokens or knocking
          properties: {
            enable_knocking: true, // Enable waiting room/lobby
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
      
      // If role is "guest", generate a meeting token for them (they'll be in waiting room)
      if (role === "guest") {
        const properties: Record<string, unknown> = {
          room_name: safeName,
          is_owner: false, // Guest, not owner
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        };
        if (userName) properties.user_name = userName;
        if (userId) properties.user_id = userId;
        if (tokenExpiryUnix !== null) {
          properties.exp = tokenExpiryUnix;
          properties.eject_at_token_exp = true;
        }

        const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
          method: "POST",
          headers,
          body: JSON.stringify({ properties }),
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
        // Return room URL with token appended
        const urlWithToken = `${room.url}?t=${tokenData.token}`;
        return NextResponse.json({ url: urlWithToken, name: room.name, token: tokenData.token });
      }

      // For hosts (agents), generate owner token
      if (role === "host") {
        const properties: Record<string, unknown> = {
          room_name: safeName,
          is_owner: true, // Host/owner can admit people from waiting room
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        };
        if (userName) properties.user_name = userName;
        if (userId) properties.user_id = userId;
        if (tokenExpiryUnix !== null) {
          properties.exp = tokenExpiryUnix;
          properties.eject_at_token_exp = true;
        }

        const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
          method: "POST",
          headers,
          body: JSON.stringify({ properties }),
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
        const urlWithToken = `${room.url}?t=${tokenData.token}`;
        return NextResponse.json({ url: urlWithToken, name: room.name, token: tokenData.token });
      }

      // No role specified - return room URL without token (legacy behavior)
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

    // If room exists and role is specified, generate appropriate token
    if (role === "guest") {
      const properties: Record<string, unknown> = {
        room_name: safeName,
        is_owner: false,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      };
      if (userName) properties.user_name = userName;
      if (userId) properties.user_id = userId;
      if (tokenExpiryUnix !== null) {
        properties.exp = tokenExpiryUnix;
        properties.eject_at_token_exp = true;
      }

      const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const urlWithToken = `${room.url}?t=${tokenData.token}`;
        return NextResponse.json({ url: urlWithToken, name: room.name, token: tokenData.token });
      }
    } else if (role === "host") {
      const properties: Record<string, unknown> = {
        room_name: safeName,
        is_owner: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      };
      if (userName) properties.user_name = userName;
      if (userId) properties.user_id = userId;
      if (tokenExpiryUnix !== null) {
        properties.exp = tokenExpiryUnix;
        properties.eject_at_token_exp = true;
      }

      const tokenRes = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const urlWithToken = `${room.url}?t=${tokenData.token}`;
        return NextResponse.json({ url: urlWithToken, name: room.name, token: tokenData.token });
      }
    }

    // No role or token generation failed - return room URL without token
    return NextResponse.json({ url: room.url, name: room.name });
  } catch (e) {
    console.error("Daily room API error:", e);
    return NextResponse.json(
      { error: "Failed to get or create room", details: (e as Error).message },
      { status: 500 }
    );
  }
}
