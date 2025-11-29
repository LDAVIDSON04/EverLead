// src/app/api/checkout/confirm/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkBotId } from 'botid/server';

export async function POST(req: Request) {
  // Check for bots
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json(
      { error: 'Bot detected. Access denied.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const sessionId = body.sessionId as string | undefined;
    const leadId = body.leadId as string | undefined;
    const agentId = body.agentId as string | undefined;

    if (!sessionId || !leadId || !agentId) {
      return NextResponse.json(
        { error: "Missing sessionId, leadId, or agentId" },
        { status: 400 }
      );
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Mark lead as purchased and assign to agent
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        status: "purchased_by_agent",
        assigned_agent_id: agentId,
        price_charged_cents: session.amount_total ?? null,
      })
      .eq("id", leadId);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



