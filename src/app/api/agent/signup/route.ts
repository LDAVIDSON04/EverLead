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

    // Validate required fields
    if (!email || !password || !full_name || !phone || !funeral_home || licensed_in_province === undefined || licensed_funeral_director === undefined) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role, approval_status")
      .eq("email", email)
      .maybeSingle();

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
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: signUpError.message || "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error("No user returned from signup");
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Create profile with approval_status = 'pending'
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name,
        phone,
        funeral_home,
        licensed_in_province: licensed_in_province === true || licensed_in_province === "yes",
        licensed_funeral_director: licensed_funeral_director === true || licensed_funeral_director === "yes",
        role: "agent",
        approval_status: "pending",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      
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
          { error: "Failed to create profile. Please try again." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Account created successfully. Your application is pending approval." 
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

