// src/app/api/leads/[leadId]/bid/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateBidAmount, calculateNewAuctionEnd } from "@/lib/auctions";

export async function POST(req: Request, context: any): Promise<Response> {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json().catch(() => null);
    const increment = body?.increment;
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

    // Validate auction is enabled
    if (!lead.auction_enabled) {
      return NextResponse.json(
        { error: "Auction is not enabled for this lead" },
        { status: 400 }
      );
    }

    // Check auction status
    if (lead.auction_status === 'pending') {
      // Check if release time has passed
      if (lead.after_hours_release_time) {
        const releaseTime = new Date(lead.after_hours_release_time);
        const now = new Date();
        if (now < releaseTime) {
          return NextResponse.json(
            { error: "Auction has not opened yet." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Auction has not opened yet." },
          { status: 400 }
        );
      }
    }

    if (lead.auction_status === 'closed') {
      return NextResponse.json(
        { error: "Auction has ended." },
        { status: 400 }
      );
    }

    // Check if auction has ended by time (even if status hasn't been updated yet)
    if (lead.auction_status === 'open' && lead.auction_end_time) {
      const endAt = new Date(lead.auction_end_time);
      const now = new Date();
      if (now >= endAt) {
        // Find highest bidder
        const { data: bids } = await supabaseAdmin
          .from('lead_bids')
          .select('agent_id, amount')
          .eq('lead_id', leadId)
          .order('amount', { ascending: false })
          .limit(1);

        const winningAgentId = bids && bids.length > 0 ? bids[0].agent_id : null;

        // Update to closed
        await supabaseAdmin
          .from('leads')
          .update({
            auction_status: 'closed',
            winning_agent_id: winningAgentId,
          })
          .eq('id', leadId);

        return NextResponse.json(
          { error: "Auction has ended." },
          { status: 400 }
        );
      }
    }

    // Validate lead is available (not purchased/assigned)
    if (lead.status === "purchased_by_agent" || lead.assigned_agent_id) {
      return NextResponse.json(
        { error: "Lead is no longer available for bidding" },
        { status: 400 }
      );
    }

    // Calculate bid amount
    const startingBid = lead.starting_bid || 10;
    const minIncrement = lead.min_increment || 5;
    const currentBid = lead.current_bid_amount || null;
    const effectiveCurrent = currentBid || startingBid;

    let bidAmount: number;
    if (increment !== undefined) {
      bidAmount = effectiveCurrent + Number(increment);
    } else if (amount !== undefined) {
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

    // Check if this is a higher bid
    if (currentBid && bidAmount <= currentBid) {
      return NextResponse.json(
        { error: `Your bid must be higher than the current bid of $${currentBid.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Insert bid
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

    // Determine if this is the first bid
    const isFirstBid = !lead.current_bid_amount && !lead.auction_start_time;
    const now = new Date().toISOString();
    const newAuctionEnd = calculateNewAuctionEnd();

    const updateData: any = {
      current_bid_amount: bidAmount,
      current_bid_agent_id: agentId,
      winning_agent_id: agentId, // Set winning agent on each bid
      auction_end_time: newAuctionEnd, // Reset 30-minute window
      last_bid_at: now,
    };

    // If this is the first bid, set auction_start_time and ensure status is 'open'
    if (isFirstBid) {
      updateData.auction_start_time = now;
      updateData.auction_status = 'open';
      updateData.auction_end_time = newAuctionEnd;
    } else {
      // Reset the 30-minute window on each bid
      updateData.auction_end_time = newAuctionEnd;
      // Ensure status is open
      if (lead.auction_status === 'pending') {
        updateData.auction_status = 'open';
      }
    }

    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Lead update error", updateError);
      // Try to rollback the bid insert
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
