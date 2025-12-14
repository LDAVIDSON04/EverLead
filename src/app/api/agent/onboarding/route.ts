// src/app/api/agent/onboarding/route.ts
// POST: Update agent profile with onboarding information

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const onboardingSchema = z.object({
  profile_picture_url: z.string().url().optional().or(z.literal("")),
  job_title: z.string().min(1, "Job title is required"),
  funeral_home: z.string().min(1, "Funeral home is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parse and validate request body
    const body = await req.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update profile with onboarding data
    const updateData: any = {
      onboarding_completed: true,
    };

    if (data.profile_picture_url && data.profile_picture_url !== "") {
      updateData.profile_picture_url = data.profile_picture_url;
    }

    if (data.job_title) {
      updateData.job_title = data.job_title;
    }

    if (data.funeral_home) {
      updateData.funeral_home = data.funeral_home;
    }

    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/agent/onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

