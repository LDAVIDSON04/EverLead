// lib/auctionTiming.ts
// Helper functions for computing auction timing based on business rules

export const MARKET_OPEN_HOUR = 8;  // 8:00 local
export const MARKET_CLOSE_HOUR = 19; // 7pm

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
 * Calculates auction_starts_at based on business hours:
 * - If created between 08:00 and 19:00: auction_starts_at = now
 * - If created after 19:00 or before 08:00: auction_starts_at = next day at 08:00
 * Returns ISO string or null if calculation fails
 */
export function calculateAuctionStartsAt(now: Date): string | null {
  try {
    if (isNaN(now.getTime())) {
      console.error("Invalid date passed to calculateAuctionStartsAt");
      return null;
    }

    const hour = now.getHours();
    
    // If created between 08:00 and 19:00, start immediately
    if (hour >= MARKET_OPEN_HOUR && hour < MARKET_CLOSE_HOUR) {
      return now.toISOString();
    }
    
    // Otherwise, start at next 08:00
    const nextOpen = getNextMarketOpen(now);
    if (isNaN(nextOpen.getTime())) {
      console.error("Invalid nextOpen date");
      return null;
    }
    
    return nextOpen.toISOString();
  } catch (error) {
    console.error("Error in calculateAuctionStartsAt:", error);
    return null;
  }
}

/**
 * Computes auction_ends_at when creating a lead:
 * auction_ends_at = auction_starts_at + 30 minutes
 * Returns ISO string or null if calculation fails
 */
export function calculateInitialAuctionEndsAt(auctionStartsAt: string): string | null {
  try {
    const startsAt = new Date(auctionStartsAt);
    if (isNaN(startsAt.getTime())) {
      console.error("Invalid auction_starts_at in calculateInitialAuctionEndsAt");
      return null;
    }
    
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    if (isNaN(endsAt.getTime())) {
      console.error("Invalid end date calculated");
      return null;
    }
    
    return endsAt.toISOString();
  } catch (error) {
    console.error("Error in calculateInitialAuctionEndsAt:", error);
    return null;
  }
}

/**
 * Computes a new auction_ends_at when placing a bid:
 * - If now < auction_starts_at: returns auction_starts_at + 30 minutes (don't move earlier)
 * - If now >= auction_starts_at: returns now + 30 minutes (rolling soft close)
 * Returns ISO string, or null if date calculation fails
 */
export function computeAuctionEndsAtOnBid(
  now: Date,
  auctionStartsAt: string | null
): string | null {
  try {
    if (isNaN(now.getTime())) {
      console.error("Invalid date passed to computeAuctionEndsAtOnBid");
      return null;
    }

    // If no auction_starts_at, use next market open as base
    if (!auctionStartsAt) {
      const nextOpen = getNextMarketOpen(now);
      if (isNaN(nextOpen.getTime())) {
        console.error("Invalid nextOpen date");
        return null;
      }
      const endsAt = new Date(nextOpen.getTime() + 30 * 60 * 1000);
      if (isNaN(endsAt.getTime())) {
        console.error("Invalid end date calculated");
        return null;
      }
      return endsAt.toISOString();
    }

    const startsAt = new Date(auctionStartsAt);
    if (isNaN(startsAt.getTime())) {
      console.error("Invalid auction_starts_at in computeAuctionEndsAtOnBid");
      return null;
    }

    // If now < auction_starts_at, don't move auction_ends_at earlier than starts_at + 30min
    if (now < startsAt) {
      const earliestEnd = new Date(startsAt.getTime() + 30 * 60 * 1000);
      if (isNaN(earliestEnd.getTime())) {
        console.error("Invalid earliest end date");
        return null;
      }
      return earliestEnd.toISOString();
    }

    // If now >= auction_starts_at, set to now + 30 minutes (rolling soft close)
    const endsAt = new Date(now.getTime() + 30 * 60 * 1000);
    if (isNaN(endsAt.getTime())) {
      console.error("Invalid end date calculated");
      return null;
    }

    return endsAt.toISOString();
  } catch (error) {
    console.error("Error in computeAuctionEndsAtOnBid:", error);
    return null;
  }
}

