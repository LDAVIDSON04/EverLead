// Helper function to charge an agent's saved payment method when an appointment is booked
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabaseAdmin";

export async function chargeAgentForAppointment(
  agentId: string,
  amountCents: number,
  appointmentId: string
): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
  try {
    // Get agent's email to find Stripe customer
    let agentEmail: string | null = null;
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
      agentEmail = authUser?.user?.email || null;
    } catch (authError) {
      console.error("Error fetching agent email:", authError);
      return { success: false, error: "Failed to fetch agent information" };
    }

    if (!agentEmail) {
      return { success: false, error: "Agent email not found" };
    }

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: agentEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return { success: false, error: "Stripe customer not found. Please add a payment method." };
    }

    const customer = customers.data[0];

    // Get default payment method or first available payment method
    let paymentMethodId: string | null = null;

    if (customer.invoice_settings?.default_payment_method) {
      paymentMethodId = customer.invoice_settings.default_payment_method as string;
    } else {
      // Get the first payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        return { success: false, error: "No payment method found. Please add a payment method." };
      }

      paymentMethodId = paymentMethods.data[0].id;
    }

    if (!paymentMethodId) {
      return { success: false, error: "No payment method available" };
    }

    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      description: `Appointment booking fee - Appointment ${appointmentId}`,
      metadata: {
        agent_id: agentId,
        appointment_id: appointmentId,
        type: "appointment_booking",
      },
    });

    if (paymentIntent.status === "succeeded") {
      return { success: true, paymentIntentId: paymentIntent.id };
    } else {
      return { success: false, error: `Payment failed: ${paymentIntent.status}` };
    }
  } catch (error: any) {
    console.error("Error charging agent for appointment:", error);
    return {
      success: false,
      error: error.message || "Failed to process payment",
    };
  }
}

