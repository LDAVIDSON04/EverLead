// src/app/api/admin/appointments/[appointmentId]/refund/route.ts
// Admin endpoint to refund and cancel an appointment

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointment ID" },
        { status: 400 }
      );
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, price_cents, status")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Error fetching appointment:", appointmentError);
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
        { status: 400 }
      );
    }

    // Look up payment intent from payments table
    let stripePaymentIntentId: string | null = null;
    if (appointment.price_cents) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("stripe_payment_intent_id")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error("Error fetching payment:", paymentError);
      } else if (payment?.stripe_payment_intent_id) {
        stripePaymentIntentId = payment.stripe_payment_intent_id;
      }
    }

    // Check if there's a payment to refund
    if (stripePaymentIntentId && appointment.price_cents) {
      try {
        // Create refund via Stripe
        const refund = await stripe.refunds.create({
          payment_intent: stripePaymentIntentId,
          amount: appointment.price_cents, // Refund in cents
          reason: "requested_by_customer",
          metadata: {
            appointment_id: appointmentId,
            agent_id: appointment.agent_id || "",
            refunded_by: "admin",
          },
        });

        console.log("✅ Refund created successfully:", {
          refundId: refund.id,
          appointmentId,
          amount: appointment.price_cents,
        });
      } catch (stripeError: any) {
        console.error("Error creating refund:", stripeError);
        // If refund fails, still cancel the appointment
        // This allows admin to handle refund manually if needed
        const { error: cancelError } = await supabaseAdmin
          .from("appointments")
          .update({
            status: "cancelled",
          })
          .eq("id", appointmentId);

        if (cancelError) {
          console.error("Error cancelling appointment after refund failure:", cancelError);
        }

        return NextResponse.json(
          {
            error: "Failed to process refund",
            details: stripeError.message,
            appointmentCancelled: !cancelError,
          },
          { status: 500 }
        );
      }
    } else if (appointment.price_cents && !stripePaymentIntentId) {
      // Appointment has a price but no payment intent found - will cancel without refund
      console.log("ℹ️ Appointment has price but no payment record found - cancelling without refund:", {
        appointmentId,
        priceCents: appointment.price_cents,
      });
    }

    // Update appointment status to cancelled (no notes column in appointments table)
    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        status: "cancelled",
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("❌ Error updating appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    console.log("✅ Appointment cancelled successfully:", {
      appointmentId,
      refunded: !!stripePaymentIntentId,
      hadPaymentIntent: !!stripePaymentIntentId,
    });

    return NextResponse.json({
      success: true,
      message: stripePaymentIntentId 
        ? "Appointment cancelled and refunded successfully" 
        : "Appointment cancelled successfully (no payment record found to refund)",
      refunded: !!stripePaymentIntentId,
    });
  } catch (error: any) {
    console.error("Error in refund endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
