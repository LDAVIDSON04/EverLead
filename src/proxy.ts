import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOWER_TO_UPPER: Record<string, string> = {
  bc: "BC",
  ab: "AB",
  sk: "SK",
  mb: "MB",
  on: "ON",
};

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const m = pathname.match(/^\/(bc|ab|sk|mb|on)(\/.*)?$/i);
  if (m) {
    const seg = m[1];
    const upper = LOWER_TO_UPPER[seg.toLowerCase()];
    if (upper && seg !== upper) {
      const rest = m[2] ?? "";
      const url = request.nextUrl.clone();
      url.pathname = `/${upper}${rest}`;
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  const response = NextResponse.next();

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
