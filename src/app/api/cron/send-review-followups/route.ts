// Cron job to send review follow-up emails 24 hours after appointments
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendReviewFollowUpEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Verify this is a cron request (you can add authentication here)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get appointments that were completed 24 hours ago (confirmed_at is 24 hours in the past)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Fetch appointments that:
    // 1. Have confirmed_at between 24-25 hours ago (1 hour window)
    // 2. Are confirmed or booked (not cancelled)
    // 3. Don't already have a review
    // Note: confirmed_at is set when appointment is booked and represents the appointment start time
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        agent_id,
        lead_id,
        confirmed_at,
        status,
        leads (
          email,
          first_name,
          last_name,
          full_name
        ),
        profiles:agent_id (
          full_name
        )
      `)
      .in("status", ["confirmed", "booked"])
      .gte("confirmed_at", twentyFiveHoursAgo.toISOString())
      .lte("confirmed_at", twentyFourHoursAgo.toISOString())
      .not("confirmed_at", "is", null);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "No appointments found for review follow-up",
        count: 0,
      });
    }

    // Check which appointments already have reviews
    const appointmentIds = appointments.map((apt: any) => apt.id);
    const { data: existingReviews } = await supabaseAdmin
      .from("reviews")
      .select("appointment_id")
      .in("appointment_id", appointmentIds);

    const reviewedAppointmentIds = new Set(
      (existingReviews || []).map((r: any) => r.appointment_id)
    );

    // Filter out appointments that already have reviews
    const appointmentsToEmail = appointments.filter(
      (apt: any) => !reviewedAppointmentIds.has(apt.id)
    );

    if (appointmentsToEmail.length === 0) {
      return NextResponse.json({
        message: "All appointments already have reviews",
        count: 0,
      });
    }

    // Send review follow-up emails
    const emailPromises = appointmentsToEmail.map(async (appointment: any) => {
      try {
        const lead = Array.isArray(appointment.leads) ? appointment.leads[0] : appointment.leads;
        const agent = Array.isArray(appointment.profiles) ? appointment.profiles[0] : appointment.profiles;
        
        if (!lead?.email) {
          console.warn(`No email found for appointment ${appointment.id}`);
          return { success: false, appointmentId: appointment.id, reason: "No email" };
        }

        const familyName = lead.full_name || 
          (lead.first_name && lead.last_name
            ? `${lead.first_name} ${lead.last_name}`
            : null);
        const agentName = agent?.full_name || null;

        // Use appointment ID as token (in production, use a proper token system)
        const token = appointment.id;

        await sendReviewFollowUpEmail({
          to: lead.email,
          familyName,
          agentName,
          appointmentId: appointment.id,
          token,
        });

        return { success: true, appointmentId: appointment.id };
      } catch (error: any) {
        console.error(`Error sending review email for appointment ${appointment.id}:`, error);
        return { success: false, appointmentId: appointment.id, error: error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: "Review follow-up emails processed",
      total: appointmentsToEmail.length,
      successful,
      failed,
      results: results.map((r) => 
        r.status === "fulfilled" ? r.value : { success: false, error: r.reason }
      ),
    });
  } catch (error: any) {
    console.error("Error in review follow-up cron job:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

