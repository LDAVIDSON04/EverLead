import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

// POST: Create a Stripe Checkout Session in setup mode to add a payment method
// SECURITY: Uses only this agent's profile.stripe_customer_id. If none exists,
// always creates a NEW Stripe customer for this agent (never looks up by email)
// so one agent can never attach their card to another agent's customer.
export async function POST(request: NextRequest) {
  try {
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching agent profile:", profileError);
      return NextResponse.json({ error: "Failed to fetch agent profile" }, { status: 500 });
    }

    let stripeCustomerId = (profile?.metadata as any)?.stripe_customer_id;
    let customer: { id: string; deleted?: boolean };

    if (stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId) as { id: string; deleted?: boolean };
        if (customer.deleted) {
          stripeCustomerId = null;
        }
      } catch {
        stripeCustomerId = null;
      }
    }

    if (!stripeCustomerId) {
      customer = await stripe.customers.create({
        email: agentEmail,
        metadata: {
          supabase_user_id: agentId,
        },
      });
      stripeCustomerId = customer.id;

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
      }
    }

    const url = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      success_url: `${baseUrl}/agent/billing?payment_method=success`,
      cancel_url: `${baseUrl}/agent/billing?payment_method=cancelled`,
      metadata: {
        agentId: agentId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/payment-methods/setup:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
