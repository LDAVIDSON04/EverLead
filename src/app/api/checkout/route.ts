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

    // Get Buy Now price - use existing price or default based on urgency
    // Also fix legacy low prices (like $1) to proper defaults
    let buyNowPriceCents = lead.buy_now_price_cents;
    const urgency = (lead.urgency_level || "warm").toLowerCase();
    
    // Determine proper default based on urgency
    let properDefault: number;
    if (urgency === "hot") properDefault = 3000; // $30
    else if (urgency === "warm") properDefault = 2000; // $20
    else properDefault = 1000; // $10 for cold or default
    
    if (!buyNowPriceCents) {
      // Use default pricing based on urgency level
      buyNowPriceCents = properDefault;
    } else if (buyNowPriceCents < 500) {
      // If price is less than $5 (500 cents), treat it as legacy and use proper default
      buyNowPriceCents = properDefault;
    }

    // Get base URL from env var or fallback to request URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const successUrl = `${baseUrl}/agent/leads/success?session_id={CHECKOUT_SESSION_ID}&leadId=${leadId}`;
    const cancelUrl = `${baseUrl}/agent/leads/available`;

    // Get the current agent's ID from the request (if available via auth)
    // We'll rely on email matching in confirm-purchase, but include it in metadata if we can
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
            price_data: {
              currency: "cad",
              unit_amount: buyNowPriceCents,
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
        // Include price for verification
        priceCents: String(buyNowPriceCents),
      },
      // Ensure we capture email for agent identification
      customer_email: undefined, // Let Stripe collect it
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
