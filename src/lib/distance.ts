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
 * Returns false if coordinates are missing (strict filtering when location is set)
 */
export function isWithinRadius(
  agentLat: number | null,
  agentLon: number | null,
  leadLat: number | null,
  leadLon: number | null,
  radiusKm: number
): boolean {
  // If agent location is set, we require both agent and lead coordinates
  if (agentLat && agentLon) {
    // If lead coordinates are missing, exclude the lead (strict filtering)
    if (!leadLat || !leadLon) {
      return false;
    }
    // Calculate distance and check if within radius
    const distance = calculateDistance(agentLat, agentLon, leadLat, leadLon);
    return distance <= radiusKm;
  }
  
  // If agent location is not set, show all leads (no filtering)
  return true;
}

