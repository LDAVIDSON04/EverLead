// API endpoint to handle payment method updates
// This should be called after a payment method is successfully added
// It will attempt to charge any outstanding declined payments and unpause the account if successful
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";
import { chargeAgentForAppointment } from "@/lib/chargeAgentForAppointment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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

    // Fetch all pending declined payments for this agent
    const { data: declinedPayments, error: declinedPaymentsError } = await supabaseAdmin
      .from("declined_payments")
      .select("id, appointment_id, amount_cents")
      .eq("agent_id", agentId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }); // Charge oldest first

    if (declinedPaymentsError) {
      console.error("Error fetching declined payments:", declinedPaymentsError);
      return NextResponse.json(
        { error: "Failed to fetch declined payments" },
        { status: 500 }
      );
    }

    if (!declinedPayments || declinedPayments.length === 0) {
      // No outstanding payments - just unpause the account if it's paused
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("metadata")
        .eq("id", agentId)
        .single();

      if (profile) {
        const metadata = profile.metadata || {};
        if ((metadata as any)?.paused_account === true) {
          // Unpause the account
          await supabaseAdmin
            .from("profiles")
            .update({
              metadata: {
                ...metadata,
                paused_account: false,
                paused_at: null,
              },
            })
            .eq("id", agentId);
          console.log("✅ Unpaused account for agent (no outstanding payments):", agentId);
        }
      }

      return NextResponse.json({
        success: true,
        message: "No outstanding payments. Account unpaused.",
        chargedPayments: [],
        failedPayments: [],
      });
    }

    // Attempt to charge for each outstanding payment
    const results = await Promise.allSettled(
      declinedPayments.map(async (payment) => {
        try {
          const chargeResult = await chargeAgentForAppointment(
            agentId,
            payment.amount_cents,
            payment.appointment_id
          );

          if (chargeResult.success && chargeResult.paymentIntentId) {
            // Mark as resolved
            await supabaseAdmin
              .from("declined_payments")
              .update({
                status: "resolved",
                resolved_at: new Date().toISOString(),
                resolved_payment_intent_id: chargeResult.paymentIntentId,
              })
              .eq("id", payment.id);

            // Update appointment with payment details
            await supabaseAdmin
              .from("appointments")
              .update({
                price_cents: payment.amount_cents,
                stripe_payment_intent_id: chargeResult.paymentIntentId,
                notes: null, // Clear any payment failure notes
              })
              .eq("id", payment.appointment_id);

            return {
              paymentId: payment.id,
              appointmentId: payment.appointment_id,
              success: true,
              paymentIntentId: chargeResult.paymentIntentId,
            };
          } else {
            // Still failed
            return {
              paymentId: payment.id,
              appointmentId: payment.appointment_id,
              success: false,
              error: chargeResult.error,
            };
          }
        } catch (error: any) {
          console.error(`Error charging payment ${payment.id}:`, error);
          return {
            paymentId: payment.id,
            appointmentId: payment.appointment_id,
            success: false,
            error: error.message || "Unknown error",
          };
        }
      })
    );

    const chargedPayments = results
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);
    
    const failedPayments = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    // Check if all payments were successfully charged
    const allCharged = chargedPayments.length === declinedPayments.length;

    // Update agent's paused status
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", agentId)
      .single();

    if (profile) {
      const metadata = profile.metadata || {};
      if (allCharged && (metadata as any)?.paused_account === true) {
        // All payments charged - unpause the account
        await supabaseAdmin
          .from("profiles")
          .update({
            metadata: {
              ...metadata,
              paused_account: false,
              paused_at: null,
            },
          })
          .eq("id", agentId);
        console.log("✅ Unpaused account for agent (all payments charged):", agentId);
      } else if (!allCharged && (metadata as any)?.paused_account !== true) {
        // Some payments failed - ensure account is still paused
        await supabaseAdmin
          .from("profiles")
          .update({
            metadata: {
              ...metadata,
              paused_account: true,
              paused_at: new Date().toISOString(),
            },
          })
          .eq("id", agentId);
        console.log("⚠️ Account remains paused (some payments failed):", agentId);
      }
    }

    return NextResponse.json({
      success: allCharged,
      message: allCharged
        ? "All outstanding payments charged successfully. Account unpaused."
        : `${chargedPayments.length} of ${declinedPayments.length} payments charged. Some payments failed.`,
      chargedPayments,
      failedPayments,
      allCharged,
    });
  } catch (error: any) {
    console.error("Error in payment-method-updated API:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

