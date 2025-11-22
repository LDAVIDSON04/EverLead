// src/app/api/leads/[leadId]/bid/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizeAuctionStatus, validateBidAmount, calculateNewAuctionEnd } from "@/lib/auctions";

export async function POST(req: Request, context: any): Promise<Response> {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json().catch(() => null);
    const increment = body?.increment; // New: accepts increment (5, 10, 15, etc.)
    const amount = body?.amount; // Legacy: still accept direct amount
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

    // Load the lead first (needed for validation)
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

    // Run lazy finalization to ensure auction status is up-to-date
    const { lead: finalizedLead } = await finalizeAuctionStatus(lead, supabaseAdmin);

    // Validate auction is enabled
    if (!finalizedLead.auction_enabled) {
      return NextResponse.json(
        { error: "Auction is not enabled for this lead" },
        { status: 400 }
      );
    }

    // Check if auction has started (must check auction_start_at)
    if (finalizedLead.auction_start_at) {
      const startAt = new Date(finalizedLead.auction_start_at);
      const now = new Date();
      if (now < startAt) {
        return NextResponse.json(
          { error: "Auction has not opened yet." },
          { status: 400 }
        );
      }
    }

    // Validate auction status
    if (finalizedLead.auction_status !== 'open') {
      if (finalizedLead.auction_status === 'scheduled') {
        return NextResponse.json(
          { error: "Auction has not opened yet." },
          { status: 400 }
        );
      }
      if (finalizedLead.auction_status === 'closed') {
        return NextResponse.json(
          { error: "Auction has closed." },
          { status: 400 }
        );
      }
    }

    // Check if auction has ended (even if status hasn't been updated yet)
    if (finalizedLead.auction_end_at) {
      const endAt = new Date(finalizedLead.auction_end_at);
      const now = new Date();
      if (now >= endAt) {
        // Auction has ended - reject bid and update status if needed
        if (finalizedLead.auction_status === 'open') {
          // Update to closed (finalization will handle winner assignment)
          await finalizeAuctionStatus(finalizedLead, supabaseAdmin);
        }
        return NextResponse.json(
          { error: "Auction has closed." },
          { status: 400 }
        );
      }
    }

    // Validate lead is available (not purchased/assigned)
    if (finalizedLead.status === "purchased_by_agent" || finalizedLead.assigned_agent_id) {
      return NextResponse.json(
        { error: "Lead is no longer available for bidding" },
        { status: 400 }
      );
    }

    // Calculate bid amount
    const startingBid = finalizedLead.starting_bid || 10;
    const minIncrement = finalizedLead.min_increment || 5;
    const currentBid = finalizedLead.current_bid_amount || null;
    const effectiveCurrent = currentBid || startingBid;

    let bidAmount: number;
    if (increment !== undefined) {
      // New: use increment
      bidAmount = effectiveCurrent + Number(increment);
    } else if (amount !== undefined) {
      // Legacy: use direct amount
      bidAmount = Number(amount);
    } else {
      return NextResponse.json(
        { error: "Either 'increment' or 'amount' is required" },
        { status: 400 }
      );
    }

    // Validate bid amount
    const validation = validateBidAmount(bidAmount, currentBid, startingBid, minIncrement);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Insert bid and update lead (we'll do this in sequence since Supabase doesn't support transactions easily)
    const { data: insertedBid, error: bidInsertError } = await supabaseAdmin
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

    // Update lead with new current bid and rolling 30-minute window
    const timezone = finalizedLead.auction_timezone || 'America/Edmonton';
    const newAuctionEnd = calculateNewAuctionEnd(timezone);
    const now = new Date().toISOString();

    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        current_bid_amount: bidAmount,
        current_bid_agent_id: agentId,
        winning_agent_id: agentId, // Set winning agent on each bid
        auction_end_at: newAuctionEnd, // Rolling 30-minute window
        auction_status: 'open', // Ensure status is open
        last_bid_at: now, // Track when last bid was placed
      })
      .eq("id", leadId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Lead update error", updateError);
      // Try to rollback the bid insert (optional, but good practice)
      await supabaseAdmin.from("lead_bids").delete().eq("id", insertedBid.id);
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lead: updatedLead,
      bid: insertedBid,
    });
  } catch (err: any) {
    console.error("Bid error", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong placing bid" },
      { status: 500 }
    );
  }
}

