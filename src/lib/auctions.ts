// src/lib/auctions.ts
// Auction scheduling and finalization logic

const DEFAULT_TZ = 'America/Vancouver'; // Business hours timezone

export type AuctionStatus = 'open' | 'scheduled' | 'ended';

export interface AuctionTiming {
  auction_status: AuctionStatus;
  auction_starts_at: string | null;
  auction_ends_at: string | null;
}

/**
 * Calculate auction timing for a new lead based on creation time
 * Returns timing fields that should be set when creating a lead
 */
export function calculateAuctionTiming(createdAt: Date | string): AuctionTiming {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date(created);
  
  // Get local time in business hours timezone
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TZ }));
  const hour = localTime.getHours();
  
  // Business hours: 8:00-19:00 (8am-7pm)
  const isBusinessHours = hour >= 8 && hour < 19;
  
  if (isBusinessHours) {
    // Within business hours - auction starts immediately
    return {
      auction_status: 'open',
      auction_starts_at: now.toISOString(),
      auction_ends_at: null, // Will be set to NOW() + 30 minutes on first bid
    };
  } else {
    // Outside business hours - schedule for next 8:00 AM
    const next8am = new Date(localTime);
    if (hour >= 19) {
      // After 7pm, schedule for next day 8am
      next8am.setDate(next8am.getDate() + 1);
    }
    next8am.setHours(8, 0, 0, 0);
    
    // Convert back to UTC for storage
    const next8amUTC = new Date(next8am.toLocaleString('en-US', { timeZone: 'UTC' }));
    const auctionEndsAt = new Date(next8amUTC.getTime() + 30 * 60 * 1000); // +30 minutes
    
    return {
      auction_status: 'scheduled',
      auction_starts_at: next8amUTC.toISOString(),
      auction_ends_at: auctionEndsAt.toISOString(),
    };
  }
}
