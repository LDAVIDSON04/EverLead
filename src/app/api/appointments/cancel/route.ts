// src/app/api/appointments/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteExternalEventsForAgentAppointment } from "@/lib/calendarSyncAgent";
import { sendAgentCancellationEmail, sendAgentRebookingEmail, sendConsumerCancellationEmail } from "@/lib/emails";
import { sendConsumerCancellationSMS, sendAgentCancellationSMS } from "@/lib/sms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  action: z.enum(["cancel", "rebook"]).optional().default("cancel"),
});

export async function POST(req: NextRequest) {
  // Note: Bot check removed for this endpoint since it's a user-initiated action from email links
  // Security is maintained through appointment ID validation and status checks

  try {
    const body = await req.json();
    const validation = cancelAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { appointmentId, action } = validation.data;

    // Get appointment with related data for email
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        agent_id,
        lead_id,
        requested_date,
        requested_window,
        status,
        cached_lead_full_name,
        leads (
          first_name,
          last_name,
          full_name,
          email,
          phone,
          province
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError || !updatedAppointment) {
      console.error("Error cancelling appointment:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel appointment" },
        { status: 500 }
      );
    }

    // Delete from external calendars (non-blocking)
    try {
      await deleteExternalEventsForAgentAppointment(appointmentId);
    } catch (syncError: any) {
      console.error("Error deleting appointment from calendars:", syncError);
      // Don't fail the cancellation if sync deletion fails
    }

    // Get lead data for emails/SMS; use booking name (cached_lead_full_name) when available
    const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;
    const consumerName = appointment.cached_lead_full_name?.trim() ||
      lead?.full_name ||
      (lead?.first_name && lead?.last_name
        ? [lead?.first_name, lead?.last_name].filter(Boolean).join(' ')
        : null);
    const consumerEmail = lead?.email;

    // Send notification emails to both agent and customer (non-blocking)
    if (appointment.agent_id) {
      try {
        // Get agent email and name
        const { data: agentAuth } = await supabaseAdmin.auth.admin.getUserById(appointment.agent_id);
        const agentEmail = agentAuth?.user?.email;
        
        const { data: agentProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, phone, metadata, agent_province")
          .eq("id", appointment.agent_id)
          .maybeSingle();
        const agentName = agentProfile?.full_name || null;
        const agentPhone = agentProfile?.phone;
        const agentMetadata = agentProfile?.metadata || {};
        const notificationPrefs = agentMetadata.notification_preferences || {};
        const cancellationSmsEnabled = notificationPrefs.appointmentCancelled?.sms === true;

        if (agentEmail) {
          if (action === "rebook") {
            // Send rebooking notification to agent
            sendAgentRebookingEmail({
              to: agentEmail,
              agentName,
              consumerName,
              requestedDate: appointment.requested_date,
              requestedWindow: appointment.requested_window,
            }).catch((err) => {
              console.error('Error sending agent rebooking email (non-fatal):', err);
            });
          } else {
            // Send cancellation notification to agent
            sendAgentCancellationEmail({
              to: agentEmail,
              agentName,
              consumerName,
              requestedDate: appointment.requested_date,
              requestedWindow: appointment.requested_window,
            }).catch((err) => {
              console.error('Error sending agent cancellation email (non-fatal):', err);
            });
          }
        }

        // Send cancellation SMS to agent if enabled (non-blocking)
        if (action !== "rebook" && agentPhone && cancellationSmsEnabled) {
          try {
            sendAgentCancellationSMS({
              to: agentPhone,
              consumerName: consumerName || 'Client',
              requestedDate: appointment.requested_date,
              province: agentProfile?.agent_province || undefined,
            }).catch((err) => {
              console.error('Error sending agent cancellation SMS (non-fatal):', err);
            });
          } catch (smsError: any) {
            console.error('Error preparing agent cancellation SMS (non-fatal):', smsError);
          }
        }
      } catch (emailError: any) {
        console.error('Error preparing agent cancellation email (non-fatal):', emailError);
      }
    }

    // Send cancellation email to customer (non-blocking)
    if (consumerEmail) {
      try {
        sendConsumerCancellationEmail({
          to: consumerEmail,
          name: consumerName,
          requestedDate: appointment.requested_date,
          requestedWindow: appointment.requested_window,
          agentName: null, // Will be fetched if needed
        }).catch((err) => {
          console.error('Error sending consumer cancellation email (non-fatal):', err);
        });
      } catch (emailError: any) {
        console.error('Error preparing consumer cancellation email (non-fatal):', emailError);
      }
    }

    // Send cancellation SMS to customer (non-blocking)
    const leadPhone = lead?.phone;
    const leadProvince = lead?.province;
    if (leadPhone) {
      try {
        sendConsumerCancellationSMS({
          to: leadPhone,
          requestedDate: appointment.requested_date,
          province: leadProvince || undefined,
        }).catch((err) => {
          console.error('Error sending consumer cancellation SMS (non-fatal):', err);
        });
      } catch (smsError: any) {
        console.error('Error preparing consumer cancellation SMS (non-fatal):', smsError);
      }
    }

    return NextResponse.json({ 
      appointment: updatedAppointment,
      message: action === "rebook" 
        ? "Appointment cancelled. You can now reschedule."
        : "Appointment cancelled successfully",
      agentId: appointment.agent_id,
    });
  } catch (error: any) {
    console.error("Error in /api/appointments/cancel:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
