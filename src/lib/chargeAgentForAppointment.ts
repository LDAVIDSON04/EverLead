// Helper function to charge an agent's saved payment method when an appointment is booked
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabaseAdmin";

export async function chargeAgentForAppointment(
  agentId: string,
  amountCents: number,
  appointmentId: string
): Promise<{ 
  success: boolean; 
  paymentIntentId?: string; 
  error?: string;
  stripeErrorCode?: string;
  stripeErrorMessage?: string;
}> {
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

    let stripeCustomerId = (profile.metadata as any)?.stripe_customer_id;
    console.log("🔍 [chargeAgentForAppointment] Stripe customer ID:", stripeCustomerId ? "Found" : "NOT FOUND", {
      agentId,
      hasMetadata: !!profile.metadata,
      stripeCustomerId: stripeCustomerId || "MISSING",
    });

    // If no customer ID in metadata, try to find or create one by email
    if (!stripeCustomerId) {
      console.log("⚠️ [chargeAgentForAppointment] No customer ID in metadata, attempting to find by email...");
      
      // Get agent's email
      let agentEmail: string | null = null;
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
        agentEmail = authUser?.user?.email || null;
      } catch (authError) {
        console.error("❌ [chargeAgentForAppointment] Error fetching agent email:", authError);
        return { success: false, error: "Failed to fetch agent email" };
      }

      if (!agentEmail) {
        console.error("❌ [chargeAgentForAppointment] Agent email not found");
        return { success: false, error: "Agent email not found" };
      }

      // Try to find existing Stripe customer by email
      const customers = await stripe.customers.list({
        email: agentEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        console.log("✅ [chargeAgentForAppointment] Found existing Stripe customer by email:", stripeCustomerId);
        
        // Save the customer ID to profile metadata for future use
        await supabaseAdmin
          .from("profiles")
          .update({
            metadata: {
              ...(profile.metadata || {}),
              stripe_customer_id: stripeCustomerId,
            },
          })
          .eq("id", agentId);
      } else {
        console.error("❌ [chargeAgentForAppointment] No Stripe customer found for email:", agentEmail);
        return { success: false, error: "No Stripe customer found. Please add a payment method." };
      }
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
      const lastPaymentError = paymentIntent.last_payment_error;
      const errorCode = lastPaymentError?.code || 'card_declined';
      const errorMessage = lastPaymentError?.message || "Payment method was declined. Please update your payment method.";
      console.error("❌ [chargeAgentForAppointment] Payment requires payment method - card likely declined", {
        errorCode,
        errorMessage,
      });
      return { 
        success: false, 
        error: errorMessage,
        stripeErrorCode: errorCode,
        stripeErrorMessage: errorMessage,
      };
    } else {
      console.error("❌ [chargeAgentForAppointment] Payment failed with status:", paymentIntent.status);
      return { success: false, error: `Payment failed with status: ${paymentIntent.status}` };
    }
  } catch (error: any) {
    console.error("Error charging agent for appointment:", error);
    
    // Handle Stripe card errors
    if (error.type === 'StripeCardError') {
      return { 
        success: false, 
        error: `Card declined: ${error.message}`,
        stripeErrorCode: error.code || 'card_declined',
        stripeErrorMessage: error.message,
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to process payment",
      stripeErrorCode: error.code,
      stripeErrorMessage: error.message,
    };
  }
}

