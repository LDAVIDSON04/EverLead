// src/app/api/appointments/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body.sessionId as string | undefined;
    const appointmentId = body.appointmentId as string | undefined;
    const agentId = body.agentId as string | undefined;

    if (!sessionId || !appointmentId || !agentId) {
      return NextResponse.json(
        { error: "Missing sessionId, appointmentId, or agentId" },
        { status: 400 }
      );
    }

    // Verify Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify metadata matches
    if (session.metadata?.appointmentId !== appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID mismatch" },
        { status: 400 }
      );
    }

    // Assign the appointment to this agent (atomic update with status check)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        agent_id: agentId,
        status: "booked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .eq("status", "pending")
      .is("agent_id", null)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("Appointment assignment error:", updateError);
      return NextResponse.json(
        { error: "Could not assign appointment. It may have been purchased by another agent." },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment: updated, ok: true });
  } catch (err: any) {
    console.error("Appointment confirm error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

