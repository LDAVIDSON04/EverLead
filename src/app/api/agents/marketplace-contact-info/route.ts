import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

/**
 * Public read of agent phone/email for contact-only marketplace listings.
 * No client PII — frictionless “Contact me” on search. Rate limited.
 */
export async function GET(req: NextRequest) {
  const rate = checkRateLimit(req, "marketplace-contact-info", 60);
  if (rate) return rate;

  const agentIdRaw = req.nextUrl.searchParams.get("agentId");
  const parsedId = z.string().uuid().safeParse(agentIdRaw);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
  }

  const { data: agent, error: agentErr } = await supabaseAdmin
    .from("profiles")
    .select("id, approval_status, role, metadata")
    .eq("id", parsedId.data)
    .eq("role", "agent")
    .maybeSingle();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  if (agent.approval_status !== "approved") {
    return NextResponse.json({ error: "Agent is not available" }, { status: 403 });
  }

  const metadata = parseMetadata(agent.metadata);
  const mb = (metadata.marketplace_booking as Record<string, unknown> | undefined) || {};
  if (mb.mode !== "contact_only") {
    return NextResponse.json(
      { error: "This professional accepts online booking only." },
      { status: 400 }
    );
  }

  const contactPhone = typeof mb.contact_us_phone === "string" ? mb.contact_us_phone.trim() : "";
  const contactEmail = typeof mb.contact_us_email === "string" ? mb.contact_us_email.trim() : "";
  if (!contactPhone && !contactEmail) {
    return NextResponse.json({ error: "Contact is not configured for this professional." }, { status: 503 });
  }

  return NextResponse.json({
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
  });
}
