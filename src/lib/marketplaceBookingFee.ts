/**
 * Fee (CAD cents) charged to the agent when a client books via the marketplace (/api/agents/book).
 * Set to 0 for free bookings (no Stripe charge).
 */
export const MARKETPLACE_BOOKING_FEE_CENTS = 0;

export function marketplaceBookingFeeDollars(): number {
  return MARKETPLACE_BOOKING_FEE_CENTS / 100;
}
