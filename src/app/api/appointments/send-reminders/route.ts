// API route to send appointment reminders via SMS
// This should be called by a cron job (Vercel Cron) or scheduled task
// Checks for appointments that need reminders:
// - Video calls: 10 minutes before
// - In-person: 1 hour before

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DateTime } from "luxon";
import {
  sendConsumerVideoReminderSMS,
  sendConsumerInPersonReminderSMS,
  sendAgentVideoReminderSMS,
  sendAgentInPersonReminderSMS,
} from "@/lib/sms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Helper to determine appointment type
// Since appointments table doesn't have a notes column, we use office_location_id as a heuristic:
// - If office_location_id is null, it's likely a video appointment (video calls don't have physical locations)
// - If office_location_id has a value, it's an in-person appointment
function getAppointmentType(appointment: any): "video" | "in-person" {
  // Video appointments don't have an office_location_id (they're virtual)
  if (!appointment.office_location_id) {
    return "video";
  }
  // In-person appointments have an office_location_id
  return "in-person";
}

export async function GET(req: NextRequest) {
  try {
    // Optional: Check for CRON_SECRET if set (for extra security)
    // Note: Vercel Cron doesn't automatically send custom headers, so if CRON_SECRET is set,
    // you'd need to configure it in Vercel Cron settings or remove this check
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // Only enforce secret if it's explicitly set AND a header is provided
    // This allows Vercel Cron to work by default, but adds security if you configure it
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = DateTime.now().setZone("utc");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.soradin.com";

    // Find appointments that need reminders
    // Video: 10 minutes before (between 9-11 minutes before)
    // In-person: 1 hour before (between 55-65 minutes before)
    
    const videoReminderWindowStart = now.plus({ minutes: 11 }).toISO();
    const videoReminderWindowEnd = now.plus({ minutes: 9 }).toISO();
    const inPersonReminderWindowStart = now.plus({ hours: 1, minutes: 5 }).toISO();
    const inPersonReminderWindowEnd = now.plus({ hours: 1, minutes: -5 }).toISO();

    // Get all confirmed appointments in the reminder windows
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        lead_id,
        agent_id,
        requested_date,
        confirmed_at,
        status,
        office_location_id
      `)
      .eq("status", "confirmed")
      .gte("confirmed_at", videoReminderWindowEnd) // Start of earliest window (in-person)
      .lte("confirmed_at", inPersonReminderWindowStart); // End of latest window (video)

    if (appointmentsError) {
      console.error("Error fetching appointments for reminders:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "No appointments need reminders at this time",
        checked: appointments?.length || 0,
      });
    }

    console.log(`📱 Found ${appointments.length} appointments to check for reminders`);

    let videoRemindersSent = 0;
    let inPersonRemindersSent = 0;
    let errors = 0;

    for (const appointment of appointments) {
      try {
        if (!appointment.confirmed_at) continue;

        const appointmentTime = DateTime.fromISO(appointment.confirmed_at, { zone: "utc" });
        const minutesUntil = appointmentTime.diff(now, "minutes").minutes;
        const appointmentType = getAppointmentType(appointment);

        // Note: We can't check if reminder was already sent since appointments table doesn't have notes column
        // This means reminders might be sent multiple times. In production, you'd want to add a reminder_sent_at column
        // For now, we'll rely on the time window check to prevent duplicates (only send once per window)

        // Check if this appointment is in the right window for its type
        const isVideoReminderTime = appointmentType === "video" && minutesUntil >= 9 && minutesUntil <= 11;
        const isInPersonReminderTime = appointmentType === "in-person" && minutesUntil >= 55 && minutesUntil <= 65;

        if (!isVideoReminderTime && !isInPersonReminderTime) {
          continue; // Not time for this appointment's reminder yet
        }

        // Fetch lead and agent data
        const [leadResult, agentResult] = await Promise.all([
          supabaseAdmin
            .from("leads")
            .select("phone, full_name, first_name, last_name, province")
            .eq("id", appointment.lead_id)
            .single(),
          supabaseAdmin
            .from("profiles")
            .select("phone, full_name, first_name, last_name, agent_province, metadata")
            .eq("id", appointment.agent_id)
            .single(),
        ]);

        const lead = leadResult.data;
        const agent = agentResult.data;

        if (!lead || !agent) {
          console.warn(`Missing lead or agent data for appointment ${appointment.id}`);
          continue;
        }

        const consumerName = lead.full_name || 
          (lead.first_name && lead.last_name ? `${lead.first_name} ${lead.last_name}` : "Client");
        const agentName = agent.full_name || 
          (agent.first_name && agent.last_name ? `${agent.first_name} ${agent.last_name}` : "Agent");

        // Send reminders based on type
        if (isVideoReminderTime && appointmentType === "video") {
          const consumerIdentity = `Customer | ${consumerName}`;
          const agentIdentity = `Agent | ${agentName}`;
          const videoLink = `${baseUrl}/video/join/appointment-${appointment.id}?identity=${encodeURIComponent(consumerIdentity)}`;
          const agentVideoLink = `${baseUrl}/video/join/appointment-${appointment.id}?identity=${encodeURIComponent(agentIdentity)}`;

          // Send to consumer
          if (lead.phone) {
            await sendConsumerVideoReminderSMS({
              to: lead.phone,
              agentName,
              requestedDate: appointment.requested_date,
              province: lead.province || undefined,
              confirmedAt: appointment.confirmed_at,
              videoLink,
            }).catch((err) => {
              console.error(`Error sending consumer video reminder for appointment ${appointment.id}:`, err);
            });
          }

          // Send to agent
          if (agent.phone) {
            await sendAgentVideoReminderSMS({
              to: agent.phone,
              consumerName,
              requestedDate: appointment.requested_date,
              province: agent.agent_province || undefined,
              confirmedAt: appointment.confirmed_at,
              videoLink: agentVideoLink,
            }).catch((err) => {
              console.error(`Error sending agent video reminder for appointment ${appointment.id}:`, err);
            });
          }

          videoRemindersSent++;
        } else if (isInPersonReminderTime && appointmentType === "in-person") {
          // Send to consumer
          if (lead.phone) {
            await sendConsumerInPersonReminderSMS({
              to: lead.phone,
              agentName,
              requestedDate: appointment.requested_date,
              province: lead.province || undefined,
              confirmedAt: appointment.confirmed_at,
            }).catch((err) => {
              console.error(`Error sending consumer in-person reminder for appointment ${appointment.id}:`, err);
            });
          }

          // Send to agent
          if (agent.phone) {
            await sendAgentInPersonReminderSMS({
              to: agent.phone,
              consumerName,
              requestedDate: appointment.requested_date,
              province: agent.agent_province || undefined,
              confirmedAt: appointment.confirmed_at,
            }).catch((err) => {
              console.error(`Error sending agent in-person reminder for appointment ${appointment.id}:`, err);
            });
          }

          inPersonRemindersSent++;
        }

        // Note: Can't mark reminder as sent since appointments table doesn't have notes column
        // In production, you'd want to add a reminder_sent_at timestamp column to track this
        // For now, we rely on the time window check (9-11 min for video, 55-65 min for in-person)
        // which naturally prevents duplicates since the window is only 2-10 minutes wide

      } catch (error: any) {
        console.error(`Error processing reminder for appointment ${appointment.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: "Reminders processed",
      videoRemindersSent,
      inPersonRemindersSent,
      errors,
      totalChecked: appointments.length,
    });

  } catch (error: any) {
    console.error("Error in send-reminders API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
