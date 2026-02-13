/**
 * In-memory rate limiter (per serverless instance).
 * For production at scale, use Vercel KV / Upstash Redis. This reduces burst abuse.
 */
import { NextResponse } from "next/server";

const windowMs = 60 * 1000; // 1 minute
const store = new Map<string, { count: number; resetAt: number }>();

function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : null;
  return ip || req.headers.get("x-real-ip") || "unknown";
}

function prune(): void {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key);
  }
}

/**
 * Check rate limit. Returns null if allowed, or NextResponse with 429 if exceeded.
 * @param req - Request (for extracting client ID)
 * @param keyPrefix - e.g. "book" or "auth"
 * @param maxPerMinute - max requests per minute per client
 */
export function checkRateLimit(
  req: Request,
  keyPrefix: string,
  maxPerMinute: number
): NextResponse | null {
  const id = getClientId(req);
  const key = `${keyPrefix}:${id}`;
  const now = Date.now();

  if (store.size > 10000) prune();

  let entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return null;
  }
  entry.count += 1;
  if (entry.count > maxPerMinute) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  return null;
}
