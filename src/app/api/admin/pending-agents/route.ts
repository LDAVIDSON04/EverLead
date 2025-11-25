// src/app/api/admin/pending-agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get profiles (without email - email is in auth.users)
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, funeral_home, licensed_in_province, licensed_funeral_director, approval_status, created_at, notification_cities")
      .eq("role", "agent")
      .in("approval_status", ["pending", "declined"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading pending agents:", error);
      return NextResponse.json(
        { error: "Failed to load pending agents", details: error.message },
        { status: 500 }
      );
    }

    // Get emails from auth.users for each profile
    const agentsWithEmails = await Promise.all(
      (profiles || []).map(async (profile: any) => {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            email: authUser?.user?.email || null,
          };
        } catch (err) {
          console.error(`Error getting email for profile ${profile.id}:`, err);
          return {
            ...profile,
            email: null,
          };
        }
      })
    );

    return NextResponse.json(
      { agents: agentsWithEmails },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in pending-agents route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

