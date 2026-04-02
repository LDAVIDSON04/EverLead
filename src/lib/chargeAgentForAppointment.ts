// Helper function to charge an agent's saved payment method when an appointment is booked
import type Stripe from "stripe";
import { stripe } from "./stripe";
import { supabaseAdmin } from "./supabaseAdmin";

const DEFAULT_BOOKING_FEE_TAX_CODE = "txcd_10000000"; // General - Electronically Supplied Services

function bookingFeeTaxCode(): string {
  const fromEnv = process.env.STRIPE_BOOKING_FEE_TAX_CODE?.trim();
  return fromEnv || DEFAULT_BOOKING_FEE_TAX_CODE;
}

/** Maps agent profile / Stripe address text to a 2-letter CA province code (Stripe Tax). */
function toCanadianProvinceCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const n = raw.toLowerCase().trim();
  const map: Record<string, string> = {
    bc: "BC",
    "british columbia": "BC",
    ab: "AB",
    alberta: "AB",
    sk: "SK",
    saskatchewan: "SK",
    mb: "MB",
    manitoba: "MB",
    on: "ON",
    ontario: "ON",
    qc: "QC",
    quebec: "QC",
    pq: "QC",
    nb: "NB",
    "new brunswick": "NB",
    ns: "NS",
    "nova scotia": "NS",
    pe: "PE",
    pei: "PE",
    "prince edward island": "PE",
    nl: "NL",
    newfoundland: "NL",
    "newfoundland and labrador": "NL",
    yt: "YT",
    yukon: "YT",
    nt: "NT",
    nwt: "NT",
    "northwest territories": "NT",
    nu: "NU",
    nunavut: "NU",
  };
  if (map[n]) return map[n];
  const upper = raw.trim().toUpperCase();
  if (["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"].includes(upper)) {
    return upper;
  }
  return null;
}

type TaxAddress = {
  line1?: string;
  city?: string;
  state: string;
  postal_code?: string;
  country: "CA";
};

async function resolveTaxAddressForAgent(
  profile: {
    agent_city: string | null;
    agent_province: string | null;
    metadata: unknown;
  },
  stripeCustomerId: string
): Promise<TaxAddress | null> {
  const meta = (profile.metadata as { address?: Record<string, string> } | null)?.address;
  const provinceRaw = profile.agent_province || meta?.province;
  let state = toCanadianProvinceCode(provinceRaw);

  const city =
    (profile.agent_city || meta?.city || "").trim() || undefined;
  const line1FromMeta = (meta?.street || "").trim();
  const postalRaw = (meta?.postalCode || "").trim();
  const postal_code = postalRaw ? postalRaw.replace(/\s+/g, "").toUpperCase() : undefined;

  if (!state) {
    try {
      const cust = await stripe.customers.retrieve(stripeCustomerId);
      if (!("deleted" in cust && cust.deleted) && cust.address?.country === "CA") {
        state = toCanadianProvinceCode(cust.address.state || undefined);
        if (state) {
          return {
            line1: cust.address.line1 || cust.address.line2 || city || "Registered business address",
            city: cust.address.city || city,
            state,
            postal_code: cust.address.postal_code?.replace(/\s+/g, "").toUpperCase() || postal_code,
            country: "CA",
          };
        }
      }
    } catch {
      // fall through
    }
    return null;
  }

  const line1 =
    line1FromMeta ||
    (city ? `${city}, ${state}` : "Registered business address");

  return {
    line1,
    city,
    state,
    postal_code,
    country: "CA",
  };
}

