// src/app/api/appointments/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAgentNewAppointmentEmail } from "@/lib/emails";

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

    // Get appointment and lead details for email before updating
    const { data: apptBeforeUpdate, error: apptFetchError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        requested_date,
        requested_window,
        leads (
          id,
          full_name,
          first_name,
          last_name,
          city,
          province,
          service_type
        )
      `)
      .eq("id", appointmentId)
      .single();

    let leadData: any = null;
    if (apptBeforeUpdate) {
      // Transform leads data (comes as array from Supabase join)
      leadData = Array.isArray(apptBeforeUpdate.leads) 
        ? apptBeforeUpdate.leads[0] 
        : apptBeforeUpdate.leads;
    }

    if (apptFetchError) {
      console.error("Error fetching appointment for email:", apptFetchError);
      // Continue anyway - email is optional
    }

    // Assign the appointment to this agent and set price (atomic update with status check)
    const APPOINTMENT_PRICE_CENTS = 29_00; // $29.00
    
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        agent_id: agentId,
        status: "booked",
        price_cents: APPOINTMENT_PRICE_CENTS,
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

    // Get agent email and name for notification
    const { data: agentAuth, error: agentAuthError } = await supabaseAdmin.auth.admin.getUserById(agentId);
    const agentEmail = agentAuth?.user?.email;
    const { data: agentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", agentId)
      .maybeSingle();
    const agentName = agentProfile?.full_name || null;

    // Fire-and-forget agent email (don't block response)
    if (agentEmail && apptBeforeUpdate) {
      const consumerName = leadData?.full_name || 
        (leadData?.first_name || leadData?.last_name
          ? [leadData?.first_name, leadData?.last_name].filter(Boolean).join(' ')
          : null);

      sendAgentNewAppointmentEmail({
        to: agentEmail,
        agentName,
        consumerName,
        requestedDate: apptBeforeUpdate.requested_date,
        requestedWindow: apptBeforeUpdate.requested_window,
        city: leadData?.city || null,
        province: leadData?.province || null,
        serviceType: leadData?.service_type || null,
      }).catch((err) => {
        console.error('Error sending agent appointment email (non-fatal):', err);
      });
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

