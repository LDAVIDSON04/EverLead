// API to book an appointment with an agent
// Creates a lead if needed, then creates the appointment

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
import { chargeAgentForAppointment } from "@/lib/chargeAgentForAppointment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("Booking API called");
    const body = await req.json();
    console.log("Booking request body:", { 
      agentId: body.agentId, 
      startsAt: body.startsAt,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email 
    });
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
      rescheduleAppointmentId, // ID of appointment being rescheduled
    } = body;

    // Validate required fields (phone is optional for now)
    if (!agentId || !startsAt || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, startsAt, firstName, lastName, email" },
        { status: 400 }
      );
    }

    // Validate agent exists and is approved (both profile and bio)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status, ai_generated_bio, bio_approval_status")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Single unified approval - check only approval_status
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

    // Check for conflicts - look for existing appointments that overlap with this EXACT time slot
    const requestedDate = slotStart.toISOString().split("T")[0];
    const slotEndTime = slotEnd.getTime();
    const slotStartTime = slotStart.getTime();
    const slotStartISO = slotStart.toISOString();
    
    // Get all appointments for this agent on this date - include confirmed_at for exact matching
    const { data: conflictingAppointments, error: conflictError } = await supabaseAdmin
      .from("appointments")
      .select("id, requested_date, requested_window, created_at, confirmed_at")
      .eq("agent_id", agentId)
      .eq("requested_date", requestedDate)
      .in("status", ["pending", "confirmed", "booked"]);

    if (conflictError) {
      console.error("Error checking conflicts:", conflictError);
    }

    // Check for exact time overlaps using confirmed_at (exact booking time)
    if (conflictingAppointments && conflictingAppointments.length > 0) {
      // Check if any appointment has the exact same confirmed_at time (exact slot match)
      const hasExactConflict = conflictingAppointments.some((apt: any) => {
        if (!apt.confirmed_at) {
          // If no confirmed_at, we can't be precise, so skip it
          // (old appointments without confirmed_at won't block new bookings)
          return false;
        }
        
        const aptStartTime = new Date(apt.confirmed_at).getTime();
        const tolerance = 60 * 1000; // 1 minute tolerance
        const timeDifference = Math.abs(slotStartTime - aptStartTime);
        
        // Check if times match (within tolerance)
        if (timeDifference <= tolerance) {
          console.log("❌ CONFLICT DETECTED in booking API:", {
            slotStartISO,
            aptConfirmedAt: apt.confirmed_at,
            timeDifferenceMs: timeDifference,
            appointmentId: apt.id,
          });
          return true; // Exact conflict - this exact slot is already booked
        }
        
        // Also check for time overlap (slot overlaps with appointment time)
        // Use the actual slot duration (slotEnd - slotStart) to calculate appointment end time
        // This is more accurate than assuming a fixed length
        const slotDuration = slotEndTime - slotStartTime; // Duration of the slot being booked
        const aptEndTime = aptStartTime + slotDuration; // Assume existing appointment has same duration
        
        // Overlap occurs if: slotStart < aptEnd && slotEnd > aptStart
        const hasOverlap = slotStartTime < aptEndTime && slotEndTime > aptStartTime;
        
        if (hasOverlap) {
          console.log("❌ TIME OVERLAP DETECTED in booking API:", {
            slotStartISO,
            slotEndISO: slotEnd.toISOString(),
            aptConfirmedAt: apt.confirmed_at,
            aptEndTime: new Date(aptEndTime).toISOString(),
            appointmentId: apt.id,
          });
          return true;
        }
        
        return false;
      });
      
      if (hasExactConflict) {
        return NextResponse.json(
          { 
            error: "This time slot is no longer available",
            code: "SLOT_CONFLICT"
          },
          { status: 409 }
        );
      }
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

    // Handle rescheduling: cancel old appointment if rescheduleAppointmentId is provided
    if (rescheduleAppointmentId) {
      try {
        // Get the old appointment to get its lead_id
        const { data: oldAppointment } = await supabaseAdmin
          .from("appointments")
          .select("id, lead_id, agent_id, status")
          .eq("id", rescheduleAppointmentId)
          .single();

        if (oldAppointment && oldAppointment.status !== "cancelled") {
          // Cancel the old appointment
          await supabaseAdmin
            .from("appointments")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", rescheduleAppointmentId);

          // Delete from external calendars
          try {
            const { deleteExternalEventsForAgentAppointment } = await import("@/lib/calendarSyncAgent");
            await deleteExternalEventsForAgentAppointment(rescheduleAppointmentId);
          } catch (syncError: any) {
            console.error("Error deleting old appointment from calendars:", syncError);
          }
        }
      } catch (rescheduleError: any) {
        console.error("Error handling reschedule:", rescheduleError);
        // Continue with booking even if reschedule cancellation fails
      }
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

    // Calculate exact hour in agent's timezone for conflict detection (reuse slotStartLocal from above)
    const exactHour = slotStartLocal.hour;
    
    // Store exact hour in notes for availability API to use
    const appointmentNotes = (notes && typeof notes === 'string') ? notes.trim() : '';
    const notesWithHour = appointmentNotes 
      ? `${appointmentNotes} | booked_hour:${exactHour}`
      : `booked_hour:${exactHour}`;

    // Create the appointment (requestedDate already defined above)
    console.log("Creating appointment with data:", {
      lead_id: leadId,
      agent_id: agentId,
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: "confirmed",
      notes: notesWithHour || null,
    });
    
    // Build appointment data
    // CRITICAL: Store the exact booking time in confirmed_at - this is used to immediately block the slot
    // The availability API compares slot timestamps with confirmed_at to hide booked slots
    const confirmedAtISO = slotStart.toISOString();
    console.log("📅 CRITICAL: Storing booking time in confirmed_at:", {
      startsAtFromRequest: startsAt,
      slotStartDate: slotStart,
      slotStartISO: slotStart.toISOString(),
      slotStartLocal: slotStart.toLocaleString(),
      confirmedAtISO,
      requestedDate,
      requestedWindow,
      slotStartTime: slotStart.getTime(),
    });
    
    // Get price per appointment from billing settings (default to 1 cent for testing)
    const pricePerAppointment = 0.01; // $0.01 - change to 29.0 for production
    const priceCents = Math.round(pricePerAppointment * 100);

    const appointmentData: any = {
      lead_id: leadId,
      agent_id: agentId,
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: "confirmed", // Mark as confirmed immediately after booking
      price_cents: priceCents, // Set price when booking
      confirmed_at: confirmedAtISO, // Store exact booking time - MUST match slot startsAt for conflict detection
    };
    
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError || !appointment) {
      console.error("❌ ERROR creating appointment:", {
        error: appointmentError,
        appointmentData,
        confirmedAtISO,
      });
      console.error("Appointment data attempted:", {
        lead_id: leadId,
        agent_id: agentId,
        requested_date: requestedDate,
        requested_window: requestedWindow,
        status: "confirmed",
        notes: notesWithHour || null,
      });
      // Log full error details for debugging
      if (appointmentError) {
        console.error("Full appointment error object:", JSON.stringify({
          message: appointmentError.message,
          code: appointmentError.code,
          hint: appointmentError.hint,
          details: appointmentError.details,
        }, null, 2));
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
    
    console.log("Appointment created successfully:", appointment.id);

    // Charge agent's saved payment method for the appointment
    const chargeResult = await chargeAgentForAppointment(agentId, priceCents, appointment.id);
    
    if (!chargeResult.success) {
      console.error("Failed to charge agent for appointment:", chargeResult.error);
      
      // Update appointment to indicate payment failed (but keep appointment - can retry payment later)
      await supabaseAdmin
        .from("appointments")
        .update({ 
          price_cents: null, // Clear price to indicate payment failed
          notes: `Payment failed: ${chargeResult.error}`,
        })
        .eq("id", appointment.id);
      
      // Return error but don't fail the appointment creation
      // The appointment exists but payment needs to be retried
      return NextResponse.json(
        { 
          error: "Appointment created but payment failed. Please update your payment method in settings.",
          appointment: appointment,
          paymentError: chargeResult.error,
        },
        { status: 500 }
      );
    }

    // Update appointment with payment intent ID if successful
    if (chargeResult.paymentIntentId) {
      await supabaseAdmin
        .from("appointments")
        .update({ 
          price_cents: priceCents,
          notes: `Payment successful: ${chargeResult.paymentIntentId}`,
        })
        .eq("id", appointment.id);
      
      console.log("✅ Agent charged successfully for appointment:", {
        appointmentId: appointment.id,
        agentId,
        amountCents: priceCents,
        paymentIntentId: chargeResult.paymentIntentId,
      });
    }

    // Send confirmation emails to both agent and family
    try {
      // Get agent email
      const { data: agentAuth } = await supabaseAdmin.auth.admin.getUserById(agentId);
      const agentEmail = agentAuth?.user?.email;
      
      // Get family email and address from lead
      const { data: leadData } = await supabaseAdmin
        .from("leads")
        .select("email, first_name, last_name, full_name, address_line1, city, province, postal_code")
        .eq("id", leadId)
        .single();
      
      const familyEmail = leadData?.email;
      const familyName = leadData?.full_name || 
        (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}` : "Family");
      
      // Build location address from lead data
      const locationParts = [];
      if (leadData?.address_line1) locationParts.push(leadData.address_line1);
      if (leadData?.city) locationParts.push(leadData.city);
      if (leadData?.province) locationParts.push(leadData.province);
      if (leadData?.postal_code) locationParts.push(leadData.postal_code);
      const locationAddress = locationParts.length > 0 ? locationParts.join(", ") : "Location to be confirmed";
      
      // Get agent name, address, and timezone
      const { data: agentProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, first_name, last_name, agent_city, agent_province, metadata")
        .eq("id", agentId)
        .single();
      
      const agentName = agentProfile?.full_name || 
        (agentProfile?.first_name && agentProfile?.last_name ? `${agentProfile.first_name} ${agentProfile.last_name}` : "Agent");
      
      // Build agent location address
      const agentLocationParts = [];
      if (agentProfile?.agent_city) agentLocationParts.push(agentProfile.agent_city);
      if (agentProfile?.agent_province) agentLocationParts.push(agentProfile.agent_province);
      const agentLocationAddress = agentLocationParts.length > 0 ? agentLocationParts.join(", ") : "Location to be confirmed";
      
      // Get agent's timezone from profile or infer from province
      let agentTimezone = "America/Vancouver"; // Default fallback
      if (agentProfile?.metadata?.timezone) {
        agentTimezone = agentProfile.metadata.timezone;
      } else if (agentProfile?.metadata?.availability?.timezone) {
        agentTimezone = agentProfile.metadata.availability.timezone;
      } else if (agentProfile?.agent_province) {
        // Infer from province
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
      
      // Format appointment date/time using confirmed_at in agent's timezone
      // Import DateTime from luxon for timezone conversion
      const { DateTime } = await import('luxon');
      
      let confirmedAtUTC;
      if (appointment.confirmed_at) {
        confirmedAtUTC = DateTime.fromISO(appointment.confirmed_at, { zone: "utc" });
      } else {
        // Fallback: use requested date at start of day in agent's timezone
        confirmedAtUTC = DateTime.fromISO(`${requestedDate}T00:00:00`, { zone: agentTimezone }).toUTC();
      }
      
      // Convert to agent's local timezone
      const confirmedAtLocal = confirmedAtUTC.setZone(agentTimezone);
      
      // Format date with day of week in agent's timezone
      const formattedDate = confirmedAtLocal.toLocaleString({ 
        weekday: "long", 
        year: "numeric",
        month: "long", 
        day: "numeric" 
      });
      
      // Format exact time in agent's timezone (e.g., "10:00 AM")
      const formattedTime = confirmedAtLocal.toLocaleString({
        hour: "numeric",
        minute: "2-digit",
        hour12: true
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
                  <div style="background-color: #f7f4ef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Time:</strong> ${formattedTime}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Agent:</strong> ${agentName}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Location:</strong> ${locationAddress}</p>
                  </div>
                  <p>We look forward to meeting with you.</p>
                  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
                  <p style="margin: 20px 0 0;">
                    <a href="${baseUrl}/book/cancel?appointmentId=${appointment.id}" style="color: #dc2626; text-decoration: underline; font-size: 14px;">
                      Cancel this appointment
                    </a>
                  </p>
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
                  <div style="background-color: #f7f4ef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Date:</strong> ${formattedDate}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Time:</strong> ${formattedTime}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Client:</strong> ${familyName}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Email:</strong> ${familyEmail || 'N/A'}</p>
                    <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Location:</strong> ${locationAddress}</p>
                  </div>
                  <p><a href="${baseUrl}/agent/my-appointments" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">View My Appointments</a></p>
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
    
    // Sync to Google Calendar and/or Microsoft Calendar if connected
    try {
      console.log("🔄 Attempting to sync appointment to calendars...");
      const { syncAgentAppointmentToGoogleCalendar, syncAgentAppointmentToMicrosoftCalendar } = await import('@/lib/calendarSyncAgent');
      
      // Sync to Google Calendar if connected
      await syncAgentAppointmentToGoogleCalendar(appointment.id).catch(err => {
        console.error("❌ Error syncing to Google Calendar (non-fatal):", err);
        // Don't fail the booking if calendar sync fails
      });
      
      // Sync to Microsoft Calendar if connected
      await syncAgentAppointmentToMicrosoftCalendar(appointment.id).catch(err => {
        console.error("❌ Error syncing to Microsoft Calendar (non-fatal):", err);
        // Don't fail the booking if calendar sync fails
      });
      
      console.log("✅ Calendar sync attempts completed");
    } catch (calendarError) {
      console.error("❌ Error importing calendar sync (non-fatal):", calendarError);
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
    console.error("Error in POST /api/agents/book:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
      },
      { status: 500 }
    );
  }
}
