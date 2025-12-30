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

    // Get agent's profile to check for existing Stripe Customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching agent profile:", profileError);
      return NextResponse.json({ error: "Failed to fetch agent profile" }, { status: 500 });
    }

    let customer;
    let stripeCustomerId = (profile?.metadata as any)?.stripe_customer_id;

    // If we already have a customer ID, use it
    if (stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId);
        // If customer was deleted or doesn't exist, create a new one
        if (customer.deleted) {
          stripeCustomerId = null;
        }
      } catch (err) {
        // Customer doesn't exist, create a new one
        stripeCustomerId = null;
      }
    }

    // If no valid customer ID, find or create Stripe customer
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({
        email: agentEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        stripeCustomerId = customer.id;
      } else {
        // Create new Stripe customer
        customer = await stripe.customers.create({
          email: agentEmail,
          metadata: {
            supabase_user_id: agentId,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Save Stripe Customer ID to profile metadata
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          metadata: {
            ...(profile?.metadata || {}),
            stripe_customer_id: stripeCustomerId,
          },
        })
        .eq("id", agentId);

      if (updateProfileError) {
        console.error("Error saving Stripe Customer ID to profile:", updateProfileError);
        // Non-fatal, but log it
      }
    }

    // Get base URL
    const url = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;

    // Create a Checkout Session in setup mode to collect payment method
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      success_url: `${baseUrl}/agent/billing?payment_method=success`,
      cancel_url: `${baseUrl}/agent/billing?payment_method=cancelled`,
      metadata: {
        agentId: agentId,
      },
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/payment-methods/setup:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

