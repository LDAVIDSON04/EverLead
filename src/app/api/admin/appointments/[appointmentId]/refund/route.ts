// src/app/api/admin/appointments/[appointmentId]/refund/route.ts
// Admin endpoint to refund and cancel an appointment

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendRefundEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const admin = await requireAdmin(req.headers.get("authorization"));
  if (!admin.ok) return admin.response;

  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointment ID" },
        { status: 400 }
      );
    }

    // Fetch appointment - try to get stripe_payment_intent_id if column exists
    let appointment: any;
    let stripePaymentIntentId: string | null = null;

    // First, try to fetch with stripe_payment_intent_id column and related data
    const appointmentResult = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        agent_id,
        price_cents,
        status,
        stripe_payment_intent_id,
        requested_date,
        confirmed_at,
        leads (
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointmentResult.error) {
      // If error due to missing column, try without it
      if (appointmentResult.error.code === '42703' && appointmentResult.error.message?.includes('stripe_payment_intent_id')) {
        console.log("stripe_payment_intent_id column doesn't exist, checking payments table");
        const resultWithoutColumn = await supabaseAdmin
          .from("appointments")
          .select(`
            id,
            agent_id,
            price_cents,
            status,
            requested_date,
            confirmed_at,
            leads (
              id,
              first_name,
              last_name,
              full_name
            )
          `)
          .eq("id", appointmentId)
          .maybeSingle();
        
        if (resultWithoutColumn.error || !resultWithoutColumn.data) {
          console.error("Error fetching appointment:", resultWithoutColumn.error);
          return NextResponse.json(
            { error: "Appointment not found" },
            { status: 404 }
          );
        }
        appointment = resultWithoutColumn.data;
      } else {
        console.error("Error fetching appointment:", appointmentResult.error);
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
    } else {
      appointment = appointmentResult.data;
      if (appointment?.stripe_payment_intent_id) {
        stripePaymentIntentId = appointment.stripe_payment_intent_id;
      }
    }

    if (!appointment) {
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

    // If payment intent not found in appointments table, check payments table
    if (!stripePaymentIntentId && appointment.price_cents) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("stripe_payment_intent_id")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error("Error fetching payment from payments table:", paymentError);
      } else if (payment?.stripe_payment_intent_id) {
        stripePaymentIntentId = payment.stripe_payment_intent_id;
        console.log("Found payment intent in payments table:", stripePaymentIntentId);
      }
    }

    // Store refund ID for email
    let refundId: string | undefined;

    // Check if there's a payment to refund
    if (stripePaymentIntentId && appointment.price_cents) {
      try {
        // First, verify the payment intent exists and is refundable
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        console.log("🔍 Payment Intent details:", {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          amount_received: paymentIntent.amount_received,
        });

        // Check if payment intent has been paid
        if (paymentIntent.status !== 'succeeded') {
          throw new Error(`Payment intent status is ${paymentIntent.status}, cannot refund. Only succeeded payments can be refunded.`);
        }

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

        // Store refund ID for email
        refundId = refund.id;

        console.log("✅ Refund created successfully:", {
          refundId: refund.id,
          appointmentId,
          amount: appointment.price_cents,
          refundStatus: refund.status,
          refundAmount: refund.amount,
          paymentIntentId: stripePaymentIntentId,
        });

        // Verify refund was actually created and check its status
        if (refund.status === 'failed') {
          throw new Error(`Refund failed: ${refund.failure_reason || 'Unknown reason'}`);
        }

        // Retrieve the refund to get latest status (in case it's pending)
        const refundDetails = await stripe.refunds.retrieve(refund.id);
        console.log("🔍 Refund details after creation:", {
          refundId: refundDetails.id,
          status: refundDetails.status,
          amount: refundDetails.amount,
          currency: refundDetails.currency,
          charge: refundDetails.charge,
          reason: refundDetails.reason,
          failure_reason: refundDetails.failure_reason,
        });

        if (refundDetails.status === 'failed') {
          throw new Error(`Refund failed: ${refundDetails.failure_reason || 'Unknown reason'}`);
        }

        if (refundDetails.status === 'pending') {
          console.log("⚠️ Refund is pending - it may take a few moments to process");
        }

        // Update payment record status to refunded in payments table
        try {
          await supabaseAdmin
            .from("payments")
            .update({
              status: 'refunded',
            })
            .eq("appointment_id", appointmentId)
            .eq("stripe_payment_intent_id", stripePaymentIntentId);
          
          console.log("✅ Payment record updated to refunded status");
        } catch (updatePaymentError: any) {
          console.error("⚠️ Failed to update payment record status (non-critical):", updatePaymentError);
          // Don't fail the refund if payment record update fails
        }
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

    // Send refund email to agent if refund was processed
    if (stripePaymentIntentId && appointment.price_cents) {
      try {
        // Fetch agent's email and name
        const { data: agentProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name, first_name, last_name")
          .eq("id", appointment.agent_id)
          .maybeSingle();

        if (agentProfile?.email) {
          // Format appointment date and time
          let appointmentDate: string | undefined;
          let appointmentTime: string | undefined;
          
          if (appointment.requested_date) {
            appointmentDate = new Date(appointment.requested_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
          
          if (appointment.confirmed_at) {
            appointmentTime = new Date(appointment.confirmed_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZoneName: 'short'
            });
          }

          // Get client name from leads
          const clientName = appointment.leads?.full_name || 
                            (appointment.leads?.first_name && appointment.leads?.last_name 
                              ? `${appointment.leads.first_name} ${appointment.leads.last_name}`
                              : null);

          await sendRefundEmail({
            to: agentProfile.email,
            agentName: agentProfile.full_name || `${agentProfile.first_name || ''} ${agentProfile.last_name || ''}`.trim(),
            appointmentId,
            amountCents: appointment.price_cents,
            refundId: refundId || undefined,
            consumerName: clientName || undefined,
            appointmentDate,
            appointmentTime,
          });
        }
      } catch (emailError: any) {
        // Log but don't fail the refund if email fails
        console.error("⚠️ Failed to send refund email (non-critical):", emailError);
      }
    }

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
