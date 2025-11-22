// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizeAuctionStatus } from "@/lib/auctions";

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

    // Run lazy finalization to ensure auction status is up-to-date
    const { lead: finalizedLead } = await finalizeAuctionStatus(lead, supabaseAdmin);

    // Check if lead is already sold
    if (finalizedLead.status === "purchased_by_agent" || finalizedLead.assigned_agent_id) {
      return NextResponse.json(
        { error: "This lead is no longer available" },
        { status: 400 }
      );
    }

    // Check auction status - if ended, only winner can buy
    if (finalizedLead.auction_status === 'ended' && finalizedLead.winning_agent_id) {
      // This will be checked in confirm-purchase based on email, but we can't get agent ID here
      // So we'll allow the checkout to proceed and validate in confirm-purchase
      // The frontend should already hide the button for non-winners
    }

    // Get Buy Now price - prioritize buy_now_price from auction system
    let buyNowPriceCents: number;
    if (finalizedLead.buy_now_price) {
      buyNowPriceCents = Math.round(finalizedLead.buy_now_price * 100);
    } else if (finalizedLead.buy_now_price_cents) {
      buyNowPriceCents = finalizedLead.buy_now_price_cents;
    } else {
      // Fallback to urgency-based pricing
      const urgency = (finalizedLead.urgency_level || "warm").toLowerCase();
      if (urgency === "hot") buyNowPriceCents = 3000; // $30
      else if (urgency === "warm") buyNowPriceCents = 2000; // $20
      else buyNowPriceCents = 1000; // $10 for cold or default
    }

    // Ensure minimum price
    if (buyNowPriceCents < 500) {
      buyNowPriceCents = 5000; // $50 default from auction system
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
