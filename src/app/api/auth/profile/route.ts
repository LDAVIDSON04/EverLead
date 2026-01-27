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
      // Auto-create profile if missing - check if user email suggests admin
      const isAdminEmail = user.email?.toLowerCase().includes('admin') || 
                          user.email?.toLowerCase().includes('soradin.com');
      
      const defaultRole = isAdminEmail ? 'admin' : 'agent';
      const defaultApprovalStatus = isAdminEmail ? 'approved' : 'pending';
      
      console.log(`[PROFILE API] Auto-creating profile for user ${user.id} with role ${defaultRole}`);
      
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          role: defaultRole,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          approval_status: defaultApprovalStatus,
        })
        .select("role, approval_status, full_name, email")
        .single();

      if (createError || !newProfile) {
        console.error("Error auto-creating profile:", createError);
        return NextResponse.json(
          { 
            error: "Profile not found and could not be created", 
            userId: user.id,
            userEmail: user.email,
            createError: createError?.message,
            message: `No profile found. Tried to auto-create but failed. Please run: INSERT INTO profiles (id, role, full_name, email, approval_status) VALUES ('${user.id}', 'admin', 'Admin User', '${user.email}', 'approved') ON CONFLICT (id) DO UPDATE SET role = 'admin';`
          },
          { status: 404 }
        );
      }

      console.log(`[PROFILE API] Successfully auto-created profile with role ${newProfile.role}`);
      return NextResponse.json({ profile: newProfile });
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
