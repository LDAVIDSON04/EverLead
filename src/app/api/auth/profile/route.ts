import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS and fetch profile
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // First, check if ANY profile exists for this user ID
    const { data: allProfiles, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, approval_status, full_name, email")
      .eq("id", user.id);

    if (checkError) {
      console.error("Error checking profiles:", checkError);
      return NextResponse.json(
        { error: "Database error", details: checkError.message, userId: user.id },
        { status: 500 }
      );
    }

    console.log(`[PROFILE API] User ${user.id} (${user.email}): Found ${allProfiles?.length || 0} profile(s)`);

    if (!allProfiles || allProfiles.length === 0) {
      // No profile exists - do not auto-create. Agents must sign up via create-account flow.
      console.log(`[PROFILE API] No profile for user ${user.id} (${user.email}) - returning 404`);
      return NextResponse.json(
        {
          error: "Profile not found",
          userId: user.id,
          userEmail: user.email,
          message: "No profile found. Agents must create an account through the signup flow. Admins: run the suggested SQL in Supabase to create the profile.",
          suggestedSql: `INSERT INTO profiles (id, role, full_name, email, approval_status) VALUES ('${user.id}', 'admin', 'Admin User', '${user.email}', 'approved') ON CONFLICT (id) DO UPDATE SET role = 'admin';`,
        },
        { status: 404 }
      );
    }

    const profile = allProfiles[0];
    
    console.log(`[PROFILE API] Profile found: role=${profile.role}, approval_status=${profile.approval_status}`);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in /api/auth/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
