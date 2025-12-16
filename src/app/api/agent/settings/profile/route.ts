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

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("Error in GET /api/agent/settings/profile:", err);
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
    const {
      fullName,
      firstName,
      lastName,
      businessName,
      professionalTitle,
      phone,
      licenseNumber,
      regionsServed,
      specialty,
      businessAddress,
      profilePictureUrl,
    } = body;

    const updateData: any = {};

    if (fullName !== undefined) updateData.full_name = fullName;
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (businessName !== undefined) updateData.funeral_home = businessName;
    if (professionalTitle !== undefined) updateData.job_title = professionalTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePictureUrl !== undefined) updateData.profile_picture_url = profilePictureUrl;

    // Store additional fields in metadata JSONB or as separate fields
    // We'll use a metadata field to store these extra settings
    const metadata: any = {};
    if (licenseNumber !== undefined) metadata.license_number = licenseNumber;
    if (regionsServed !== undefined) metadata.regions_served = regionsServed;
    if (specialty !== undefined) metadata.specialty = specialty;
    if (businessAddress !== undefined) metadata.business_address = businessAddress;

    if (Object.keys(metadata).length > 0) {
      // Get existing metadata first
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("metadata")
        .eq("id", user.id)
        .maybeSingle();

      updateData.metadata = {
        ...(existingProfile?.metadata || {}),
        ...metadata,
      };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /api/agent/settings/profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
