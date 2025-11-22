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
 * Uses America/Vancouver timezone for business hours (8:00-19:00)
 */
export function calculateAuctionTiming(createdAt: Date | string): AuctionTiming {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date(created);
  
  // Use BC time for now
  const tz = 'America/Vancouver';
  
  // Get "now" in that timezone
  const nowZonedStr = now.toLocaleString('en-CA', { timeZone: tz });
  const nowZoned = new Date(nowZonedStr);
  
  const BUSINESS_OPEN_HOUR = 8;  // 8:00 AM
  const BUSINESS_CLOSE_HOUR = 19; // 7:00 PM
  
  const year = nowZoned.getFullYear();
  const month = nowZoned.getMonth();
  const day = nowZoned.getDate();
  
  const openToday = new Date(year, month, day, BUSINESS_OPEN_HOUR, 0, 0, 0);
  const closeToday = new Date(year, month, day, BUSINESS_CLOSE_HOUR, 0, 0, 0);
  
  let auctionStartsAt: Date;
  
  if (nowZoned < openToday) {
    // Before 8am → start at 8am today
    auctionStartsAt = openToday;
  } else if (nowZoned >= closeToday) {
    // After 7pm → start at 8am tomorrow
    const tomorrow = new Date(year, month, day + 1, BUSINESS_OPEN_HOUR, 0, 0, 0);
    auctionStartsAt = tomorrow;
  } else {
    // During business hours → start immediately
    auctionStartsAt = nowZoned;
  }
  
  // 30-minute auction window
  const auctionEndsAt = new Date(auctionStartsAt.getTime() + 30 * 60 * 1000);
  
  // Convert to UTC ISO strings for storage
  // We need to create UTC dates that represent the Vancouver time
  // The dates we created (auctionStartsAt, auctionEndsAt) are in local JS timezone
  // but represent Vancouver time. We need to convert them to UTC.
  
  // Use Intl.DateTimeFormat to get the proper UTC representation
  // Create a date string in ISO format that represents Vancouver time
  const startYear = auctionStartsAt.getFullYear();
  const startMonth = auctionStartsAt.getMonth();
  const startDay = auctionStartsAt.getDate();
  const startHour = auctionStartsAt.getHours();
  const startMinute = auctionStartsAt.getMinutes();
  
  // Create a date string representing Vancouver time
  const vancouverDateStr = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
  
  // To convert Vancouver time to UTC, we need to calculate the offset
  // Use a sample UTC date to calculate the offset for Vancouver at this date
  const sampleUTC = new Date(Date.UTC(startYear, startMonth, startDay, 12, 0, 0, 0));
  const vancouverTimeStr = sampleUTC.toLocaleString('en-US', { timeZone: tz, hour12: false });
  const vancouverTimeDate = new Date(vancouverTimeStr);
  const offsetMs = sampleUTC.getTime() - vancouverTimeDate.getTime();
  
  // Create UTC date that represents Vancouver time
  const utcStartsAt = new Date(Date.UTC(startYear, startMonth, startDay, startHour, startMinute, 0));
  const auctionStartsAtUTC = new Date(utcStartsAt.getTime() - offsetMs);
  const auctionEndsAtUTC = new Date(auctionStartsAtUTC.getTime() + 30 * 60 * 1000);
  
  const isBusinessHours = nowZoned >= openToday && nowZoned < closeToday;
  
  return {
    auction_status: isBusinessHours ? 'open' : 'scheduled',
    auction_starts_at: auctionStartsAtUTC.toISOString(),
    auction_ends_at: auctionEndsAtUTC.toISOString(),
  };
}
