import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

// POST: Create a Stripe Checkout Session in setup mode to add a payment method
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get("authorization");
    
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

    const agentId = user.id;

    // Get agent's email to find or create Stripe customer
    let agentEmail: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
      agentEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.error("Error fetching agent email:", authError);
      return NextResponse.json({ error: "Failed to fetch agent information" }, { status: 500 });
    }

    if (!agentEmail) {
      return NextResponse.json({ error: "Agent email not found" }, { status: 404 });
    }

    // Find or create Stripe customer
    let customer;
    const customers = await stripe.customers.list({
      email: agentEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      // Create new Stripe customer
      customer = await stripe.customers.create({
        email: agentEmail,
        metadata: {
          agent_id: agentId,
        },
      });
    }

    // Get base URL
    const url = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;

    // Create a Checkout Session in setup mode to collect payment method
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      success_url: `${baseUrl}/agent/settings?tab=billing&payment_method=success`,
      cancel_url: `${baseUrl}/agent/settings?tab=billing&payment_method=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/payment-methods/setup:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

