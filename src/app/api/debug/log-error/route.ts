import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { error, context, userAgent, url } = body;

    // Log to server console (will show in Vercel logs)
    console.error("🔴 CLIENT-SIDE ERROR:", {
      error: error?.message || error,
      errorName: error?.name,
      errorStack: error?.stack,
      context,
      userAgent,
      url,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error logging client error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
