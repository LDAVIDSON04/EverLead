// API endpoint to submit a review
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const submitReviewSchema = z.object({
  appointmentId: z.string().uuid(),
  token: z.string(), // Token from email link for verification
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = submitReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { appointmentId, token, rating, reviewText } = validation.data;

    // Verify token and get appointment details
    // Token should be a hash of appointmentId + secret, but for simplicity we'll use appointmentId as token
    // In production, you'd want to use a proper token system
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select(`
        id,
        agent_id,
        lead_id,
        status,
        confirmed_at,
        cached_lead_full_name
      `)
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify token matches (simple check - in production use proper token verification)
    if (token !== appointmentId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      );
    }

    // Check if review already exists for this appointment
    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error: updateError } = await supabaseAdmin
        .from("reviews")
        .update({
          rating,
          review_text: reviewText || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating review:", updateError);
        return NextResponse.json(
          { error: "Failed to update review" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        review: updatedReview,
        message: "Review updated successfully",
      });
    }

    // Resolve reviewer display name (First L.) from appointment or lead so we store it and it never changes
    let reviewerDisplayName: string | null = null;
    const cachedName = (appointment as any)?.cached_lead_full_name?.trim();
    if (cachedName) {
      const parts = cachedName.split(" ").filter(Boolean);
      reviewerDisplayName = parts.length > 1
        ? `${parts[0]} ${parts[parts.length - 1][0]}.`
        : parts[0] || null;
    }
    if (!reviewerDisplayName && appointment.lead_id) {
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("first_name, last_name, full_name")
        .eq("id", appointment.lead_id)
        .single();
      const fullName = lead?.full_name || (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : null);
      if (fullName) {
        const parts = fullName.trim().split(" ").filter(Boolean);
        reviewerDisplayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] || null;
      }
    }

    // Create new review
    const { data: newReview, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .insert({
        agent_id: appointment.agent_id,
        lead_id: appointment.lead_id,
        appointment_id: appointmentId,
        rating,
        review_text: reviewText || null,
        reviewer_display_name: reviewerDisplayName,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      return NextResponse.json(
        { error: "Failed to create review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "Review submitted successfully",
    });
  } catch (error: any) {
    console.error("Error in /api/reviews/submit:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

