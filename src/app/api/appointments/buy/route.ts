// src/app/api/appointments/buy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import { checkBotId } from 'botid/server';

export async function POST(req: NextRequest) {
  // Check for bots
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json(
      { error: 'Bot detected. Access denied.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const appointmentId = body.appointmentId as string | undefined;
    const acknowledgedTimeWindow = body.acknowledgedTimeWindow as boolean | undefined;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Missing appointmentId" },
        { status: 400 }
      );
    }

    if (!acknowledgedTimeWindow) {
      return NextResponse.json(
        { error: "You must acknowledge the time-window policy before purchasing." },
        { status: 400 }
      );
    }

    // 1) Get agentId from request body (client sends it)
    // Note: For better security, we could use server-side auth, but keeping current pattern for now
    const agentId = body.agentId as string | undefined;

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agentId" },
        { status: 400 }
      );
    }

    // 2) Load agent profile + approval + region
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status, agent_province")
      .eq("id", agentId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Could not load agent profile" },
        { status: 403 }
      );
    }

    if (profile.role !== "agent" || profile.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Your account is not approved to buy appointments yet" },
        { status: 403 }
      );
    }

    // 3) Fetch appointment + lead summary (for email + region guard)
    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        status,
        agent_id,
        lead_id,
        requested_date,
        requested_window,
        price_cents,
        leads (
          id,
          full_name,
          city,
          province,
          service_type
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Extra safety: make sure this appointment is in the agent's region
    const lead = Array.isArray((appt as any).leads) 
      ? (appt as any).leads[0] 
      : (appt as any).leads;

    if (lead?.province && profile.agent_province) {
      const leadProvinceUpper = (lead.province || '').toUpperCase().trim();
      const agentProvinceUpper = (profile.agent_province || '').toUpperCase().trim();
      
      if (leadProvinceUpper !== agentProvinceUpper) {
        return NextResponse.json(
          { error: `You are not licensed/assigned for this region. This appointment is in ${lead.province}, but you are licensed for ${profile.agent_province}.` },
          { status: 403 }
        );
      }
    }

    if (appt.status !== "pending" || appt.agent_id !== null) {
      return NextResponse.json(
        { error: "Appointment is no longer available" },
        { status: 409 }
      );
    }

    // 4) Get lead info for Stripe description
    const leadLocation = lead
      ? `${lead.city || ""}${lead.city && lead.province ? ", " : ""}${lead.province || ""}`
      : "your area";

    // 5) Use appointment's price_cents if set, otherwise default to $0 (free for testing)
    const appointmentPriceCents = appt.price_cents !== null && appt.price_cents !== undefined
      ? Number(appt.price_cents) 
      : 0; // Default $0.00 (free for testing)

    // If price is $0, directly assign the appointment without Stripe
    if (appointmentPriceCents === 0) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("appointments")
        .update({
          agent_id: agentId,
          status: "booked",
          price_cents: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .eq("status", "pending")
        .is("agent_id", null)
        .select()
        .single();

      if (updateError || !updated) {
        console.error("Free appointment assignment error:", updateError);
        return NextResponse.json(
          { error: "Could not assign appointment. It may have been purchased by another agent." },
          { status: 500 }
        );
      }

      // Return success URL for free appointment
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      
      return NextResponse.json({ 
        url: `${baseUrl}/agent/dashboard?purchase=success&type=appointment&appointmentId=${appointmentId}&free=true`,
        free: true 
      });
    }

    // For paid appointments, use Stripe checkout
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

