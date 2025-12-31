// API to book an appointment with an agent
// Creates a lead if needed, then creates the appointment

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadPriceFromUrgency } from "@/lib/leads/pricing";
import { chargeAgentForAppointment } from "@/lib/chargeAgentForAppointment";
import { sendPaymentDeclineEmail, getLogoBase64 } from "@/lib/emails";

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

    // Validate agent exists and is approved
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status, ai_generated_bio")
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
    
    // Get price per appointment from billing settings (default to 50 cents for testing - Stripe minimum is $0.50)
    const pricePerAppointment = 0.50; // $0.50 - minimum Stripe allows, change to 29.0 for production
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

    // Charge agent's saved payment method immediately when appointment is booked
    // Note: Payment failures are handled internally - family always sees success
    console.log("🔄 Attempting to charge agent for appointment:", {
      agentId,
      appointmentId: appointment.id,
      amountCents: priceCents,
    });
    
    const chargeResult = await chargeAgentForAppointment(agentId, priceCents, appointment.id);
    
    console.log("💳 Charge result:", {
      success: chargeResult.success,
      paymentIntentId: chargeResult.paymentIntentId,
      error: chargeResult.error,
    });
    
    if (chargeResult.success && chargeResult.paymentIntentId) {
      // Payment succeeded - update appointment with payment details
      await supabaseAdmin
        .from("appointments")
        .update({ 
          price_cents: priceCents,
          stripe_payment_intent_id: chargeResult.paymentIntentId,
        })
        .eq("id", appointment.id);
      
      console.log("✅ Agent charged successfully for appointment:", {
        appointmentId: appointment.id,
        agentId,
        amountCents: priceCents,
        paymentIntentId: chargeResult.paymentIntentId,
      });
      
      // Send payment receipt email to agent
      try {
        // Get agent email and name
        let agentEmail: string | null = null;
        let agentName: string | null = null;
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(agentId);
          agentEmail = authUser?.user?.email || null;
          
          const { data: agentProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", agentId)
            .single();
          agentName = agentProfile?.full_name || null;
        } catch (emailError) {
          console.error("Error fetching agent email/name for receipt:", emailError);
        }
        
        if (agentEmail) {
          // Format appointment date and time for receipt
          const appointmentDateTime = DateTime.fromISO(startsAt, { zone: 'utc' });
          const appointmentDateStr = appointmentDateTime.toFormat('EEEE, MMMM d, yyyy');
          const appointmentTimeStr = appointmentDateTime.toFormat('h:mm a');
          
          await sendPaymentReceiptEmail({
            to: agentEmail,
            agentName: agentName,
            appointmentId: appointment.id,
            amountCents: priceCents,
            paymentIntentId: chargeResult.paymentIntentId,
            consumerName: `${firstName} ${lastName}`.trim() || null,
            appointmentDate: appointmentDateStr,
            appointmentTime: appointmentTimeStr,
          });
          console.log("✅ Payment receipt email sent to agent");
        } else {
          console.warn("⚠️ Could not send receipt email - agent email not found");
        }
      } catch (receiptError: any) {
        console.error("❌ Error sending payment receipt email (non-fatal):", receiptError);
        // Don't fail the booking if receipt email fails
      }
    } else {
      // Payment failed - mark appointment internally but don't fail the booking for the family
      console.error("❌ Failed to charge agent for appointment:", {
        appointmentId: appointment.id,
        agentId,
        error: chargeResult.error,
        amountCents: priceCents,
      });
      
      // Store payment failure info in appointment notes for internal tracking
      // The appointment remains active - family sees successful booking
      await supabaseAdmin
        .from("appointments")
        .update({ 
          price_cents: null, // No price charged
          notes: `Payment failed: ${chargeResult.error || 'Unknown error'}. Appointment created but agent payment needs to be processed.`,
        })
        .eq("id", appointment.id);
      
      // Record declined payment in declined_payments table
      try {
        await supabaseAdmin
          .from("declined_payments")
          .insert({
            agent_id: agentId,
            appointment_id: appointment.id,
            amount_cents: priceCents,
            decline_reason: chargeResult.error || "Unknown error",
            stripe_error_code: chargeResult.stripeErrorCode || null,
            stripe_error_message: chargeResult.stripeErrorMessage || chargeResult.error || null,
            status: 'pending',
          });
        console.log("✅ Recorded declined payment for appointment:", appointment.id);
      } catch (declinedPaymentError: any) {
        console.error("❌ Error recording declined payment:", declinedPaymentError);
        // Don't fail the booking if we can't record the declined payment
      }
      
      // Pause agent's account by setting paused_account flag in metadata
      try {
        const { data: agentProfile } = await supabaseAdmin
          .from("profiles")
          .select("metadata")
          .eq("id", agentId)
          .single();
        
        const metadata = agentProfile?.metadata || {};
        await supabaseAdmin
          .from("profiles")
          .update({
            metadata: {
              ...metadata,
              paused_account: true,
              paused_at: new Date().toISOString(),
            },
          })
          .eq("id", agentId);
        console.log("✅ Paused agent account:", agentId);
      } catch (pauseError: any) {
        console.error("❌ Error pausing agent account:", pauseError);
        // Don't fail the booking if we can't pause the account
      }
      
      // Send email notification to agent
      try {
        const { data: agentAuth } = await supabaseAdmin.auth.admin.getUserById(agentId);
        const agentEmail = agentAuth?.user?.email;
        
        if (agentEmail) {
          const { data: agentProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, first_name, last_name")
            .eq("id", agentId)
            .single();
          
          const agentName = agentProfile?.full_name || 
            (agentProfile?.first_name && agentProfile?.last_name 
              ? `${agentProfile.first_name} ${agentProfile.last_name}` 
              : null);
          
          await sendPaymentDeclineEmail({
            to: agentEmail,
            agentName: agentName || undefined,
            appointmentId: appointment.id,
            amountCents: priceCents,
            declineReason: chargeResult.error || undefined,
          });
          console.log("✅ Sent payment decline email to agent:", agentEmail);
        }
      } catch (emailError: any) {
        console.error("❌ Error sending payment decline email:", emailError);
        // Don't fail the booking if email fails
      }
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
          let cleanSiteUrl = (baseUrl || '').trim().replace(/\/+$/, '');
          if (!cleanSiteUrl.startsWith('http')) {
            cleanSiteUrl = `https://${cleanSiteUrl}`;
          }
          console.log('📧 [EMAIL] Logo URL:', `${cleanSiteUrl}/logo.png`);
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
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Appointment Confirmed</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                          <!-- Header -->
                          <tr>
                            <td style="background-color: #1a4d2e; padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="80" style="vertical-align: middle;">
                                  <table cellpadding="0" cellspacing="0" style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%;">
                                    <tr>
                                      <td align="center" style="vertical-align: middle;">
                                        <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="60" height="60" style="display: block; max-width: 60px; max-height: 60px; border: 0; outline: none; text-decoration: none;" />
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                                <td style="vertical-align: middle; padding-left: 24px;">
                                  <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">SORADIN</h1>
                                </td>
                              </tr>
                            </table>
                          </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 32px;">
                              <h2 style="color: #000000; font-size: 24px; margin: 0 0 24px 0; font-weight: normal;">Appointment Confirmation</h2>
                              
                              <!-- Two Column Layout for Details -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                  <td width="50%" style="padding-right: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Date</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${formattedDate}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td width="50%" style="padding-left: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Time</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${formattedTime}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td width="50%" style="padding-right: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Location</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${locationAddress}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td width="50%" style="padding-left: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">With</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${agentName}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Additional Message Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                                <tr>
                                  <td style="padding: 16px; background-color: #f3f4f6; border: 1px solid #e5e7eb;">
                                    <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
                                      Please arrive 10 minutes before your scheduled appointment time. 
                                      If you need to reschedule or cancel, please click this link: <a href="${baseUrl}/book/cancel?appointmentId=${appointment.id}" style="color: #1a4d2e; text-decoration: underline;">Cancel Or Reschedule Appointment</a>
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #000000; padding: 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #ffffff; font-size: 12px;">
                                    © ${new Date().getFullYear()} Soradin. All rights reserved.
                                  </td>
                                  <td align="right" style="color: #9ca3af; font-size: 12px;">
                                    This is an automated message, please do not reply.
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
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
          let cleanSiteUrl = (baseUrl || '').trim().replace(/\/+$/, '');
          if (!cleanSiteUrl.startsWith('http')) {
            cleanSiteUrl = `https://${cleanSiteUrl}`;
          }
          console.log('📧 [EMAIL] Logo URL:', `${cleanSiteUrl}/logo.png`);
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
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New Appointment</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                          <!-- Header -->
                          <tr>
                            <td style="background-color: #1a4d2e; padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="80" style="vertical-align: middle;">
                                    <table cellpadding="0" cellspacing="0" style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%;">
                                      <tr>
                                        <td align="center" style="vertical-align: middle;">
                                          <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="60" height="60" style="display: block; max-width: 60px; max-height: 60px; border: 0; outline: none; text-decoration: none;" />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td style="vertical-align: middle; padding-left: 24px;">
                                    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">SORADIN</h1>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 32px;">
                              <h2 style="color: #000000; font-size: 24px; margin: 0 0 24px 0; font-weight: normal;">New Appointment Scheduled</h2>
                              
                              <!-- Two Column Layout for Details -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                  <td width="50%" style="padding-right: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Date</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${formattedDate}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td width="50%" style="padding-left: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Time</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${formattedTime}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                ${locationAddress ? `
                                <tr>
                                  <td width="50%" style="padding-right: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Location</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${locationAddress}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  <td width="50%" style="padding-left: 12px; padding-bottom: 16px;"></td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td width="50%" style="padding-right: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">With</p>
                                          <p style="color: #000000; font-size: 16px; margin: 0; font-weight: normal;">${familyName}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  ${familyEmail ? `
                                  <td width="50%" style="padding-left: 12px; padding-bottom: 16px;">
                                    <table cellpadding="0" cellspacing="0" style="border-left: 4px solid #1a4d2e; padding-left: 16px;">
                                      <tr>
                                        <td style="padding-top: 8px; padding-bottom: 8px;">
                                          <p style="color: #666666; font-size: 14px; margin: 0 0 4px 0;">Contact</p>
                                          <p style="color: #1a4d2e; font-size: 16px; margin: 0; font-weight: normal;">${familyEmail}</p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                  ` : '<td width="50%" style="padding-left: 12px; padding-bottom: 16px;"></td>'}
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #000000; padding: 16px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="color: #ffffff; font-size: 12px;">
                                    © ${new Date().getFullYear()} Soradin. All rights reserved.
                                  </td>
                                  <td align="right" style="color: #9ca3af; font-size: 12px;">
                                    This is an automated message, please do not reply.
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
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
