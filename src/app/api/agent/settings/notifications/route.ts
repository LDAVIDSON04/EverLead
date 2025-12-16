import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const metadata = profile?.metadata || {};
    const defaultNotifications = {
      newAppointment: { email: true, sms: false },
      appointmentCancelled: { email: true, sms: true },
      paymentReceived: { email: true, sms: false },
      calendarSyncError: { email: true, sms: false },
      appointmentReminder: { email: true, sms: true },
    };

    return NextResponse.json({
      notifications: metadata.notification_preferences || defaultNotifications,
    });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notifications } = body;

    // Get existing metadata
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    const existingMetadata = existingProfile?.metadata || {};

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        metadata: {
          ...existingMetadata,
          notification_preferences: notifications,
        },
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving notifications:", error);
      return NextResponse.json({ error: "Failed to save notifications" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
