// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leadId = body.leadId as string | undefined;

    if (!leadId) {
      return NextResponse.json(
        { error: "Missing leadId" },
        { status: 400 }
      );
    }

    // Fetch lead to get price and description
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      console.error(error);
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    if (!lead.buy_now_price_cents) {
      return NextResponse.json(
        { error: "Lead has no buy_now_price_cents set" },
        { status: 400 }
      );
    }

    // Get base URL from env var or fallback to request URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const successUrl = `${baseUrl}/agent/leads/success?session_id={CHECKOUT_SESSION_ID}&leadId=${leadId}`;
    const cancelUrl = `${baseUrl}/agent/leads/available`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: lead.buy_now_price_cents,
            product_data: {
              name: "Funeral Pre-Arrangement Lead",
              description: `Lead in ${lead.city || "your area"}`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        leadId: leadId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
