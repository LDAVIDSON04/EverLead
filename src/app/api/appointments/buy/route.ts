// src/app/api/appointments/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointmentId = body.appointmentId as string | undefined;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 }
      );
    }

    // 1) Get agentId from request body (client sends it)
    const agentId = body.agentId as string | undefined;

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // 2) Verify agent is approved
    const { data: agentProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, approval_status")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !agentProfile) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    if (agentProfile.role !== "agent" || agentProfile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent account not approved" },
        { status: 403 }
      );
    }

    // 3) Fetch the appointment to verify it exists and is still available
    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, status, agent_id, lead_id, requested_date, requested_window")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appt.status !== "pending" || appt.agent_id !== null) {
      return NextResponse.json(
        { error: "Appointment is no longer available" },
        { status: 409 }
      );
    }

    // 4) Get lead info for Stripe description
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("city, province, urgency_level")
      .eq("id", appt.lead_id)
      .maybeSingle();

    const leadLocation = lead
      ? `${lead.city || ""}${lead.city && lead.province ? ", " : ""}${lead.province || ""}`
      : "your area";

    // 5) Create Stripe checkout session for $39
    const appointmentPriceCents = 3900; // $39.00

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const successUrl = `${baseUrl}/agent/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}&type=appointment&appointmentId=${appointmentId}`;
    const cancelUrl = `${baseUrl}/agent/appointments?purchase=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: appointmentPriceCents,
            product_data: {
              name: "Planning Call Appointment",
              description: `Appointment in ${leadLocation} - ${appt.requested_date} (${appt.requested_window})`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        appointmentId: appointmentId,
        leadId: appt.lead_id || "",
        agentId: agentId,
        priceCents: String(appointmentPriceCents),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Appointment buy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

