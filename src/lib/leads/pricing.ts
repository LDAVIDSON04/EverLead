/**
 * Lead pricing helper
 * Fixed prices based on urgency level
 */

export function getLeadPriceFromUrgency(urgency: string | null | undefined): number {
  if (!urgency) {
    return 10; // Default to COLD price
  }

  switch (urgency.toUpperCase()) {
    case "HOT":
      return 35;
    case "WARM":
      return 20;
    case "COLD":
    default:
      return 10;
  }
}

/**
 * Get price in cents (for Stripe)
 */
export function getLeadPriceCentsFromUrgency(urgency: string | null | undefined): number {
  return getLeadPriceFromUrgency(urgency) * 100;
}

