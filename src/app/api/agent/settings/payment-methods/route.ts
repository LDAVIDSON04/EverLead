import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";

// DELETE: Remove a payment method (fully detaches from Stripe for this agent's customer)
export async function DELETE(request: NextRequest) {
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
    const body = await request.json();
    const { paymentMethodId, newPaymentMethodId } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: "paymentMethodId is required" }, { status: 400 });
    }

    // SECURITY: Use only this agent's profile.stripe_customer_id.
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
      return NextResponse.json({ error: "No payment method on file" }, { status: 404 });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    // If a new payment method is provided (optional replacement), verify it exists and is valid
    if (newPaymentMethodId) {
      try {
        const newPaymentMethod = await stripe.paymentMethods.retrieve(newPaymentMethodId);
        
        // Verify the new payment method belongs to this customer
        if (newPaymentMethod.customer !== stripeCustomerId) {
          return NextResponse.json(
            { error: "The new payment method does not belong to your account" },
            { status: 400 }
          );
        }

        // Attach the new payment method to the customer if not already attached
        if (!newPaymentMethod.customer) {
          await stripe.paymentMethods.attach(newPaymentMethodId, {
            customer: stripeCustomerId,
          });
        }
      } catch (stripeError: any) {
        console.error("Error verifying new payment method:", stripeError);
        return NextResponse.json(
          { error: "Invalid new payment method. Please ensure it's valid before removing the old one." },
          { status: 400 }
        );
      }
    }

    // Verify the payment method to be deleted exists and belongs to this customer
    const paymentMethodToDelete = paymentMethods.data.find(pm => pm.id === paymentMethodId);
    if (!paymentMethodToDelete) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (paymentMethodToDelete.customer !== stripeCustomerId) {
      return NextResponse.json(
        { error: "Payment method does not belong to your account" },
        { status: 403 }
      );
    }

    // Detach the payment method from the customer (fully removed from Stripe for this customer)
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return NextResponse.json({ success: true, message: "Payment method removed successfully" });
    } catch (stripeError: any) {
      console.error("Error detaching payment method:", stripeError);
      return NextResponse.json(
        { error: "Failed to remove payment method" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Error in DELETE /api/agent/settings/payment-methods:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

