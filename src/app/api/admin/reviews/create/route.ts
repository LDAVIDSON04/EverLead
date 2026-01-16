// Admin API endpoint to create reviews
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createReviewSchema = z.object({
  agentId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
  adminUserId: z.string().uuid().optional(), // For logging who created it
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { agentId, leadId, appointmentId, rating, reviewText, adminUserId } = validation.data;

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

    // Verify agent exists
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", agentId)
      .eq("role", "agent")
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get or create a lead_id
    let finalLeadId: string;
    
    if (leadId) {
      // Verify lead exists
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("id", leadId)
        .maybeSingle();

      if (leadError || !lead) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }
      finalLeadId = leadId;
    } else {
      // Create a dummy lead for the review
      // Include all required fields based on leads table schema
      const { data: newLead, error: leadCreateError } = await supabaseAdmin
        .from("leads")
        .insert({
          first_name: "Admin",
          last_name: "Review",
          full_name: "Admin Review",
          email: `admin-review-${Date.now()}@soradin.internal`,
          phone: null,
          city: agent.agent_city || "Unknown",
          province: agent.agent_province || "BC",
          service_type: "Pre-need Planning",
          status: "new",
          urgency_level: "cold",
          lead_price: 0, // Required field - set to 0 for admin reviews
          buy_now_price_cents: 0,
          timeline_intent: "not_specified",
          planning_for: "self",
          remains_disposition: null,
          service_celebration: null,
          family_pre_arranged: null,
          assigned_agent_id: null,
          auction_enabled: false,
        })
        .select("id")
        .single();

      if (leadCreateError || !newLead) {
        console.error("Error creating dummy lead:", leadCreateError);
        return NextResponse.json(
          { error: "Failed to create lead for review" },
          { status: 500 }
        );
      }
      finalLeadId = newLead.id;
    }

    // Verify appointment exists if provided
    if (appointmentId) {
      const { data: appointment, error: appointmentError } = await supabaseAdmin
        .from("appointments")
        .select("id, agent_id")
        .eq("id", appointmentId)
        .maybeSingle();

      if (appointmentError || !appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      // Verify appointment belongs to the agent
      if (appointment.agent_id !== agentId) {
        return NextResponse.json(
          { error: "Appointment does not belong to this agent" },
          { status: 400 }
        );
      }
    }

    // Create the review
    const { data: newReview, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .insert({
        agent_id: agentId,
        lead_id: finalLeadId,
        appointment_id: appointmentId || null,
        rating,
        review_text: reviewText || null,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      return NextResponse.json(
        { error: "Failed to create review", details: reviewError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Admin created review for agent ${agentId} (${agent.full_name}):`, {
      reviewId: newReview.id,
      rating,
      adminUserId,
    });

    return NextResponse.json({
      success: true,
      review: newReview,
      message: "Review created successfully",
    });
  } catch (error: any) {
    console.error("Error in /api/admin/reviews/create:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
