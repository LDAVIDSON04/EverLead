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

    // Get agent's timezone to convert slot time correctly
    const { data: agentProfile } = await supabaseAdmin
      .from("profiles")
      .select("metadata, agent_province")
      .eq("id", agentId)
      .maybeSingle();
    
    let agentTimezone = "America/Vancouver"; // Default
    if (agentProfile?.metadata?.timezone) {
      agentTimezone = agentProfile.metadata.timezone;
    } else if (agentProfile?.metadata?.availability?.timezone) {
      agentTimezone = agentProfile.metadata.availability.timezone;
    } else if (agentProfile?.agent_province) {
      const province = agentProfile.agent_province.toUpperCase();
      if (province === "BC" || province === "BRITISH COLUMBIA") {
        agentTimezone = "America/Vancouver";
      } else if (province === "AB" || province === "ALBERTA") {
        agentTimezone = "America/Edmonton";
      } else if (province === "SK" || province === "SASKATCHEWAN") {
        agentTimezone = "America/Regina";
      } else if (province === "MB" || province === "MANITOBA") {
        agentTimezone = "America/Winnipeg";
      } else if (province === "ON" || province === "ONTARIO") {
        agentTimezone = "America/Toronto";
      } else if (province === "QC" || province === "QUEBEC") {
        agentTimezone = "America/Montreal";
      }
    }

    // Convert slot time to agent's local timezone to determine window
    const { DateTime } = await import("luxon");
    const slotStartUTC = DateTime.fromISO(slotStart.toISOString(), { zone: "utc" });
    const slotStartLocal = slotStartUTC.setZone(agentTimezone);
    const hour = slotStartLocal.hour;
    
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
      // Update the lead's city if the booking is for a different location
      // This ensures the location shown matches where the appointment was booked
      if (city && city.trim()) {
        const { error: updateError } = await supabaseAdmin
          .from("leads")
          .update({ 
            city: city.trim(),
            province: province?.trim() || existingLead.province || null
          })
          .eq("id", leadId);
        
        if (updateError) {
          console.warn("Failed to update lead city for booking:", updateError);
          // Don't fail the booking if city update fails
        }
      }
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
        status: "confirmed", // Mark as confirmed immediately after booking
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

    // Send confirmation emails to both agent and family
    try {
      // Get agent email
      const { data: agentAuth } = await supabaseAdmin.auth.admin.getUserById(agentId);
      const agentEmail = agentAuth?.user?.email;
      
      // Get family email from lead
      const { data: leadData } = await supabaseAdmin
        .from("leads")
        .select("email, first_name, last_name, full_name")
        .eq("id", leadId)
        .single();
      
      const familyEmail = leadData?.email;
      const familyName = leadData?.full_name || 
        (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}` : "Family");
      
      // Get agent name
      const { data: agentProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, first_name, last_name")
        .eq("id", agentId)
        .single();
      
      const agentName = agentProfile?.full_name || 
        (agentProfile?.first_name && agentProfile?.last_name ? `${agentProfile.first_name} ${agentProfile.last_name}` : "Agent");
      
      // Format appointment date/time
      const aptDate = new Date(requestedDate + "T00:00:00");
      const windowLabel = requestedWindow === "morning" ? "Morning" : requestedWindow === "afternoon" ? "Afternoon" : "Evening";
      const formattedDate = aptDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
      
      // Send email to family
      if (familyEmail && resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: resendFromEmail.includes('<') ? resendFromEmail : `Soradin <${resendFromEmail}>`,
              to: [familyEmail],
              subject: `Appointment Confirmed with ${agentName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2a2a2a;">Appointment Confirmed</h2>
                  <p>Hi ${familyName},</p>
                  <p>Your appointment with <strong>${agentName}</strong> has been confirmed.</p>
                  <div style="background-color: #f7f4ef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${windowLabel}</p>
                    <p style="margin: 5px 0;"><strong>Agent:</strong> ${agentName}</p>
                  </div>
                  <p>We look forward to meeting with you.</p>
                </div>
              `,
            }),
          }).catch(err => console.error("Error sending family email:", err));
        } catch (err) {
          console.error("Error sending family email:", err);
        }
      }
      
      // Send email to agent
      if (agentEmail && resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: resendFromEmail.includes('<') ? resendFromEmail : `Soradin <${resendFromEmail}>`,
              to: [agentEmail],
              subject: `New Appointment: ${familyName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2a2a2a;">New Appointment Booked</h2>
                  <p>Hi ${agentName},</p>
                  <p>You have a new appointment with <strong>${familyName}</strong>.</p>
                  <div style="background-color: #f7f4ef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${windowLabel}</p>
                    <p style="margin: 5px 0;"><strong>Client:</strong> ${familyName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${familyEmail || 'N/A'}</p>
                  </div>
                  <p><a href="${baseUrl}/agent/dashboard" style="background-color: #00A86B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Dashboard</a></p>
                </div>
              `,
            }),
          }).catch(err => console.error("Error sending agent email:", err));
        } catch (err) {
          console.error("Error sending agent email:", err);
        }
      }
    } catch (emailError) {
      console.error("Error sending confirmation emails (non-fatal):", emailError);
      // Don't fail the booking if emails fail
    }
    
    // Sync to Google Calendar if connected
    try {
      const { syncAgentAppointmentToGoogleCalendar } = await import('@/lib/calendarSyncAgent');
      await syncAgentAppointmentToGoogleCalendar(appointment.id).catch(err => {
        console.error("Error syncing to Google Calendar (non-fatal):", err);
        // Don't fail the booking if calendar sync fails
      });
    } catch (calendarError) {
      console.error("Error importing calendar sync (non-fatal):", calendarError);
      // Don't fail the booking if calendar sync fails
    }

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
