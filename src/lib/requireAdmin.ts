/**
 * Server-side only. Use in API routes to require an authenticated admin.
 * Returns { user, profile } or a 403 Response. Never trust admin identity from request body.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RequireAdminResult =
  | { ok: true; userId: string; profile: { role: string } }
  | { ok: false; response: NextResponse };

export async function requireAdmin(authHeader: string | null): Promise<RequireAdminResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id, profile };
}
