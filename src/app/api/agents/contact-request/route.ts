import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
import { MARKETPLACE_CONTACT_US_SERVICE_TYPE } from "@/lib/marketplaceContactLead";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  agentId: z.string().uuid(),
  firstName: z.string().min(1).max(120).trim(),
  lastName: z.string().min(1).max(120).trim(),
  email: z.string().email().max(320).trim(),
  phone: z.string().min(5).max(40).trim(),
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

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, "contact-request", 20);
  if (rate) return rate;

  try {
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId, firstName, lastName, email, phone } = parsed.data;

    const { data: agent, error: agentErr } = await supabaseAdmin
      .from("profiles")
      .select("id, approval_status, role, metadata")
      .eq("id", agentId)
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

    const last = lastName.trim();
    const fullName = `${firstName} ${last}`.trim();

    const urgencyLevel = "warm";
    const leadPrice = getLeadPriceFromUrgency(urgencyLevel);
    const submittedAt = new Date().toISOString();
    const notes = [
      "Soradin marketplace — Contact Us form (contact-only listing).",
      `Submitted (UTC): ${submittedAt}.`,
      `Requested agent id: ${agentId}.`,
      "Client fields stored on this lead: first_name, last_name, email, phone.",
    ].join("\n");

    const { data: existing } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from("leads")
        .update({
          first_name: firstName,
          last_name: last,
          full_name: fullName,
          phone: phone,
          additional_notes: notes,
          service_type: MARKETPLACE_CONTACT_US_SERVICE_TYPE,
          assigned_agent_id: agentId,
        })
        .eq("id", existing.id);
    } else {
      const leadData: Record<string, unknown> = {
        first_name: firstName,
        last_name: last,
        full_name: fullName,
        email,
        phone,
        city: null,
        province: null,
        service_type: MARKETPLACE_CONTACT_US_SERVICE_TYPE,
        additional_notes: notes,
        status: "new",
        urgency_level: urgencyLevel,
        lead_price: leadPrice,
        buy_now_price_cents: leadPrice * 100,
        timeline_intent: "not_specified",
        planning_for: "self",
        remains_disposition: null,
        service_celebration: null,
        family_pre_arranged: null,
        assigned_agent_id: agentId,
        auction_enabled: false,
      };
      const { error: insErr } = await supabaseAdmin.from("leads").insert(leadData);
      if (insErr) {
        console.error("[contact-request] lead insert", insErr);
        return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
      }
    }

    return NextResponse.json({
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
