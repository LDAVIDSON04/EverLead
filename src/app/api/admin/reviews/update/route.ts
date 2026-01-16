// Admin API endpoint to update reviews and associated lead names
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reviewText: z.string().optional(),
  leadFirstName: z.string().optional(),
  leadLastName: z.string().optional(),
  adminUserId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = updateReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reviewId, reviewText, leadFirstName, leadLastName, adminUserId } = validation.data;

    // Verify admin (if adminUserId provided)
    if (adminUserId) {
      const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .maybeSingle();

      if (!adminProfile || adminProfile.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    // Get the review to find the lead_id
    const { data: review, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .select("id, agent_id, lead_id, review_text")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review text if provided
    if (reviewText !== undefined) {
      const { error: updateReviewError } = await supabaseAdmin
        .from("reviews")
        .update({
          review_text: reviewText || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (updateReviewError) {
        console.error("Error updating review:", updateReviewError);
        return NextResponse.json(
          { error: "Failed to update review", details: updateReviewError.message },
          { status: 500 }
        );
      }
    }

    // Update lead name if provided
    if (leadFirstName !== undefined || leadLastName !== undefined) {
      // Get current lead data
      const { data: lead, error: leadFetchError } = await supabaseAdmin
        .from("leads")
        .select("first_name, last_name, full_name")
        .eq("id", review.lead_id)
        .single();

      if (leadFetchError || !lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }

      const newFirstName = leadFirstName !== undefined ? leadFirstName : lead.first_name;
      const newLastName = leadLastName !== undefined ? leadLastName : lead.last_name;
      const newFullName = `${newFirstName} ${newLastName}`.trim();

      const { error: updateLeadError } = await supabaseAdmin
        .from("leads")
        .update({
          first_name: newFirstName,
          last_name: newLastName,
          full_name: newFullName,
        })
        .eq("id", review.lead_id);

      if (updateLeadError) {
        console.error("Error updating lead:", updateLeadError);
        return NextResponse.json(
          { error: "Failed to update lead name", details: updateLeadError.message },
          { status: 500 }
        );
      }
    }

    console.log(`✅ Admin updated review ${reviewId}`);

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
    });
  } catch (error: any) {
    console.error("Error in /api/admin/reviews/update:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
