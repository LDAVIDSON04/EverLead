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
  
  // Get server's local time (app server timezone)
  const serverTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nowInServerTZ = new Date(now.toLocaleString('en-US', { timeZone: serverTZ }));
  const hour = nowInServerTZ.getHours();
  
  // Business hours: 8:00-19:00 (8am-7pm) in server's local time
  const isBusinessHours = hour >= 8 && hour < 19;
  
  if (isBusinessHours) {
    // Within business hours - auction starts immediately
    const auctionEndsAt = new Date(now.getTime() + 30 * 60 * 1000); // +30 minutes
    return {
      auction_status: 'open',
      auction_starts_at: now.toISOString(),
      auction_ends_at: auctionEndsAt.toISOString(),
    };
  } else {
    // Outside business hours - schedule for next 8:00 AM in server timezone
    const next8amDate = new Date(nowInServerTZ);
    
    if (hour >= 19) {
      // After 7pm, schedule for next day 8am
      next8amDate.setDate(next8amDate.getDate() + 1);
    }
    // If before 8am, schedule for today 8am (no date change needed)
    next8amDate.setHours(8, 0, 0, 0);
    
    // Convert the local 8am time to UTC for storage
    // We need to create a date that represents 8am in server timezone
    const year = next8amDate.getFullYear();
    const month = next8amDate.getMonth();
    const day = next8amDate.getDate();
    
    // Create a date string in server timezone format, then parse it
    // This ensures we get the correct UTC representation
    const local8amStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T08:00:00`;
    
    // Parse as if it's in server timezone, then convert to UTC
    // Use a simpler approach: create date in local time, then adjust for UTC
    const local8am = new Date(year, month, day, 8, 0, 0, 0);
    const offset = local8am.getTimezoneOffset() * 60 * 1000;
    const auctionStartsAt = new Date(local8am.getTime() - offset).toISOString();
    const auctionEndsAt = new Date(new Date(auctionStartsAt).getTime() + 30 * 60 * 1000).toISOString();
    
    return {
      auction_status: 'scheduled',
      auction_starts_at: auctionStartsAt,
      auction_ends_at: auctionEndsAt,
    };
  }
}
