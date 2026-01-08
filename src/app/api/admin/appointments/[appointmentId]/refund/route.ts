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

    // Fetch appointment with payment details
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, agent_id, price_cents, stripe_payment_intent_id, status")
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

    // Check if there's a payment to refund
    if (appointment.stripe_payment_intent_id && appointment.price_cents) {
      try {
        // Create refund via Stripe
        const refund = await stripe.refunds.create({
          payment_intent: appointment.stripe_payment_intent_id,
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
        // If refund fails, still cancel the appointment but note the error
        // This allows admin to handle refund manually if needed
        await supabaseAdmin
          .from("appointments")
          .update({
            status: "cancelled",
            notes: `Cancelled by admin. Refund failed: ${stripeError.message}. Manual refund may be required.`,
          })
          .eq("id", appointmentId);

        return NextResponse.json(
          {
            error: "Failed to process refund",
            details: stripeError.message,
            appointmentCancelled: true,
          },
          { status: 500 }
        );
      }
    }

    // Update appointment status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        status: "cancelled",
        notes: `Cancelled and refunded by admin on ${new Date().toISOString()}.`,
      })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled and refunded successfully",
      refunded: !!appointment.stripe_payment_intent_id,
    });
  } catch (error: any) {
    console.error("Error in refund endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
