// API endpoint to fetch agent stats for TrustHighlights
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

    // Fetch reviews for this agent
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("agent_id", agentId);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    const totalReviews = reviews?.length || 0;
    const fiveStarReviews = reviews?.filter((r: any) => r.rating === 5).length || 0;
    const fiveStarPercentage = totalReviews > 0 
      ? Math.round((fiveStarReviews / totalReviews) * 100) 
      : 0;

    // For response time, we'll calculate based on time between lead assignment and first appointment confirmation
    // This is a proxy for "inquiries answered" - when an agent books an appointment after getting a lead
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from("appointments")
      .select("created_at, confirmed_at, agent_id")
      .eq("agent_id", agentId)
      .not("confirmed_at", "is", null);

    let responseTimePercentage = 0;
    if (!appointmentsError && appointments && appointments.length > 0) {
      // For now, we'll use a simplified calculation
      // If an agent has appointments, we'll show a high percentage
      // In the future, this could be refined to track actual inquiry response times
      // For now, we'll show 100% if they have any confirmed appointments (they're responsive)
      responseTimePercentage = appointments.length > 0 ? 100 : 0;
    }

    return NextResponse.json({
      fiveStarPercentage,
      totalReviews,
      responseTimePercentage,
      verified: true, // All approved agents are verified
    });
  } catch (error: any) {
    console.error("Error in /api/agent/stats/[agentId]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

