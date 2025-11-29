// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadPriceCentsFromUrgency } from "@/lib/leads/pricing";
import { checkBotId } from 'botid/server';

export async function POST(req: NextRequest) {
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
    const leadId = body.leadId as string | undefined;
    const agentId = body.agentId as string | undefined;

    if (!leadId) {
      return NextResponse.json(
        { error: "Missing leadId" },
        { status: 400 }
      );
    }

    // Require agentId from request body
    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // Get agent profile to check province
    const { data: agentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("agent_province, role, approval_status")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !agentProfile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    // Verify agent is approved
    if (agentProfile.role !== "agent" || agentProfile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent account not approved" },
        { status: 403 }
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

    const finalizedLead = lead;

    // Check if lead is already sold
    if (finalizedLead.status === "purchased_by_agent" || finalizedLead.assigned_agent_id) {
      return NextResponse.json(
        { error: "This lead is no longer available" },
        { status: 400 }
      );
    }

    // Validate province match - agents can only purchase leads from their province
    if (agentProfile.agent_province) {
      const agentProvinceUpper = (agentProfile.agent_province || '').toUpperCase().trim();
      const leadProvinceUpper = (finalizedLead.province || '').toUpperCase().trim();
      
      if (leadProvinceUpper !== agentProvinceUpper) {
        return NextResponse.json(
          { 
            error: `You can only purchase leads from ${agentProfile.agent_province}. This lead is from ${finalizedLead.province || 'another province'}.` 
          },
          { status: 403 }
        );
      }
    }

    // Get Buy Now price - use lead_price if available, otherwise calculate from urgency
    let buyNowPriceCents: number;
    if (finalizedLead.lead_price) {
      // Use stored lead_price (in dollars, convert to cents)
      buyNowPriceCents = Math.round(finalizedLead.lead_price * 100);
    } else if (finalizedLead.buy_now_price_cents) {
      // Fallback to buy_now_price_cents if lead_price not set
      buyNowPriceCents = finalizedLead.buy_now_price_cents;
    } else {
      // Calculate from urgency using pricing helper
      buyNowPriceCents = getLeadPriceCentsFromUrgency(finalizedLead.urgency_level);
    }

    // Ensure minimum price (shouldn't happen with our pricing, but safety check)
    if (buyNowPriceCents < 1000) {
      buyNowPriceCents = 1000; // $10 minimum
    }

    // Get base URL from env var or fallback to request URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Redirect to dashboard on success and cancel
    const successUrl = `${baseUrl}/agent/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/agent/dashboard?purchase=cancelled`;

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
