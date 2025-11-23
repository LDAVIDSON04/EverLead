// Distance calculation utilities using Haversine formula
// Calculates distance between two points on Earth's surface

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a lead is within the agent's search radius
 */
export function isWithinRadius(
  agentLat: number | null,
  agentLon: number | null,
  leadLat: number | null,
  leadLon: number | null,
  radiusKm: number
): boolean {
  if (!agentLat || !agentLon || !leadLat || !leadLon) {
    return true; // If coordinates are missing, show all leads (fallback)
  }

  const distance = calculateDistance(agentLat, agentLon, leadLat, leadLon);
  return distance <= radiusKm;
}

