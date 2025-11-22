// src/app/api/leads/[leadId]/bid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_TZ = 'America/Vancouver'; // Business hours timezone

export async function POST(req: NextRequest, context: any): Promise<Response> {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // Parse request body to get agentId (client sends it)
    const body = await req.json().catch(() => null);
    const increment = body?.increment;
    const amount = body?.amount;
    const agentId = body?.agentId;

    if (!agentId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in and try again." },
        { status: 401 }
      );
    }


    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", agentId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
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
      console.error("Lead error:", leadError);
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

    // Check auction status - reject if ended
    if (lead.auction_status === 'ended') {
      return NextResponse.json(
        { error: "Auction has ended" },
        { status: 400 }
      );
    }

    // Check if auction has ended by time (even if status hasn't been updated yet)
    if (lead.auction_ends_at) {
      const endAt = new Date(lead.auction_ends_at);
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

        // Update to ended
        await supabaseAdmin
          .from('leads')
          .update({
            auction_status: 'ended',
            winning_agent_id: winningAgentId,
          })
          .eq('id', leadId);

        return NextResponse.json(
          { error: "Auction has ended" },
          { status: 400 }
        );
      }
    }

    // Check if scheduled auction has started
    if (lead.auction_status === 'scheduled') {
      if (lead.auction_starts_at) {
        const startAt = new Date(lead.auction_starts_at);
        const now = new Date();
        if (now < startAt) {
          return NextResponse.json(
            { error: "Auction has not opened yet" },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Auction has not opened yet" },
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
    if (bidAmount < effectiveCurrent + minIncrement) {
      return NextResponse.json(
        { error: `Bid must be at least $${(effectiveCurrent + minIncrement).toFixed(2)} (current: $${effectiveCurrent.toFixed(2)}, minimum increment: $${minIncrement})` },
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
      console.error("Bid insert error:", bidInsertError);
      return NextResponse.json(
        { error: "Failed to place bid", details: bidInsertError.message },
        { status: 500 }
      );
    }

    // Determine if this is the first bid (auction_ends_at is null)
    const isFirstBid = !lead.auction_ends_at;
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Calculate new auction end time (30 minutes from now)
    // This resets the 30-minute window on every bid
    const newAuctionEnd = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const updateData: any = {
      current_bid_amount: bidAmount,
      current_bid_agent_id: agentId,
      winning_agent_id: agentId, // Set winning agent on each bid
      auction_ends_at: newAuctionEnd, // Set/reset 30-minute window
    };

    // If this is the first bid, also set auction_starts_at and ensure status is 'open'
    if (isFirstBid) {
      updateData.auction_starts_at = nowISO;
      updateData.auction_status = 'open';
    } else {
      // Ensure status is open for subsequent bids
      if (lead.auction_status === 'scheduled') {
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
      console.error("Lead update error - full details:", {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        updateData,
        leadId,
      });
      
      // Try to rollback the bid insert
      try {
        await supabaseAdmin.from("lead_bids").delete().eq("id", insertedBid.id);
      } catch (rollbackError) {
        console.error("Failed to rollback bid:", rollbackError);
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update lead",
          details: updateError.message || "Database update failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      lead: updatedLead,
      bid: insertedBid,
    });
  } catch (err: any) {
    console.error("Bid error - unexpected:", err);
    return NextResponse.json(
      { error: err.message || "Something went wrong placing bid" },
      { status: 500 }
    );
  }
}
