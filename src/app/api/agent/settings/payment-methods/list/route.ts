import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

// GET: List payment methods for the current agent
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

    // Get agent's email to find Stripe customer
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

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: agentEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ paymentMethods: [] });
    }

    const customer = customers.data[0];

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });

    // Format payment methods for frontend
    const formattedPaymentMethods = paymentMethods.data.map((pm: any) => ({
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
      customerId: customer.id,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/payment-methods/list:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

