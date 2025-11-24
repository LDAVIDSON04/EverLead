// src/app/api/agent/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      full_name,
      phone,
      funeral_home,
      licensed_in_province,
      licensed_funeral_director,
    } = body;

    console.log("Agent signup request received:", { email, full_name, hasPassword: !!password });

    // Validate required fields
    if (!email || !password || !full_name || !phone || !funeral_home || licensed_in_province === undefined || licensed_funeral_director === undefined) {
      console.error("Missing required fields:", { email: !!email, password: !!password, full_name: !!full_name, phone: !!phone, funeral_home: !!funeral_home, licensed_in_province, licensed_funeral_director });
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error("supabaseAdmin is not initialized - missing environment variables");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Check if email already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, approval_status")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing profile:", checkError);
      // Continue anyway - might be a permissions issue, but we'll try to create
    }

    if (existingProfile) {
      // Email already exists
      if (existingProfile.role === "agent") {
        if (existingProfile.approval_status === "pending") {
          return NextResponse.json(
            { error: "An account with this email is already pending approval. Please wait for admin approval or contact support." },
            { status: 400 }
          );
        } else if (existingProfile.approval_status === "approved") {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 400 }
          );
        } else if (existingProfile.approval_status === "declined") {
          return NextResponse.json(
            { error: "This account was previously declined. Please contact support if you believe this is an error." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }
    }

    // Create Supabase client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let userId: string | null = null;

    // Create auth user (disable email confirmation for now - we'll approve manually)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // No email confirmation needed - manual approval instead
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      // Handle specific Supabase errors
      if (signUpError.message?.includes("already registered") || signUpError.message?.includes("User already registered")) {
        // Auth user exists, but profile might not - check if profile exists
        console.log("Auth user already exists, checking if profile exists...");
        
        // Try to get the user by email using admin client
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = authUsers?.users?.find((u: any) => u.email === email);
        
        if (existingAuthUser) {
          userId = existingAuthUser.id;
          console.log("Found existing auth user:", userId);
          
          // Check if profile exists for this user
          const { data: existingUserProfile } = await supabaseAdmin
            .from("profiles")
            .select("id, role, approval_status")
            .eq("id", userId)
            .maybeSingle();
          
          if (existingUserProfile) {
            // Profile exists - user should sign in
            return NextResponse.json(
              { error: "An account with this email already exists. Please sign in instead." },
              { status: 400 }
            );
          }
          // Profile doesn't exist - we'll create it below
        } else {
          // Can't find the user - might be a different error
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: signUpError.message || "Failed to create account. Please try again." },
          { status: 400 }
        );
      }
    } else if (authData.user) {
      userId = authData.user.id;
      console.log("New auth user created:", userId);
    }

    if (!userId) {
      console.error("No user ID available");
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    // Create profile with approval_status = 'pending'
    // Build profile data, only including fields that exist
    const profileData: any = {
      id: userId,
      email,
      full_name,
      role: "agent",
      approval_status: "pending",
    };

    // Add optional fields if they exist in the database
    if (phone) profileData.phone = phone;
    if (funeral_home) profileData.funeral_home = funeral_home;
    if (licensed_in_province !== undefined) {
      profileData.licensed_in_province = licensed_in_province === true || licensed_in_province === "yes";
    }
    if (licensed_funeral_director !== undefined) {
      profileData.licensed_funeral_director = licensed_funeral_director === true || licensed_funeral_director === "yes";
    }

    console.log("Attempting to create profile:", { userId, email, full_name });

    const { data: profileDataResult, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        profileData,
      });
      
      // Check if it's a duplicate key error (profile already exists)
      if (profileError.code === "23505" || profileError.message?.includes("duplicate") || profileError.message?.includes("unique")) {
        // Profile might already exist, check if we can update it
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, approval_status")
          .eq("id", userId)
          .maybeSingle();

        if (existingProfile) {
          // Update existing profile instead
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              email,
              full_name,
              phone,
              funeral_home,
              licensed_in_province: licensed_in_province === true || licensed_in_province === "yes",
              licensed_funeral_director: licensed_funeral_director === true || licensed_funeral_director === "yes",
              role: "agent",
              approval_status: "pending",
            })
            .eq("id", userId);

          if (updateError) {
            console.error("Update profile error:", updateError);
            return NextResponse.json(
              { error: "Failed to update profile. Please try again." },
              { status: 500 }
            );
          }
          // Success - profile updated
        } else {
          return NextResponse.json(
            { error: "Failed to create profile. Please try again." },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: "Failed to create profile. Please try again.",
            details: profileError.message || "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    if (!profileDataResult) {
      console.error("Profile created but no data returned");
      return NextResponse.json(
        { error: "Profile created but verification failed. Please contact support." },
        { status: 500 }
      );
    }

    console.log("✅ Profile created successfully:", { userId, email, profileId: profileDataResult.id });

    return NextResponse.json(
      { 
        success: true,
        message: "Account created successfully. Your application is pending approval.",
        userId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Agent signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

