// lib/auctionTiming.ts
// Helper functions for computing auction end times based on business rules

export const MARKET_OPEN_HOUR = 8;  // 8:00 local
export const MARKET_CLOSE_HOUR = 19; // 7pm, for future use

/**
 * Returns a Date for the next market open (8:00) in the local timezone of `now`
 * Guards against invalid dates
 */
export function getNextMarketOpen(now: Date): Date {
  if (isNaN(now.getTime())) {
    // If invalid date, return a safe default (tomorrow 8am)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(MARKET_OPEN_HOUR, 0, 0, 0);
    return tomorrow;
  }

  const openToday = new Date(now);
  openToday.setHours(MARKET_OPEN_HOUR, 0, 0, 0);

  if (now < openToday) {
    // still before 8am today
    return openToday;
  }

  // already past today's open, use tomorrow 8am
  const openTomorrow = new Date(now);
  openTomorrow.setDate(openTomorrow.getDate() + 1);
  openTomorrow.setHours(MARKET_OPEN_HOUR, 0, 0, 0);
  return openTomorrow;
}

/**
 * Computes a new auction_ends_at based on business rules:
 * - bidding allowed now (24/7)
 * - earliest win is 30 minutes after max(now, nextMarketOpen)
 * Returns ISO string, or null if date calculation fails
 */
export function computeAuctionEndsAt(now: Date): string | null {
  try {
    if (isNaN(now.getTime())) {
      console.error("Invalid date passed to computeAuctionEndsAt");
      return null;
    }

    const nextOpen = getNextMarketOpen(now);
    
    // Ensure nextOpen is valid
    if (isNaN(nextOpen.getTime())) {
      console.error("Invalid nextOpen date");
      return null;
    }

    // Base time is the later of now or next market open
    const base = now > nextOpen ? now : nextOpen;
    
    // Add 30 minutes
    const end = new Date(base.getTime() + 30 * 60 * 1000);
    
    // Validate the result
    if (isNaN(end.getTime())) {
      console.error("Invalid end date calculated");
      return null;
    }

    return end.toISOString();
  } catch (error) {
    console.error("Error in computeAuctionEndsAt:", error);
    return null;
  }
}

