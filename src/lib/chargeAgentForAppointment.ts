// Helper function to charge an agent's saved payment method when an appointment is booked
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabaseAdmin";

export async function chargeAgentForAppointment(
  agentId: string,
  amountCents: number,
  appointmentId: string
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  try {
    // Get agent's profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Error fetching agent profile:", profileError);
      return { success: false, error: "Agent profile not found" };
    }

    const stripeCustomerId = (profile.metadata as any)?.stripe_customer_id;
    if (!stripeCustomerId) {
      return { success: false, error: "Agent has no Stripe customer ID. Please add a payment method." };
    }

    // Get the agent's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return { success: false, error: "No payment method found. Please add a payment method." };
    }

    // Use the first payment method (or could use default if set)
    const paymentMethodId = paymentMethods.data[0].id;

    // Create and confirm payment intent with off_session: true for saved cards
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

    if (paymentIntent.status === "succeeded") {
      console.log(`✅ Successfully charged agent ${agentId} ${amountCents / 100} CAD for appointment ${appointmentId}. Payment Intent: ${paymentIntent.id}`);
      return { success: true, paymentIntentId: paymentIntent.id };
    } else if (paymentIntent.status === "requires_payment_method") {
      // Card was declined or requires authentication
      return { success: false, error: "Payment method was declined. Please update your payment method." };
    } else {
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

