// API to fetch declined payments for admin portal
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Fetch all pending declined payments with agent and appointment info
    const { data: declinedPayments, error } = await supabaseAdmin
      .from("declined_payments")
      .select(`
        id,
        agent_id,
        appointment_id,
        amount_cents,
        decline_reason,
        stripe_error_code,
        stripe_error_message,
        created_at,
        resolved_at,
        status,
        profiles:agent_id (
          id,
          full_name,
          first_name,
          last_name,
          email,
          funeral_home,
          agent_city,
          agent_province
        ),
        appointments:appointment_id (
          id,
          starts_at,
          ends_at,
          status,
          leads (
            id,
            full_name,
            email,
            phone,
            city,
            province
          )
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching declined payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch declined payments" },
        { status: 500 }
      );
    }

    // Transform the data to flatten nested relationships
    const formattedPayments = (declinedPayments || []).map((payment: any) => {
      const agent = Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles;
      const appointment = Array.isArray(payment.appointments) ? payment.appointments[0] : payment.appointments;
      const lead = appointment?.leads ? (Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads) : null;

      // Get agent email from auth.users
      let agentEmail: string | null = null;
      try {
        // We'll fetch this in the frontend or make a separate call if needed
        // For now, we'll include it as null and fetch in the frontend
        agentEmail = agent?.email || null;
      } catch (e) {
        // Ignore errors
      }

      return {
        id: payment.id,
        agentId: payment.agent_id,
        appointmentId: payment.appointment_id,
        amountCents: payment.amount_cents,
        amountDollars: (payment.amount_cents / 100).toFixed(2),
        declineReason: payment.decline_reason,
        stripeErrorCode: payment.stripe_error_code,
        stripeErrorMessage: payment.stripe_error_message,
        createdAt: payment.created_at,
        resolvedAt: payment.resolved_at,
        status: payment.status,
        agent: agent ? {
          id: agent.id,
          fullName: agent.full_name || (agent.first_name && agent.last_name ? `${agent.first_name} ${agent.last_name}` : "Unknown"),
          email: agentEmail,
          funeralHome: agent.funeral_home,
          city: agent.agent_city,
          province: agent.agent_province,
        } : null,
        appointment: appointment ? {
          id: appointment.id,
          startsAt: appointment.starts_at,
          endsAt: appointment.ends_at,
          status: appointment.status,
        } : null,
        lead: lead ? {
          id: lead.id,
          fullName: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          province: lead.province,
        } : null,
      };
    });

    return NextResponse.json({ declinedPayments: formattedPayments });
  } catch (error: any) {
    console.error("Error in declined payments API:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

