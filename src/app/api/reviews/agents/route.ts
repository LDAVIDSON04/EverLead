// API endpoint to fetch review stats for multiple agents
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentIds } = body;

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid agentIds array" },
        { status: 400 }
      );
    }

    // Fetch reviews for all agents
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("agent_id, rating")
      .in("agent_id", agentIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Calculate stats for each agent
    const statsMap: Record<string, { averageRating: number; totalReviews: number }> = {};

    // Initialize all agents with 0 reviews
    agentIds.forEach((id: string) => {
      statsMap[id] = { averageRating: 0, totalReviews: 0 };
    });

    // Calculate stats from reviews
    (reviews || []).forEach((review: any) => {
      const agentId = review.agent_id;
      if (!statsMap[agentId]) {
        statsMap[agentId] = { averageRating: 0, totalReviews: 0 };
      }
      statsMap[agentId].totalReviews++;
    });

    // Calculate averages
    Object.keys(statsMap).forEach((agentId) => {
      const agentReviews = (reviews || []).filter((r: any) => r.agent_id === agentId);
      if (agentReviews.length > 0) {
        const sum = agentReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        statsMap[agentId].averageRating = Math.round((sum / agentReviews.length) * 10) / 10;
      }
    });

    return NextResponse.json({ stats: statsMap });
  } catch (error: any) {
    console.error("Error in /api/reviews/agents:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

