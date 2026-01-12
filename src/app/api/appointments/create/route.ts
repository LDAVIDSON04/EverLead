import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendConsumerBookingEmail } from "@/lib/emails";
import { sendConsumerBookingSMS } from "@/lib/sms";

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

  // Verify lead exists and get email/name/phone for notification
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, email, phone, full_name, first_name, last_name, province')
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

  // Create new appointment (set price_cents to 1 for 1 cent testing)
  const { data: appt, error: apptError } = await supabaseAdmin
    .from('appointments')
    .insert({
      lead_id: leadId,
      requested_date: requestedDate,
      requested_window: requestedWindow,
      status: 'pending',
      price_cents: 1, // $0.01 (1 cent for testing)
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

    // Send email (wait with timeout to prevent Vercel from killing execution context)
    // Use Promise.race to ensure we don't wait more than 5 seconds for email
    const emailPromise = sendConsumerBookingEmail({
      to: lead.email,
      name: displayName,
      requestedDate,
      requestedWindow,
      appointmentId: appt.id, // Include appointment ID for cancel link
    });
    
    const emailTimeout = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('⏱️ Email send timeout (5s) - returning response, email may still be sending in background');
        resolve();
      }, 5000); // Wait max 5 seconds for email
    });
    
    // Wait for email or timeout, whichever comes first (AWAIT this!)
    try {
      await Promise.race([emailPromise, emailTimeout]);
    } catch (err: any) {
      console.error('❌ Failed to send consumer booking email (non-fatal - appointment still created):', {
        error: err?.message || err,
        cause: err?.cause,
        code: err?.code,
        to: lead.email,
        hasResendKey: !!process.env.RESEND_API_KEY,
        suggestion: err?.code === 'ECONNRESET' 
          ? 'Network connection issue - check firewall/proxy settings or Resend API status'
          : 'Check Resend API key and domain verification',
      });
      // Don't throw - email failure shouldn't break appointment creation
    }
  } else {
    console.warn('⚠️ No email address found for lead, skipping booking confirmation email:', {
      leadId: lead.id,
      hasEmail: !!lead.email,
      emailField: lead.email,
    });
  }

  // Send consumer SMS (fire-and-forget, but log errors)
  if (lead.phone) {
    console.log('📱 Attempting to send booking confirmation SMS:', {
      to: lead.phone,
      requestedDate,
      requestedWindow,
      province: lead.province || 'not set',
      hasTwilioCredentials: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || 'not set',
    });

    const smsPromise = sendConsumerBookingSMS({
      to: lead.phone,
      requestedDate,
      requestedWindow,
      province: lead.province || undefined,
      // Agent name not available at appointment creation time
    });
    
    const smsTimeout = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('⏱️ SMS send timeout (5s) - returning response, SMS may still be sending in background');
        resolve();
      }, 5000);
    });
    
    try {
      await Promise.race([smsPromise, smsTimeout]);
    } catch (err: any) {
      console.error('❌ Failed to send consumer booking SMS (non-fatal - appointment still created):', {
        error: err?.message || err,
        to: lead.phone,
        stack: err?.stack,
      });
      // Don't throw - SMS failure shouldn't break appointment creation
    }
  } else {
    console.warn('⚠️ No phone number found for lead, skipping booking confirmation SMS:', {
      leadId: lead.id,
      hasPhone: !!lead.phone,
      phoneField: lead.phone,
    });
  }

  return NextResponse.json({ appointment: appt }, { status: 200 });
}

