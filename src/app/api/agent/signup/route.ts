// src/app/api/agent/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = checkRateLimit(req, "signup", 10);
  if (rateLimitRes) return rateLimitRes;

  // Bot check disabled for signup to avoid blocking real users (VPN, ad blockers, strict privacy).
  // Rate limiting (10/min per IP) still protects against abuse.

  try {
    const body = await req.json();
        const {
          email,
          password,
          full_name,
          first_name,
          last_name,
          phone,
          address,
          certificates_licenses,
          professional_groups,
          community_organizations,
          llqp_exclusive_quebec,
          llqp_including_quebec,
          trustage_enroller_number,
          independent_agent,
          funeral_homes,
          services_provided,
          funeral_home_services,
          // Legacy fields for backward compatibility
          funeral_home,
          licensed_in_province,
          licensed_funeral_director,
          notification_cities,
          // New multi-step fields
          job_title,
          business_address,
          business_street,
          business_city,
          business_province,
          business_zip,
          metadata: metadataFromBody,
          office_locations,
          profile_bio,
        } = body;

    console.log("Agent signup request received:", { email, full_name, hasPassword: !!password });

        // Validate required fields
        if (!email || !password || !full_name || !phone || !address) {
          console.error("Missing required fields:", { email: !!email, password: !!password, full_name: !!full_name, phone: !!phone, address: !!address });
          return NextResponse.json(
            { error: "All required fields must be filled." },
            { status: 400 }
          );
        }

        // Validate address fields
        if (!address.street || !address.city || !address.province || !address.postalCode) {
          return NextResponse.json(
            { error: "Please provide complete address information (street, city, province, postal code)." },
            { status: 400 }
          );
        }

        // Validate notification_cities (use from address if not provided)
        const cities = notification_cities || (address.city ? [{ city: address.city, province: address.province }] : []);
        if (!cities || !Array.isArray(cities) || cities.length === 0) {
          return NextResponse.json(
            { error: "Please provide at least one city for notifications." },
            { status: 400 }
          );
        }

        // Validate each city has city and province
        for (const cityObj of cities) {
          if (!cityObj.city || !cityObj.province) {
            return NextResponse.json(
              { error: "Each city must have both city name and province." },
              { status: 400 }
            );
          }
        }

        // Validate funeral homes if not independent agent
        if (independent_agent === false && (!funeral_homes || !Array.isArray(funeral_homes) || funeral_homes.length === 0)) {
          return NextResponse.json(
            { error: "Please add at least one funeral home if you are not an independent agent." },
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
                  // Allow re-application: fall through and update profile to pending with new data
                  profileExists = true;
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
    // Build profile data; use first_name + last_name from create-account so name is never wrong
    const profileData: any = {
      id: userId,
      full_name: full_name || [first_name, last_name].filter(Boolean).join(" ").trim() || "",
      role: "agent",
      approval_status: "pending",
    };
    if (first_name !== undefined && first_name !== null) profileData.first_name = String(first_name).trim() || null;
    if (last_name !== undefined && last_name !== null) profileData.last_name = String(last_name).trim() || null;

    // Add basic fields
    if (phone) profileData.phone = phone;
    
    // Add address fields
    if (address) {
      profileData.agent_city = address.city;
      profileData.agent_province = address.province.toUpperCase().trim();
      // Store full address in metadata
      if (!profileData.metadata) profileData.metadata = {};
      profileData.metadata.address = {
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
      };
      console.log("🔍 [SIGNUP] Saving address to metadata:", {
        address_from_form: address,
        metadata_address: profileData.metadata.address,
      });
    } else {
      console.log("⚠️ [SIGNUP] No address provided in signup data");
    }

    // Add notification cities
    if (cities && Array.isArray(cities) && cities.length > 0) {
      profileData.notification_cities = cities;
      // Extract province from first notification city (agents are restricted to their province)
      const firstCity = cities[0];
      if (firstCity && firstCity.province) {
        profileData.agent_province = firstCity.province.toUpperCase().trim();
      }
    }

    // Build metadata object with all additional fields
    const metadata: any = metadataFromBody || profileData.metadata || {};
    // Always persist home address from signup so Settings shows street + postal code (not just city/province)
    if (address) {
      metadata.address = {
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
      };
    }
    
    // Certificates/Licenses
    if (certificates_licenses) metadata.certificates_licenses = certificates_licenses;
    
    // Professional Groups
    if (professional_groups) metadata.professional_groups = professional_groups;
    
    // Community Organizations
    if (community_organizations) metadata.community_organizations = community_organizations;
    
    // LLQP License
    if (llqp_exclusive_quebec !== undefined) metadata.llqp_exclusive_quebec = llqp_exclusive_quebec === true || llqp_exclusive_quebec === "yes";
    if (llqp_including_quebec !== undefined) metadata.llqp_including_quebec = llqp_including_quebec === true || llqp_including_quebec === "yes";
    // New LLQP fields from create account form
    if (metadataFromBody?.llqp_license !== undefined) {
      metadata.llqp_license = metadataFromBody.llqp_license === true || metadataFromBody.llqp_license === "yes";
    }
    if (metadataFromBody?.llqp_quebec !== undefined) {
      metadata.llqp_quebec = metadataFromBody.llqp_quebec;
    }
    
    // TruStage
    if (trustage_enroller_number !== undefined) metadata.trustage_enroller_number = trustage_enroller_number === true || trustage_enroller_number === "yes";
    // New TruStage field from create account form
    if (metadataFromBody?.trustage_enroller_number !== undefined) {
      metadata.trustage_enroller_number = metadataFromBody.trustage_enroller_number === true || metadataFromBody.trustage_enroller_number === "yes";
    }
    
    // Independent Agent
    if (independent_agent !== undefined) metadata.independent_agent = independent_agent === true || independent_agent === "yes";
    
    // Funeral Homes
    if (funeral_homes && Array.isArray(funeral_homes)) {
      metadata.funeral_homes = funeral_homes;
      // For backward compatibility, set funeral_home to first one
      if (funeral_homes.length > 0 && funeral_homes[0].name) {
        profileData.funeral_home = funeral_homes[0].name;
      }
    } else if (funeral_home) {
      // Legacy support
      profileData.funeral_home = funeral_home;
    }
    
    // Services Provided
    if (services_provided && Array.isArray(services_provided)) {
      metadata.services_provided = services_provided;
    }
    
    // Funeral Home Services
    if (funeral_home_services && Array.isArray(funeral_home_services)) {
      metadata.funeral_home_services = funeral_home_services;
    }
    
    // Handle regions_served_array if provided (new format)
    if (metadataFromBody?.regions_served_array && Array.isArray(metadataFromBody.regions_served_array)) {
      metadata.regions_served = metadataFromBody.regions_served_array.join(', ');
      metadata.regions_served_array = metadataFromBody.regions_served_array;
    } else if (metadataFromBody?.regions_served) {
      metadata.regions_served = metadataFromBody.regions_served;
    }
    
    // Legacy fields for backward compatibility
    if (licensed_in_province !== undefined) {
      profileData.licensed_in_province = licensed_in_province === true || licensed_in_province === "yes";
    }
    if (licensed_funeral_director !== undefined) {
      profileData.licensed_funeral_director = licensed_funeral_director === true || licensed_funeral_director === "yes";
    }
    
    // Add job_title if provided
    if (job_title) {
      profileData.job_title = job_title;
    }

    // New create-account flow: store business/firm name for display (all roles)
    if (metadataFromBody?.business_name) {
      profileData.funeral_home = metadataFromBody.business_name;
    }
    
    // Automatically store timezone based on province (if province is set)
    if (profileData.agent_province && !metadata.timezone) {
      const province = profileData.agent_province.toUpperCase().trim();
      const { PROVINCE_TO_TIMEZONE } = await import("@/lib/timezone");
      const inferredTimezone = PROVINCE_TO_TIMEZONE[province];
      if (inferredTimezone) {
        metadata.timezone = inferredTimezone;
        console.log(`✅ [SIGNUP] Storing timezone ${inferredTimezone} for province ${province}`);
      }
    }
    
    // Store metadata
    profileData.metadata = metadata;

    // Custom profile bio from create-account Step 3 (agent writes their own bio)
    if (profile_bio && typeof profile_bio === "string" && profile_bio.trim()) {
      profileData.ai_generated_bio = profile_bio.trim();
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
            full_name: full_name || [first_name, last_name].filter(Boolean).join(" ").trim() || "",
            role: "agent",
            approval_status: "pending",
          };
          if (first_name !== undefined && first_name !== null) updateData.first_name = String(first_name).trim() || null;
          if (last_name !== undefined && last_name !== null) updateData.last_name = String(last_name).trim() || null;

          // Add basic fields
          if (phone) updateData.phone = phone;
          
          // Build metadata with all additional fields
          const existingMetadata = existingProfile.metadata || {};
          const metadata: any = { ...existingMetadata };
          
          // Add address fields
          if (address) {
            updateData.agent_city = address.city;
            updateData.agent_province = address.province.toUpperCase().trim();
            metadata.address = {
              street: address.street,
              city: address.city,
              province: address.province,
              postalCode: address.postalCode,
            };
          }
          
          // Add notification cities
          if (cities && Array.isArray(cities) && cities.length > 0) {
            updateData.notification_cities = cities;
            const firstCity = cities[0];
            if (firstCity && firstCity.province) {
              updateData.agent_province = firstCity.province.toUpperCase().trim();
            }
          }
          
          // Add all other metadata fields
          if (certificates_licenses) metadata.certificates_licenses = certificates_licenses;
          if (professional_groups) metadata.professional_groups = professional_groups;
          if (community_organizations) metadata.community_organizations = community_organizations;
          if (llqp_exclusive_quebec !== undefined) metadata.llqp_exclusive_quebec = llqp_exclusive_quebec === true || llqp_exclusive_quebec === "yes";
          if (llqp_including_quebec !== undefined) metadata.llqp_including_quebec = llqp_including_quebec === true || llqp_including_quebec === "yes";
          if (trustage_enroller_number !== undefined) metadata.trustage_enroller_number = trustage_enroller_number === true || trustage_enroller_number === "yes";
          if (independent_agent !== undefined) metadata.independent_agent = independent_agent === true || independent_agent === "yes";
          if (funeral_homes && Array.isArray(funeral_homes)) {
            metadata.funeral_homes = funeral_homes;
            if (funeral_homes.length > 0 && funeral_homes[0].name) {
              updateData.funeral_home = funeral_homes[0].name;
            }
          } else if (funeral_home) {
            updateData.funeral_home = funeral_home;
          }
          if (services_provided && Array.isArray(services_provided)) metadata.services_provided = services_provided;
          if (funeral_home_services && Array.isArray(funeral_home_services)) metadata.funeral_home_services = funeral_home_services;
          
          // Merge metadata from body if provided (contains bio, license_number, etc.)
          if (metadataFromBody && typeof metadataFromBody === 'object') {
            Object.assign(metadata, metadataFromBody);
          }

          // Custom profile bio from create-account Step 3
          if (profile_bio && typeof profile_bio === "string" && profile_bio.trim()) {
            updateData.ai_generated_bio = profile_bio.trim();
          }
          
          // Business address fields
          if (business_street) metadata.business_street = business_street;
          if (business_city) metadata.business_city = business_city;
          if (business_province) metadata.business_province = business_province;
          if (business_zip) metadata.business_zip = business_zip;
          if (business_address) metadata.business_address = business_address;
          
          // Automatically store timezone based on province (if province is set and timezone not already stored)
          if (updateData.agent_province && !metadata.timezone) {
            const province = updateData.agent_province.toUpperCase().trim();
            const { PROVINCE_TO_TIMEZONE } = await import("@/lib/timezone");
            const inferredTimezone = PROVINCE_TO_TIMEZONE[province];
            if (inferredTimezone) {
              metadata.timezone = inferredTimezone;
              console.log(`✅ [SIGNUP UPDATE] Storing timezone ${inferredTimezone} for province ${province}`);
            }
          }
          
          updateData.metadata = metadata;
          
          // Add job_title if provided
          if (job_title) {
            updateData.job_title = job_title;
          }

          // New create-account flow: store business/firm name for display (all roles)
          if (metadataFromBody?.business_name) {
            updateData.funeral_home = metadataFromBody.business_name;
          }
          
          // Legacy fields
          if (licensed_in_province !== undefined) {
            updateData.licensed_in_province = licensed_in_province === true || licensed_in_province === "yes";
          }
          if (licensed_funeral_director !== undefined) {
            updateData.licensed_funeral_director = licensed_funeral_director === true || licensed_funeral_director === "yes";
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

          // Create office locations if provided
          if (office_locations && Array.isArray(office_locations) && office_locations.length > 0) {
            try {
              // Delete existing office locations for this agent first
              await supabaseAdmin
                .from("office_locations")
                .delete()
                .eq("agent_id", userId);

              const locationInserts = office_locations.map((loc: any) => ({
                agent_id: userId,
                name: loc.name,
                street_address: loc.street_address || null,
                city: loc.city,
                province: loc.province,
                postal_code: loc.postal_code || null,
                associated_firm: loc.associated_firm || null,
              }));

              const { error: locationsError } = await supabaseAdmin
                .from("office_locations")
                .insert(locationInserts);

              if (locationsError) {
                console.error("Error creating office locations:", locationsError);
                // Don't fail the signup if office locations fail
              } else {
                console.log(`✅ Created ${office_locations.length} office location(s) for agent ${userId}`);
              }
            } catch (locationsErr: any) {
              console.error("Error processing office locations:", locationsErr);
              // Don't fail the signup if office locations fail
            }
          }

          // Generate bio only if no custom profile_bio was provided (legacy: structured bio from old Step 3)
          const hasCustomBio = profile_bio && typeof profile_bio === "string" && profile_bio.trim().length > 0;
          if (!hasCustomBio && metadataFromBody?.bio && metadataFromBody.bio.years_of_experience && metadataFromBody.bio.practice_philosophy_help && metadataFromBody.bio.practice_philosophy_appreciate) {
            try {
              const requestUrl = new URL(req.url);
              const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
              const bioRes = await fetch(`${baseUrl}/api/agents/generate-bio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: userId }),
              });
              if (bioRes.ok) {
                console.log(`✅ Bio generated automatically for agent ${userId}`);
              } else {
                const errorData = await bioRes.json().catch(() => ({}));
                console.warn(`⚠️ Bio generation failed for agent ${userId}:`, errorData);
              }
            } catch (bioErr: any) {
              console.error("Error generating bio during signup:", bioErr);
            }
          }

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

    // Create office locations if provided (using admin client since user isn't authenticated yet)
    // Only create if we didn't already create them in the update path above
    if (office_locations && Array.isArray(office_locations) && office_locations.length > 0 && !profileExists) {
      try {
        // Delete any existing office locations first to prevent duplicates
        await supabaseAdmin
          .from("office_locations")
          .delete()
          .eq("agent_id", userId);
        
        const locationInserts = office_locations.map((loc: any) => ({
          agent_id: userId,
          name: loc.name,
          street_address: loc.street_address || null,
          city: loc.city,
          province: loc.province,
          postal_code: loc.postal_code || null,
          associated_firm: loc.associated_firm || null,
        }));

        const { error: locationsError } = await supabaseAdmin
          .from("office_locations")
          .insert(locationInserts);

        if (locationsError) {
          console.error("Error creating office locations:", locationsError);
          // Don't fail the signup if office locations fail - can be added later
        } else {
          console.log(`✅ Created ${office_locations.length} office location(s) for agent ${userId}`);
        }
      } catch (locationsErr: any) {
        console.error("Error processing office locations:", locationsErr);
        // Don't fail the signup if office locations fail
      }
    }

    // Generate bio only if no custom profile_bio was provided (legacy: structured bio from old Step 3)
    const hasCustomBio = profile_bio && typeof profile_bio === "string" && profile_bio.trim().length > 0;
    if (!hasCustomBio && metadataFromBody?.bio && metadataFromBody.bio.years_of_experience && metadataFromBody.bio.practice_philosophy_help && metadataFromBody.bio.practice_philosophy_appreciate) {
      try {
        const requestUrl = new URL(req.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
        const bioRes = await fetch(`${baseUrl}/api/agents/generate-bio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: userId }),
        });
        if (bioRes.ok) {
          console.log(`✅ Bio generated automatically for agent ${userId}`);
        } else {
          const errorData = await bioRes.json().catch(() => ({}));
          console.warn(`⚠️ Bio generation failed for agent ${userId}:`, errorData);
        }
      } catch (bioErr: any) {
        console.error("Error generating bio during signup:", bioErr);
      }
    }

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

