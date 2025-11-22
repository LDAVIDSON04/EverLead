// src/lib/auctions.ts
// Auction scheduling and finalization logic

import { DateTime } from 'luxon';
import { getTimezoneForLead } from './timezone';

export type AuctionStatus = 'pending' | 'open' | 'ended';

export interface AuctionSchedule {
  auction_start_at: string | null;
  auction_end_at: string | null;
  auction_status: AuctionStatus;
  auction_timezone: string;
  starting_bid: number;
  min_increment: number;
  buy_now_price: number;
}

/**
 * Calculate auction schedule for a new lead based on creation time and timezone
 */
export function calculateAuctionSchedule(
  createdAt: Date | string,
  lead: { province?: string | null; country?: string | null }
): AuctionSchedule {
  const timezone = getTimezoneForLead(lead);
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const localTime = DateTime.fromJSDate(created, { zone: timezone });

  const marketOpen = localTime.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
  const marketClose = localTime.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });

  let auction_start_at: DateTime;
  let auction_status: AuctionStatus;

  // Check if within operating hours (08:00 - 19:00)
  if (localTime >= marketOpen && localTime < marketClose) {
    // Auction can start immediately, but status is 'open' only after first bid
    auction_start_at = localTime;
    auction_status = 'open'; // Will be set to 'open' when first bid is placed
  } else {
    // Schedule for next 8am
    if (localTime < marketOpen) {
      // Same day 8am
      auction_start_at = marketOpen;
    } else {
      // Next day 8am
      auction_start_at = marketOpen.plus({ days: 1 });
    }
    auction_status = 'pending';
  }

  // auction_ends_at is NULL until first bid is placed
  // It will be set to NOW() + 30 minutes when the first bid is made

  return {
    auction_start_at: auction_start_at.toISO(),
    auction_end_at: null, // Set to NULL - will be set on first bid
    auction_status,
    auction_timezone: timezone,
    starting_bid: 10,
    min_increment: 5,
    buy_now_price: 50,
  };
}

/**
 * Lazy finalization: check and update auction status based on current time
 * This should be called before returning lead data to ensure consistency
 */
export async function finalizeAuctionStatus(
  lead: any,
  supabaseAdmin: any
): Promise<{ updated: boolean; lead: any }> {
  if (!lead.auction_enabled || !lead.auction_status) {
    return { updated: false, lead };
  }

  const now = DateTime.now();
  const timezone = lead.auction_timezone || 'America/Edmonton';
  let updated = false;
  let updatedLead = { ...lead };

  // Transition from 'pending' to 'open' when auction_start_at is reached
  if (lead.auction_status === 'pending' && lead.auction_start_at) {
    const startAt = DateTime.fromISO(lead.auction_start_at, { zone: timezone });
    if (now >= startAt) {
      // Auction can now accept bids, but stays 'pending' until first bid
      // Status will be set to 'open' when first bid is placed
      // No status change here - just allow bids to proceed
    }
  }

  // Transition from 'open' to 'ended' when auction_end_at is reached
  if (lead.auction_status === 'open' && lead.auction_end_at) {
    const endAt = DateTime.fromISO(lead.auction_end_at, { zone: timezone });
    if (now >= endAt) {
      // Auction has ended
      updatedLead.auction_status = 'ended';
      updated = true;
    }
  }

  // If we made updates, persist them
  if (updated) {
    const { data: savedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        auction_status: updatedLead.auction_status,
        winning_agent_id: updatedLead.winning_agent_id || null,
        assigned_agent_id: updatedLead.assigned_agent_id || null,
        status: updatedLead.status || lead.status,
        current_bid_amount: updatedLead.current_bid_amount || lead.current_bid_amount,
        notification_sent_at: updatedLead.notification_sent_at || lead.notification_sent_at,
      })
      .eq('id', lead.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lead during finalization:', updateError);
      return { updated: false, lead };
    }

    return { updated: true, lead: savedLead };
  }

  return { updated: false, lead };
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

/**
 * Calculate new auction end time (rolling 30-minute window)
 */
export function calculateNewAuctionEnd(timezone: string): string {
  const iso = DateTime.now().setZone(timezone).plus({ minutes: 30 }).toISO();
  if (!iso) {
    throw new Error(`Failed to calculate auction end time for timezone: ${timezone}`);
  }
  return iso;
}

