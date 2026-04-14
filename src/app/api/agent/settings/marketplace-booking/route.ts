import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  mode: z.enum(["availability", "contact_only"]),
  contact_us_phone: z.string().max(80).optional().nullable(),
  contact_us_email: z.string().max(320).optional().nullable(),
});

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metadata = parseMetadata(profile.metadata);
    const mb = (metadata.marketplace_booking as Record<string, unknown> | undefined) || {};
    const mode = mb.mode === "contact_only" ? "contact_only" : "availability";

    return NextResponse.json({
      mode,
      contact_us_phone: typeof mb.contact_us_phone === "string" ? mb.contact_us_phone : "",
      contact_us_email: typeof mb.contact_us_email === "string" ? mb.contact_us_email : "",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mode, contact_us_phone, contact_us_email } = parsed.data;
    const phone = (contact_us_phone ?? "").trim();
    const email = (contact_us_email ?? "").trim();

    if (mode === "contact_only" && !phone && !email) {
      return NextResponse.json(
        { error: "Add at least a phone number or an email for clients to reach you." },
        { status: 400 }
      );
    }

    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("metadata, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const metadata = parseMetadata(profile.metadata);
    const nextMetadata = {
      ...metadata,
      marketplace_booking: {
        mode,
        contact_us_phone: phone,
        contact_us_email: email,
      },
    };

    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({ metadata: nextMetadata as never })
      .eq("id", user.id);

    if (updErr) {
      console.error("[marketplace-booking] update failed", updErr);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({
      mode,
      contact_us_phone: phone,
      contact_us_email: email,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
