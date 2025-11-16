// src/app/api/checkout/confirm/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId as string | undefined;
    const leadId = body.leadId as string | undefined;

    if (!sessionId || !leadId) {
      return NextResponse.json(
        { error: "Missing sessionId or leadId" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Mark lead as purchased
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        status: "purchased_by_agent",
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