export async function chargeAgentForAppointment(
  agentId: string,
  amountCents: number,
  appointmentId: string
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  /** Total captured in cents (includes tax when Stripe Tax applies). */
  chargedAmountCents?: number;
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("metadata, email, agent_city, agent_province")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("❌ [chargeAgentForAppointment] Error fetching agent profile:", profileError);
      return { success: false, error: "Agent profile not found" };
    }

    const stripeCustomerId = (profile.metadata as { stripe_customer_id?: string } | null)
      ?.stripe_customer_id;
    if (!stripeCustomerId) {
      console.error(
        "❌ [chargeAgentForAppointment] No stripe_customer_id on profile. Agent must add payment method in Billing."
      );
      return { success: false, error: "No payment method on file. Please add a payment method in Billing." };
    }

    let agentEmail: string | null = profile.email || null;
    if (!agentEmail) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
        agentEmail = authUser?.user?.email || null;
      } catch {
        // Non-fatal for charge; receipt_email is optional
      }
    }

    console.log("🔍 [chargeAgentForAppointment] Fetching payment methods for customer:", stripeCustomerId);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    const ownPaymentMethods = paymentMethods.data.filter((pm) => pm.customer === stripeCustomerId);

    console.log("🔍 [chargeAgentForAppointment] Payment methods found:", ownPaymentMethods.length);

    if (ownPaymentMethods.length === 0) {
      console.error("❌ [chargeAgentForAppointment] No payment methods found for customer:", stripeCustomerId);
      return { success: false, error: "No payment method found. Please add a payment method." };
    }

    const paymentMethodId = ownPaymentMethods[0].id;
    console.log("💳 [chargeAgentForAppointment] Using payment method:", paymentMethodId, {
      brand: ownPaymentMethods[0].card?.brand,
      last4: ownPaymentMethods[0].card?.last4,
    });

    const taxAddress = await resolveTaxAddressForAgent(profile, stripeCustomerId);
    let chargeAmountCents = amountCents;
    let taxCalculationId: string | null = null;

    if (taxAddress) {
      try {
        const calculation = await stripe.tax.calculations.create({
          currency: "cad",
          line_items: [
            {
              amount: amountCents,
              reference: `appointment_booking_fee_${appointmentId}`,
              tax_code: bookingFeeTaxCode(),
              tax_behavior: "exclusive",
            },
          ],
          customer_details: {
            address: {
              country: taxAddress.country,
              state: taxAddress.state,
              city: taxAddress.city,
              line1: taxAddress.line1,
              postal_code: taxAddress.postal_code,
            },
            address_source: "billing",
          },
        });
        taxCalculationId = calculation.id;
        chargeAmountCents = calculation.amount_total;
        console.log("📋 [chargeAgentForAppointment] Tax calculation:", {
          calculationId: calculation.id,
          subtotalCents: amountCents,
          totalCents: calculation.amount_total,
          taxExclusive: calculation.tax_amount_exclusive,
        });
      } catch (taxErr: unknown) {
        const msg = taxErr instanceof Error ? taxErr.message : String(taxErr);
        console.error("❌ [chargeAgentForAppointment] Stripe Tax calculation failed:", msg);
        return {
          success: false,
          error:
            "Could not calculate sales tax for your province. Check that your business province is set correctly in Profile settings, then try again.",
          stripeErrorCode: (taxErr as { code?: string })?.code,
          stripeErrorMessage: msg,
        };
      }
    } else {
      console.warn(
        "⚠️ [chargeAgentForAppointment] Missing Canadian province for tax; charge blocked. Agent should set agent_province or business address."
      );
      return {
        success: false,
        error:
          "Add your business province (and city if possible) in Profile settings so we can calculate GST/HST on the booking fee.",
      };
    }

    console.log("💳 [chargeAgentForAppointment] Creating payment intent:", {
      subtotalCents: amountCents,
      chargeAmountCents,
      currency: "cad",
      customerId: stripeCustomerId,
      paymentMethodId,
      taxCalculationId,
    });

    const piParams: Stripe.PaymentIntentCreateParams & {
      hooks?: { inputs: { tax: { calculation: string } } };
    } = {
      amount: chargeAmountCents,
      currency: "cad",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `Appointment booking fee - Appointment ${appointmentId}`,
      receipt_email: agentEmail || undefined,
      metadata: {
        agent_id: agentId,
        appointment_id: appointmentId,
        type: "appointment_booking",
        booking_fee_subtotal_cents: String(amountCents),
        ...(taxCalculationId ? { tax_calculation_id: taxCalculationId } : {}),
      },
    };

    if (taxCalculationId) {
      piParams.hooks = { inputs: { tax: { calculation: taxCalculationId } } };
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams);

    console.log("💳 [chargeAgentForAppointment] Payment intent created:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    if (paymentIntent.status === "succeeded") {
      const captured = paymentIntent.amount;
      console.log(
        `✅ [chargeAgentForAppointment] Successfully charged agent ${agentId} ${captured / 100} CAD (subtotal ${amountCents / 100}) for appointment ${appointmentId}. Payment Intent: ${paymentIntent.id}`
      );
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        chargedAmountCents: captured,
      };
    } else if (paymentIntent.status === "requires_payment_method") {
      const lastPaymentError = paymentIntent.last_payment_error;
      const errorCode = lastPaymentError?.code || "card_declined";
      const errorMessage =
        lastPaymentError?.message || "Payment method was declined. Please update your payment method.";
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
  } catch (error: unknown) {
    const err = error as { type?: string; message?: string; code?: string };
    console.error("Error charging agent for appointment:", error);

    if (err.type === "StripeCardError") {
      return {
        success: false,
        error: `Card declined: ${err.message}`,
        stripeErrorCode: err.code || "card_declined",
        stripeErrorMessage: err.message,
      };
    }

    return {
      success: false,
      error: err.message || "Failed to process payment",
      stripeErrorCode: err.code,
      stripeErrorMessage: err.message,
    };
  }
}
