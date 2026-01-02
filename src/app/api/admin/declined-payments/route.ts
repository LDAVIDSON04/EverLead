// API to fetch declined payments for admin portal
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Fetch all pending declined payments
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
        status
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching declined payments:", error);
      return NextResponse.json(
        { error: "Failed to fetch declined payments", details: error.message },
        { status: 500 }
      );
    }

    // Fetch related data separately
    const agentIds = [...new Set((declinedPayments || []).map((p: any) => p.agent_id).filter(Boolean))];
    const appointmentIds = [...new Set((declinedPayments || []).map((p: any) => p.appointment_id).filter(Boolean))];
    
    let agentsMap: Record<string, any> = {};
    let appointmentsMap: Record<string, any> = {};
    let leadsMap: Record<string, any> = {};

    // Fetch agents
    if (agentIds.length > 0) {
      const { data: agentsData, error: agentsError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, funeral_home, agent_city, agent_province")
        .in("id", agentIds);
      
      if (agentsError) {
        console.error("Error fetching agents for declined payments:", agentsError);
        // Continue without agent data
      } else {
        (agentsData || []).forEach((agent: any) => {
          agentsMap[agent.id] = agent;
        });
      }
    }

    // Fetch appointments
    if (appointmentIds.length > 0) {
      const { data: appointmentsData, error: appointmentsError } = await supabaseAdmin
        .from("appointments")
        .select("id, starts_at, ends_at, status, lead_id")
        .in("id", appointmentIds);
      
      if (appointmentsError) {
        console.error("Error fetching appointments for declined payments:", appointmentsError);
        // Continue without appointment data
      } else {
        (appointmentsData || []).forEach((apt: any) => {
          appointmentsMap[apt.id] = apt;
        });

        // Fetch leads
        const leadIds = [...new Set((appointmentsData || []).map((apt: any) => apt.lead_id).filter(Boolean))];
        if (leadIds.length > 0) {
          const { data: leadsData, error: leadsError } = await supabaseAdmin
            .from("leads")
            .select("id, full_name, email, phone, city, province")
            .in("id", leadIds);
          
          if (leadsError) {
            console.error("Error fetching leads for declined payments:", leadsError);
            // Continue without lead data
          } else {
            (leadsData || []).forEach((lead: any) => {
              leadsMap[lead.id] = lead;
            });
          }
        }
      }
    }

    // Transform the data to flatten nested relationships
    const formattedPayments = (declinedPayments || []).map((payment: any) => {
      const agent = agentsMap[payment.agent_id] || null;
      const appointment = appointmentsMap[payment.appointment_id] || null;
      const lead = appointment?.lead_id ? (leadsMap[appointment.lead_id] || null) : null;

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

