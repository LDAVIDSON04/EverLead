// Helper function to charge an agent's saved payment method when an appointment is booked
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabaseAdmin";

export async function chargeAgentForAppointment(
  agentId: string,
  amountCents: number,
  appointmentId: string
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  try {
    console.log("🔍 [chargeAgentForAppointment] Starting charge process:", {
      agentId,
      amountCents,
      appointmentId,
    });

    // Get agent's profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("❌ [chargeAgentForAppointment] Error fetching agent profile:", profileError);
      return { success: false, error: "Agent profile not found" };
    }

    const stripeCustomerId = (profile.metadata as any)?.stripe_customer_id;
    console.log("🔍 [chargeAgentForAppointment] Stripe customer ID:", stripeCustomerId ? "Found" : "NOT FOUND", {
      agentId,
      hasMetadata: !!profile.metadata,
      stripeCustomerId: stripeCustomerId || "MISSING",
    });

    if (!stripeCustomerId) {
      console.error("❌ [chargeAgentForAppointment] Agent has no Stripe customer ID");
      return { success: false, error: "Agent has no Stripe customer ID. Please add a payment method." };
    }

    // Get the agent's payment methods
    console.log("🔍 [chargeAgentForAppointment] Fetching payment methods for customer:", stripeCustomerId);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    console.log("🔍 [chargeAgentForAppointment] Payment methods found:", paymentMethods.data.length);

    if (paymentMethods.data.length === 0) {
      console.error("❌ [chargeAgentForAppointment] No payment methods found for customer:", stripeCustomerId);
      return { success: false, error: "No payment method found. Please add a payment method." };
    }

    // Use the first payment method (or could use default if set)
    const paymentMethodId = paymentMethods.data[0].id;
    console.log("💳 [chargeAgentForAppointment] Using payment method:", paymentMethodId, {
      brand: paymentMethods.data[0].card?.brand,
      last4: paymentMethods.data[0].card?.last4,
    });

    // Create and confirm payment intent with off_session: true for saved cards
    console.log("💳 [chargeAgentForAppointment] Creating payment intent:", {
      amountCents,
      currency: "cad",
      customerId: stripeCustomerId,
      paymentMethodId,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true, // Charge without requiring customer interaction (for saved cards)
      confirm: true,
      description: `Appointment booking fee - Appointment ${appointmentId}`,
      metadata: {
        agent_id: agentId,
        appointment_id: appointmentId,
        type: "appointment_booking",
      },
    });

    console.log("💳 [chargeAgentForAppointment] Payment intent created:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    if (paymentIntent.status === "succeeded") {
      console.log(`✅ [chargeAgentForAppointment] Successfully charged agent ${agentId} ${amountCents / 100} CAD for appointment ${appointmentId}. Payment Intent: ${paymentIntent.id}`);
      return { success: true, paymentIntentId: paymentIntent.id };
    } else if (paymentIntent.status === "requires_payment_method") {
      // Card was declined or requires authentication
      console.error("❌ [chargeAgentForAppointment] Payment requires payment method - card likely declined");
      return { success: false, error: "Payment method was declined. Please update your payment method." };
    } else {
      console.error("❌ [chargeAgentForAppointment] Payment failed with status:", paymentIntent.status);
      return { success: false, error: `Payment failed with status: ${paymentIntent.status}` };
    }
  } catch (error: any) {
    console.error("Error charging agent for appointment:", error);
    
    // Handle Stripe card errors
    if (error.type === 'StripeCardError') {
      return { success: false, error: `Card declined: ${error.message}` };
    }
    
    return {
      success: false,
      error: error.message || "Failed to process payment",
    };
  }
}

