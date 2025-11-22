// src/lib/auctions.ts
// Auction scheduling and finalization logic

import { DateTime } from 'luxon';
import { getTimezoneForLead } from './timezone';

export type AuctionStatus = 'scheduled' | 'open' | 'closed';

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
    // Auction starts immediately
    auction_start_at = localTime;
    auction_status = 'open';
  } else {
    // Schedule for next 8am
    if (localTime < marketOpen) {
      // Same day 8am
      auction_start_at = marketOpen;
    } else {
      // Next day 8am
      auction_start_at = marketOpen.plus({ days: 1 });
    }
    auction_status = 'scheduled';
  }

  // Auction end is always 30 minutes after start
  const auction_end_at = auction_start_at.plus({ minutes: 30 });

  return {
    auction_start_at: auction_start_at.toISO(),
    auction_end_at: auction_end_at.toISO(),
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

  // Transition from 'scheduled' to 'open' when auction_start_at is reached
  if (lead.auction_status === 'scheduled' && lead.auction_start_at) {
    const startAt = DateTime.fromISO(lead.auction_start_at, { zone: timezone });
    if (now >= startAt) {
      updatedLead.auction_status = 'open';
      updated = true;

      // Send notifications if not already sent
      if (!lead.notification_sent_at) {
        try {
          // Import here to avoid circular dependencies
          const { notifyAgentsForLead } = await import('./notifyAgentsForLead');
          await notifyAgentsForLead(lead, supabaseAdmin);
          updatedLead.notification_sent_at = now.toISO();
        } catch (err) {
          console.error('Error sending notifications:', err);
          // Continue even if notification fails
        }
      }
    }
  }

  // Transition from 'open' to 'closed' when auction_end_at is reached
  if (lead.auction_status === 'open' && lead.auction_end_at) {
    const endAt = DateTime.fromISO(lead.auction_end_at, { zone: timezone });
    if (now >= endAt) {
      // Find highest bid
      const { data: bids, error: bidsError } = await supabaseAdmin
        .from('lead_bids')
        .select('agent_id, amount')
        .eq('lead_id', lead.id)
        .order('amount', { ascending: false })
        .limit(1);

      if (bidsError) {
        console.error('Error fetching bids for finalization:', bidsError);
      } else if (bids && bids.length > 0) {
        // Highest bidder wins
        const winningBid = bids[0];
        updatedLead.auction_status = 'closed';
        updatedLead.winning_agent_id = winningBid.agent_id;
        // Don't auto-assign - winner needs to purchase
        updatedLead.current_bid_amount = winningBid.amount;
        updated = true;
      } else {
        // No bids - auction closed with no winner
        updatedLead.auction_status = 'closed';
        updated = true;
      }
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

