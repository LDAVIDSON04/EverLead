// API to book an appointment with an agent
// Creates a lead if needed, then creates the appointment

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      startsAt, // ISO timestamp in UTC
      firstName,
      lastName,
      email,
      phone,
      city,
      province,
      serviceType,
      notes,
    } = body;

    // Validate required fields (phone is optional for now)
    if (!agentId || !startsAt || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, startsAt, firstName, lastName, email" },
        { status: 400 }
      );
    }

    // Validate agent exists and is approved
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.approval_status !== "approved") {
      return NextResponse.json(
        { error: "Agent is not approved for bookings" },
        { status: 403 }
      );
    }

    // Parse the time slot
    const slotStart = new Date(startsAt);
    const slotEnd = new Date(body.endsAt || new Date(slotStart.getTime() + 30 * 60 * 1000)); // Default 30 min

    if (isNaN(slotStart.getTime())) {
      return NextResponse.json(
        { error: "Invalid startsAt timestamp" },
        { status: 400 }
      );
    }

    // Check for conflicts - look for existing appointments that overlap with this time slot
    const requestedDate = slotStart.toISOString().split("T")[0];
    const slotEndTime = slotEnd.getTime();
    const slotStartTime = slotStart.getTime();
    
    // Get all appointments for this agent on this date
    const { data: conflictingAppointments, error: conflictError } = await supabaseAdmin
      .from("appointments")
      .select("id, requested_date, requested_window, created_at")
      .eq("agent_id", agentId)
      .eq("requested_date", requestedDate)
      .in("status", ["pending", "confirmed", "booked"]);

    if (conflictError) {
      console.error("Error checking conflicts:", conflictError);
    }

    // Check for time overlaps
    // Since we don't have exact start/end times in appointments table, we'll be conservative
    // If there's any appointment on this date, we'll block the booking
    // This ensures no double-booking
    if (conflictingAppointments && conflictingAppointments.length > 0) {
      // For now, if there's any appointment on this date, block it
      // In the future, we could store exact start/end times in appointments table
      // and check for actual time overlaps
      return NextResponse.json(
        { 
          error: "This time slot is no longer available",
          code: "SLOT_CONFLICT"
        },
        { status: 409 }
      );
    }

    // Convert time to window (morning, afternoon, evening) for storage
    const hour = slotStart.getUTCHours();
    let requestedWindow: "morning" | "afternoon" | "evening";
    if (hour < 12) {
      requestedWindow = "morning";
    } else if (hour < 17) {
      requestedWindow = "afternoon";
    } else {
      requestedWindow = "evening";
    }

    // Create or find a lead for this booking
    // First, try to find an existing lead by email
    let leadId: string;
    const { data: existingLead } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Create a new lead
      // Provide all fields that might be required, with sensible defaults
      const urgencyLevel = "warm";
      const leadPrice = getLeadPriceFromUrgency(urgencyLevel);
      
      const leadData: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        phone: phone?.trim() || "",
        city: city?.trim() || "",
        province: province?.trim() || "",
        service_type: serviceType?.trim() || "Pre-need Planning",
        status: "new",
        urgency_level: urgencyLevel,
        lead_price: leadPrice, // Required field - calculate from urgency
        buy_now_price_cents: leadPrice * 100, // For backward compatibility
        // Provide default empty strings for fields that might be required
        timeline_intent: "not_specified",
        planning_for: "self",
        remains_disposition: null,
        service_celebration: null,
        family_pre_arranged: null,
        // Ensure lead is unsold
        assigned_agent_id: null,
        auction_enabled: false,
      };

      const { data: newLead, error: leadError } = await supabaseAdmin
        .from("leads")
        .insert(leadData)
        .select("id")
        .single();

      if (leadError || !newLead) {
        console.error("Error creating lead:", leadError);
        console.error("Lead data attempted:", JSON.stringify(leadData, null, 2));
        // Log full error details for debugging
        if (leadError) {
          console.error("Full error object:", {
            message: leadError.message,
            code: leadError.code,
            hint: leadError.hint,
            details: leadError.details,
          });
        }
        return NextResponse.json(
          { 
            error: "Failed to create booking record",
            details: leadError?.message || "Unknown error",
            code: leadError?.code || "UNKNOWN",
            hint: leadError?.hint || null,
            // Include full error in development
            ...(process.env.NODE_ENV === 'development' ? { fullError: leadError } : {})
          },
          { status: 500 }
        );
      }

      leadId = newLead.id;
    }

    // Create the appointment (requestedDate already defined above)
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert({
        lead_id: leadId,
        agent_id: agentId,
        requested_date: requestedDate,
        requested_window: requestedWindow,
        status: "pending",
        price_cents: null, // Can be set later
      })
      .select()
      .single();

    if (appointmentError || !appointment) {
      console.error("Error creating appointment:", appointmentError);
      console.error("Appointment data attempted:", {
        lead_id: leadId,
        agent_id: agentId,
        requested_date: requestedDate,
        requested_window: requestedWindow,
        status: "pending",
        notes: notes?.trim() || null,
      });
      // Log full error details for debugging
      if (appointmentError) {
        console.error("Full appointment error object:", {
          message: appointmentError.message,
          code: appointmentError.code,
          hint: appointmentError.hint,
          details: appointmentError.details,
        });
      }
      return NextResponse.json(
        { 
          error: "Failed to create appointment",
          details: appointmentError?.message || "Unknown error",
          code: appointmentError?.code || "UNKNOWN",
          hint: appointmentError?.hint || null,
        },
        { status: 500 }
      );
    }

    // TODO: Send confirmation emails to both agent and family

    return NextResponse.json(
      {
        appointment,
        message: "Appointment booked successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in /api/agents/book:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
