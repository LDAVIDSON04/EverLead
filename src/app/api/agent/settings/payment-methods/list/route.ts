import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

// GET: List payment methods for the current agent
// SECURITY: Uses only this agent's profile.stripe_customer_id. Never looks up by email.
export async function GET(request: NextRequest) {
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

    // SECURITY: Use only this agent's profile.stripe_customer_id. Never look up by email.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const stripeCustomerId = (profile.metadata as any)?.stripe_customer_id;
    if (!stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [], customerId: null });
    }

    let customer: { id: string; deleted?: boolean; invoice_settings?: { default_payment_method?: string } };
    try {
      customer = await stripe.customers.retrieve(stripeCustomerId) as typeof customer;
      if (customer.deleted) {
        return NextResponse.json({ paymentMethods: [], customerId: null });
      }
    } catch {
      return NextResponse.json({ paymentMethods: [], customerId: null });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    // Defense-in-depth: only expose cards that belong to this agent's Stripe customer
    const ownPaymentMethods = paymentMethods.data.filter(
      (pm: any) => pm.customer === stripeCustomerId
    );

    const formattedPaymentMethods = ownPaymentMethods.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      },
      isDefault: pm.id === customer.invoice_settings?.default_payment_method,
    }));

    return NextResponse.json({
      paymentMethods: formattedPaymentMethods,
      customerId: stripeCustomerId,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/payment-methods/list:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

