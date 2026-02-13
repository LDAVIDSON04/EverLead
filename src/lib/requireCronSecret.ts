/**
 * Use in cron API routes. When CRON_SECRET is set, the request must send
 * Authorization: Bearer <CRON_SECRET>. In production we require CRON_SECRET to be set.
 */
import { NextResponse } from "next/server";

export function requireCronSecret(authHeader: string | null): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      console.warn("CRON_SECRET is not set in production - cron endpoints are unprotected");
    }
    return null;
  }

  if (!authHeader?.startsWith("Bearer ") || authHeader.substring(7) !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
