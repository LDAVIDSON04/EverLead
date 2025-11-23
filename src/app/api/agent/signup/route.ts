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

    // Create Supabase client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      console.error("Signup error:", signUpError);
      return NextResponse.json(
        { error: signUpError?.message || "Failed to create account." },
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
      // Try to clean up auth user if profile creation fails
      // (Note: This might not work if RLS prevents it, but it's worth trying)
      return NextResponse.json(
        { error: "Failed to create profile. Please try again." },
        { status: 500 }
      );
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

