import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendConsumerBookingEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Database configuration error" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { leadId, requestedDate, requestedWindow } = body;

  if (!leadId || !requestedDate || !requestedWindow) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate window slot
  if (!['morning', 'afternoon', 'evening'].includes(requestedWindow)) {
    return NextResponse.json(
      { error: "Invalid time window" },
      { status: 400 }
    );
  }

  // Verify lead exists and get email/name for notification
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, email, full_name, first_name, last_name')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 }
    );
  }

  // Delete any existing pending appointments for this lead
  await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('lead_id', leadId)
    .eq('status', 'pending');

  // Create new appointment
  const { data: appt, error: apptError } = await supabaseAdmin
    .from('appointments')
    .insert({
      lead_id: leadId,
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: 'pending',
    })
    .select()
    .single();

  if (apptError || !appt) {
    console.error('Error creating appointment:', apptError);
    return NextResponse.json(
      { error: "Error creating appointment" },
      { status: 500 }
    );
  }

  // Send consumer email (fire-and-forget, but log errors)
  if (lead.email) {
    const displayName = lead.full_name || 
      (lead.first_name || lead.last_name 
        ? [lead.first_name, lead.last_name].filter(Boolean).join(' ')
        : null);

    console.log('📧 Attempting to send booking confirmation email:', {
      to: lead.email,
      name: displayName,
      requestedDate,
      requestedWindow,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
    });

    // Send email (non-blocking, but log any errors)
    sendConsumerBookingEmail({
      to: lead.email,
      name: displayName,
      requestedDate,
      requestedWindow,
    }).then(() => {
      console.log('✅ Booking confirmation email sent successfully to:', lead.email);
    }).catch((err) => {
      console.error('❌ Error sending consumer booking email (non-fatal):', {
        error: err,
        message: err?.message,
        to: lead.email,
        hasResendKey: !!process.env.RESEND_API_KEY,
      });
    });
  } else {
    console.warn('⚠️ No email address found for lead, skipping booking confirmation email:', {
      leadId: lead.id,
      hasEmail: !!lead.email,
      emailField: lead.email,
    });
  }

  return NextResponse.json({ appointment: appt }, { status: 200 });
}

