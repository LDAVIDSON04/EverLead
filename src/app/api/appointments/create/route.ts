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

  // Fire-and-forget consumer email (don't block response)
  if (lead.email) {
    const displayName = lead.full_name || 
      (lead.first_name || lead.last_name 
        ? [lead.first_name, lead.last_name].filter(Boolean).join(' ')
        : null);

    sendConsumerBookingEmail({
      to: lead.email,
      name: displayName,
      requestedDate,
      requestedWindow,
    }).catch((err) => {
      console.error('Error sending consumer booking email (non-fatal):', err);
    });
  }

  return NextResponse.json({ appointment: appt }, { status: 200 });
}

