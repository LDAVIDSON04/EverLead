import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  agentId: z.string().uuid(),
  channel: z.enum(["reveal", "phone", "email"]),
  source: z.enum(["search", "agent_profile"]).optional().default("search"),
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

/**
 * Public: log a contact-only marketplace interaction (reveal, phone, email).
 * Rate limited; only records for approved agents in contact_only mode.
 */
export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, "marketplace-contact-click", 120);
  if (rate) return rate;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { agentId, channel, source } = parsed.data;

  const { data: agent, error: agentErr } = await supabaseAdmin
    .from("profiles")
    .select("id, approval_status, role, metadata")
    .eq("id", agentId)
    .eq("role", "agent")
    .maybeSingle();

  if (agentErr || !agent) {
    return NextResponse.json({ ok: true });
  }
  if (agent.approval_status !== "approved") {
    return NextResponse.json({ ok: true });
  }

  const metadata = parseMetadata(agent.metadata);
  const mb = (metadata.marketplace_booking as Record<string, unknown> | undefined) || {};
  if (mb.mode !== "contact_only") {
    return NextResponse.json({ ok: true });
  }

  const { error: insErr } = await supabaseAdmin.from("marketplace_contact_request_events").insert({
    agent_id: agentId,
    channel,
    source,
  });

  if (insErr) {
    console.error("[marketplace-contact-click] insert failed", insErr);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
