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
          notification_cities,
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

        // Validate notification_cities
        if (!notification_cities || !Array.isArray(notification_cities) || notification_cities.length === 0) {
          return NextResponse.json(
            { error: "Please add at least one city where you'd like to receive notifications." },
            { status: 400 }
          );
        }

        // Validate each city has city and province
        for (const cityObj of notification_cities) {
          if (!cityObj.city || !cityObj.province) {
            return NextResponse.json(
              { error: "Each city must have both city name and province." },
              { status: 400 }
            );
          }
        }

    // Validate supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error("supabaseAdmin is not initialized - missing environment variables");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Create Supabase client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let userId: string | null = null;
    let profileExists = false;

    // First, try to create auth user
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
        // Auth user exists, find it and check if profile exists
        console.log("Auth user already exists, finding user and checking profile...");
        
        try {
          // Try to get the user by email using admin client
          const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (listError) {
            console.error("Error listing users:", listError);
            return NextResponse.json(
              { error: "Failed to verify account status. Please try again." },
              { status: 500 }
            );
          }
          
          const existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          
          if (existingAuthUser) {
            userId = existingAuthUser.id;
            console.log("Found existing auth user:", userId);
            
            // Check if profile exists for this user
            const { data: existingUserProfile, error: profileCheckError } = await supabaseAdmin
              .from("profiles")
              .select("id, role, approval_status")
              .eq("id", userId)
              .maybeSingle();
            
            if (profileCheckError) {
              console.error("Error checking profile:", profileCheckError);
            }
            
            if (existingUserProfile) {
              profileExists = true;
              // Profile exists - check status and return appropriate message
              if (existingUserProfile.role === "agent") {
                if (existingUserProfile.approval_status === "pending") {
                  return NextResponse.json(
                    { error: "An account with this email is already pending approval. Please wait for admin approval or contact support." },
                    { status: 400 }
                  );
                } else if (existingUserProfile.approval_status === "approved") {
                  return NextResponse.json(
                    { error: "An account with this email already exists. Please sign in instead." },
                    { status: 400 }
                  );
                } else if (existingUserProfile.approval_status === "declined") {
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
            } else {
              // Auth user exists but no profile - we'll create the profile below
              console.log("Auth user exists but no profile found - will create profile");
            }
          } else {
            // Can't find the user - might be a different error
            console.error("Auth user error but couldn't find user in list");
            return NextResponse.json(
              { error: "An account with this email may already exist. Please try signing in instead." },
              { status: 400 }
            );
          }
        } catch (error: any) {
          console.error("Error handling existing auth user:", error);
          return NextResponse.json(
            { error: "Failed to verify account status. Please try again." },
            { status: 500 }
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
      console.error("No user ID available after auth attempt");
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    // If profile already exists, we would have returned above, so we can proceed to create

    // Create profile with approval_status = 'pending'
    // Note: email is NOT stored in profiles table - it's in auth.users
    // Build profile data, only including fields that exist
    const profileData: any = {
      id: userId,
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
    if (notification_cities && Array.isArray(notification_cities)) {
      profileData.notification_cities = notification_cities;
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
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("id, approval_status")
          .eq("id", userId)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking existing profile:", checkError);
        }

        if (existingProfile) {
          // Update existing profile instead
          // Note: email is NOT stored in profiles table - it's in auth.users
          const updateData: any = {
            full_name,
            role: "agent",
            approval_status: "pending",
          };
          if (phone) updateData.phone = phone;
          if (funeral_home) updateData.funeral_home = funeral_home;
          if (licensed_in_province !== undefined) {
            updateData.licensed_in_province = licensed_in_province === true || licensed_in_province === "yes";
          }
          if (licensed_funeral_director !== undefined) {
            updateData.licensed_funeral_director = licensed_funeral_director === true || licensed_funeral_director === "yes";
          }
          if (notification_cities && Array.isArray(notification_cities)) {
            updateData.notification_cities = notification_cities;
          }

          const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", userId)
            .select()
            .single();

          if (updateError) {
            console.error("Update profile error:", updateError);
            return NextResponse.json(
              { 
                error: "Failed to update profile. Please try again.",
                details: updateError.message || "Unknown error",
              },
              { status: 500 }
            );
          }
          
          // Success - profile updated
          console.log("✅ Profile updated successfully:", { userId, email, profileId: updatedProfile?.id });
          return NextResponse.json(
            { 
              success: true,
              message: "Account created successfully. Your application is pending approval.",
              userId,
            },
            { status: 201 }
          );
        } else {
          // Duplicate error but profile doesn't exist - might be a race condition
          console.error("Duplicate key error but profile not found - possible race condition");
          return NextResponse.json(
            { 
              error: "Failed to create profile. Please try again.",
              details: "Account may already exist. Please try signing in.",
            },
            { status: 500 }
          );
        }
      } else {
        // Other database error - return detailed error in development
        const errorMessage = profileError.message || "Unknown error";
        const errorDetails = profileError.details || profileError.hint || "";
        
        console.error("Profile creation failed:", {
          code: profileError.code,
          message: errorMessage,
          details: errorDetails,
        });
        
        return NextResponse.json(
          { 
            error: "Failed to create profile. Please try again.",
            details: process.env.NODE_ENV === "development" ? `${errorMessage} ${errorDetails}`.trim() : undefined,
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
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

