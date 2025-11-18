// src/app/api/leads/[leadId]/bid/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request, context: any): Promise<Response> {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json().catch(() => null);
    const amount = body?.amount;
    const agentId = body?.agentId;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 403 }
      );
    }

    if (profile.role !== "agent") {
      return NextResponse.json(
        { error: "Only agents can place bids" },
        { status: 403 }
      );
    }

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid bid amount. Must be a positive number." },
        { status: 400 }
      );
    }

    // Load the lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Validate auction is enabled
    if (!lead.auction_enabled) {
      return NextResponse.json(
        { error: "Auction is not enabled for this lead" },
        { status: 400 }
      );
    }

    // Validate lead is available (not purchased/assigned)
    if (lead.status !== "new" && lead.status !== "cold_unassigned") {
      return NextResponse.json(
        { error: "Lead is no longer available for bidding" },
        { status: 400 }
      );
    }

    // Validate auction hasn't ended
    if (lead.auction_ends_at) {
      const endsAt = new Date(lead.auction_ends_at);
      const now = new Date();
      if (now > endsAt) {
        return NextResponse.json(
          { error: "Auction has ended" },
          { status: 400 }
        );
      }
    }

    // Validate bid amount with $1 minimum increment
    const MIN_INCREMENT = 1.0; // dollars
    const currentBid = lead.current_bid_amount ?? 0;
    const minAllowed = currentBid > 0 ? currentBid + MIN_INCREMENT : MIN_INCREMENT;

    if (amount < minAllowed) {
      return NextResponse.json(
        { error: `Bid must be at least $${minAllowed.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Convert amount to cents for storage (if we store in cents) or keep in dollars
    // Based on the codebase, it seems prices are stored in cents, but bids might be in dollars
    // For consistency, let's store bid amount in dollars (as numeric)
    const bidAmount = amount;

    // Insert bid and update lead (we'll do this in sequence since Supabase doesn't support transactions easily)
    const { data: newBid, error: bidInsertError } = await supabaseAdmin
      .from("lead_bids")
      .insert({
        lead_id: leadId,
        agent_id: agentId,
        amount: bidAmount,
      })
      .select("*")
      .single();

    if (bidInsertError) {
      console.error("Bid insert error", bidInsertError);
      return NextResponse.json(
        { error: "Failed to place bid" },
        { status: 500 }
      );
    }

    // Update lead with new current bid
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        current_bid_amount: bidAmount,
        current_bid_agent_id: agentId,
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Lead update error", updateError);
      // Try to rollback the bid insert (optional, but good practice)
      await supabaseAdmin.from("lead_bids").delete().eq("id", newBid.id);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lead: updatedLead,
      bid: newBid,
    });
  } catch (err: any) {
    console.error("Bid error", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong placing bid" },
      { status: 500 }
    );
  }
}

