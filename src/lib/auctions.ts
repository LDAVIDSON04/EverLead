// src/lib/auctions.ts
// Auction scheduling and finalization logic

import { DateTime } from 'luxon';

const DEFAULT_TZ = 'America/Vancouver';

export type AuctionStatus = 'open' | 'closed' | 'pending';

export interface AuctionTiming {
  auction_status: AuctionStatus;
  auction_start_time: string | null;
  auction_end_time: string | null;
  after_hours_release_time: string | null;
}

/**
 * Calculate auction timing for a new lead based on creation time
 * Returns timing fields that should be set when creating a lead
 */
export function calculateAuctionTiming(createdAt: Date | string): AuctionTiming {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = DateTime.now().setZone(DEFAULT_TZ);
  const localTime = DateTime.fromJSDate(created, { zone: DEFAULT_TZ });

  const marketOpen = localTime.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
  const marketClose = localTime.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });

  // Check if within operating hours (08:00 - 19:00)
  if (localTime >= marketOpen && localTime < marketClose) {
    // Within business hours - auction is open but no timer until first bid
    return {
      auction_status: 'open',
      auction_start_time: null, // Will be set when first bid is placed
      auction_end_time: null, // Will be set when first bid is placed
      after_hours_release_time: null,
    };
  } else {
    // Outside business hours - set to pending with release time
    let releaseTime: DateTime;
    if (localTime < marketOpen) {
      // Before 8am same day
      releaseTime = marketOpen;
    } else {
      // After 7pm - next day 8am
      releaseTime = marketOpen.plus({ days: 1 });
    }

    return {
      auction_status: 'pending',
      auction_start_time: null,
      auction_end_time: null,
      after_hours_release_time: releaseTime.toISO(),
    };
  }
}

/**
 * Normalize pending leads that are ready to open
 * Call this when fetching leads to transition pending -> open
 */
export async function normalizePendingLeads(
  leads: any[],
  supabaseAdmin: any
): Promise<any[]> {
  const now = new Date();

  const updatedLeads = await Promise.all(
    leads.map(async (lead) => {
      // Check if pending lead is ready to open
      if (
        lead.auction_status === 'pending' &&
        lead.after_hours_release_time &&
        new Date(lead.after_hours_release_time) <= now
      ) {
        // Flip it to open
        const { data, error } = await supabaseAdmin
          .from('leads')
          .update({
            auction_status: 'open',
            auction_start_time: null,
            auction_end_time: null,
          })
          .eq('id', lead.id)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      }

      // Check if open auction should be closed
      if (
        lead.auction_status === 'open' &&
        lead.auction_end_time &&
        new Date(lead.auction_end_time) <= now
      ) {
        // Find highest bidder
        const { data: bids } = await supabaseAdmin
          .from('lead_bids')
          .select('agent_id, amount')
          .eq('lead_id', lead.id)
          .order('amount', { ascending: false })
          .limit(1);

        const winningAgentId = bids && bids.length > 0 ? bids[0].agent_id : null;

        const { data, error } = await supabaseAdmin
          .from('leads')
          .update({
            auction_status: 'closed',
            winning_agent_id: winningAgentId,
          })
          .eq('id', lead.id)
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      }

      return lead;
    })
  );

  return updatedLeads;
}

/**
 * Calculate new auction end time (rolling 30-minute window)
 */
export function calculateNewAuctionEnd(): string {
  const iso = DateTime.now().setZone(DEFAULT_TZ).plus({ minutes: 30 }).toISO();
  if (!iso) {
    throw new Error(`Failed to calculate auction end time`);
  }
  return iso;
}

/**
 * Validate bid amount against auction rules
 */
export function validateBidAmount(
  newBid: number,
  currentBid: number | null,
  startingBid: number,
  minIncrement: number
): { valid: boolean; error?: string } {
  const effectiveCurrent = currentBid || startingBid;

  // Must be at least current + increment
  if (newBid < effectiveCurrent + minIncrement) {
    return {
      valid: false,
      error: `Bid must be at least $${effectiveCurrent + minIncrement} (current: $${effectiveCurrent}, minimum increment: $${minIncrement})`,
    };
  }

  // Must be a multiple of increment over starting bid
  const overStarting = newBid - startingBid;
  if (overStarting % minIncrement !== 0) {
    return {
      valid: false,
      error: `Bid must be a multiple of $${minIncrement} over the starting bid of $${startingBid}`,
    };
  }

  return { valid: true };
}
