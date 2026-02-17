// src/app/api/appointments/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAgentNewAppointmentEmail } from "@/lib/emails";
import { sendAgentNewAppointmentSMS } from "@/lib/sms";
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

    // Assign the appointment to this agent and preserve price (atomic update with status check)
    // Get the current price_cents from the appointment (may be discounted)
    const { data: currentAppt } = await supabaseAdmin
      .from("appointments")
      .select("price_cents")
      .eq("id", appointmentId)
      .single();
    
    // Use price from Stripe session (already paid via checkout)
    const sessionAmountCents = session.amount_total || 0;
    const finalPriceCents = sessionAmountCents > 0 ? sessionAmountCents : 1; // Fallback to 1 cent
    
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        agent_id: agentId,
        status: "booked",
        price_cents: finalPriceCents,
        cached_lead_full_name: leadData?.full_name?.trim() || null, // Freeze name as entered so it never changes
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .eq("status", "pending")
      .is("agent_id", null)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("Appointment assignment error:", {
        error: updateError,
        appointmentId,
        agentId,
        updateErrorCode: updateError?.code,
        updateErrorMessage: updateError?.message,
      });
      return NextResponse.json(
        { 
          error: "Could not assign appointment. It may have been purchased by another agent.",
          details: updateError?.message 
        },
        { status: 500 }
      );
    }

    console.log("✅ Appointment successfully assigned:", {
      appointmentId,
      agentId,
      status: updated.status,
      price_cents: updated.price_cents,
      lead_id: updated.lead_id,
    });

    // Also assign the lead to this agent so it shows in "My Pipeline"
    if (updated.lead_id) {
      const { error: leadUpdateError } = await supabaseAdmin
        .from("leads")
        .update({
          assigned_agent_id: agentId,
          status: "purchased_by_agent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", updated.lead_id)
        .is("assigned_agent_id", null); // Only update if not already assigned

      if (leadUpdateError) {
        console.error("⚠️ Failed to assign lead to agent (non-fatal):", leadUpdateError);
        // Don't fail the whole request - appointment is already assigned
      } else {
        console.log("✅ Lead also assigned to agent:", {
          lead_id: updated.lead_id,
          agentId,
        });
      }
    }

    // Get agent email, name, phone, and notification preferences for notification
    const { data: agentAuth, error: agentAuthError } = await supabaseAdmin.auth.admin.getUserById(agentId);
    const agentEmail = agentAuth?.user?.email;
    const { data: agentProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone, metadata, agent_province")
      .eq("id", agentId)
      .maybeSingle();
    const agentName = agentProfile?.full_name || null;
    const agentPhone = agentProfile?.phone;
    const agentMetadata = agentProfile?.metadata || {};
    const notificationPrefs = agentMetadata.notification_preferences || {};
    const newAppointmentSmsEnabled = notificationPrefs.newAppointment?.sms === true;

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

    // Fire-and-forget agent SMS if enabled (don't block response)
    if (agentPhone && newAppointmentSmsEnabled && apptBeforeUpdate) {
      const consumerName = leadData?.full_name || 
        (leadData?.first_name || leadData?.last_name
          ? [leadData?.first_name, leadData?.last_name].filter(Boolean).join(' ')
          : 'Client');

      sendAgentNewAppointmentSMS({
        to: agentPhone,
        consumerName,
        requestedDate: apptBeforeUpdate.requested_date,
        requestedWindow: apptBeforeUpdate.requested_window,
        province: leadData?.province || agentProfile?.agent_province || undefined,
      }).catch((err) => {
        console.error('Error sending agent appointment SMS (non-fatal):', err);
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

