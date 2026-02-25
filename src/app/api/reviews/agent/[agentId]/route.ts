// API endpoint to fetch reviews for an agent
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;

    if (!agentId) {
      return NextResponse.json(
        { error: "Missing agent ID" },
        { status: 400 }
      );
    }

    // Fetch reviews for this agent; prefer reviewer_display_name (set at submit), then appointment cached name, then lead
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select(`
        id,
        rating,
        review_text,
        created_at,
        reviewer_display_name,
        leads (
          first_name,
          last_name,
          full_name
        ),
        appointments (
          cached_lead_full_name
        )
      `)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Calculate average rating and total count
    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews!.reduce((sum: number, review: any) => sum + review.rating, 0) / totalReviews
      : 0;

    // Format reviews for frontend: use stored reviewer_display_name when set, else appointment cached name, else lead name
    const formattedReviews = (reviews || []).map((review: any) => {
      const stored = review.reviewer_display_name?.trim();
      if (stored) {
        return { displayName: stored, review };
      }
      const appointment = Array.isArray(review.appointments) ? review.appointments[0] : review.appointments;
      const cachedName = appointment?.cached_lead_full_name?.trim();
      const lead = Array.isArray(review.leads) ? review.leads[0] : review.leads;
      const leadName = lead?.full_name ||
        (lead?.first_name && lead?.last_name
          ? `${lead.first_name} ${lead.last_name}`
          : null);
      const reviewerName = cachedName || leadName || "Anonymous";
      const nameParts = reviewerName.split(" ").filter(Boolean);
      const displayName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : nameParts[0] || "Anonymous";
      return { displayName, review };
    }).map(({ displayName, review }: { displayName: string; review: any }) => {

      // Format date
      const reviewDate = new Date(review.created_at);
      const month = reviewDate.toLocaleDateString("en-US", { month: "long" });
      const year = reviewDate.getFullYear();
      const formattedDate = `${month} ${year}`;

      return {
        id: review.id,
        author: displayName,
        rating: review.rating,
        date: formattedDate,
        comment: review.review_text || null,
        verified: true,
      };
    });

    return NextResponse.json({
      reviews: formattedReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews,
    });
  } catch (error: any) {
    console.error("Error in /api/reviews/agent/[agentId]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

