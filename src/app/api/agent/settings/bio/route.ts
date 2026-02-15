import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * POST /api/agent/settings/bio
 * Saves the agent's profile bio: metadata.bio (structured fields) and ai_generated_bio (editable text).
 * Uses service role so the save always persists; "Learn more about me" and public profile read this.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
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

    const body = await request.json();
    const { bioData, aiGeneratedBio } = body;

    // Persist exactly what the agent edited: trimmed string (empty string if cleared)
    const bioText =
      typeof aiGeneratedBio === "string"
        ? aiGeneratedBio.trim()
        : aiGeneratedBio === null || aiGeneratedBio === undefined
          ? ""
          : String(aiGeneratedBio).trim();

    // Get existing metadata so we only overwrite metadata.bio
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("metadata")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching profile for bio save:", fetchError);
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    const existingMetadata = (existingProfile?.metadata as Record<string, unknown>) || {};
    const metadata = {
      ...existingMetadata,
      bio: bioData ?? existingMetadata.bio,
    };

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        metadata,
        ai_generated_bio: bioText,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error saving bio:", updateError);
      return NextResponse.json({ error: "Failed to save bio", details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Bio saved. Your updates will appear on your public profile and in \"Learn more about\".",
    });
  } catch (err: unknown) {
    console.error("Error in POST /api/agent/settings/bio:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
