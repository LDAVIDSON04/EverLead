/**
 * City-based color coding for appointments
 * Uses exact colors from the design: cyan, amber, orange variants
 */

const cityColors = [
  'bg-cyan-200',   // Light cyan
  'bg-amber-200',  // Light amber
  'bg-orange-200', // Light orange
  'bg-cyan-100',   // Lighter cyan
  'bg-amber-100',  // Lighter amber
  'bg-orange-100', // Lighter orange
];

/**
 * Get a consistent color for a city based on its name
 * External events always return gray
 */
export function getCityColor(location: string | null | undefined, isExternal?: boolean): string {
  // External events are always gray (more visible)
  if (isExternal) {
    return 'bg-slate-200';
  }

  // If no location or N/A, use a more visible light blue-gray
  if (!location || location === 'N/A' || location === 'External Calendar' || location.trim() === '') {
    return 'bg-slate-200'; // More visible than gray-100
  }

  // Extract city name (remove province if present, e.g., "Vancouver, BC" -> "Vancouver")
  const cityName = location.split(',')[0].trim().toLowerCase();
  
  // If city name is empty after extraction, return a visible color
  if (!cityName || cityName === '') {
    return 'bg-slate-200';
  }

  // Simple hash function to get consistent color per city
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Return color based on hash
  return cityColors[Math.abs(hash) % cityColors.length];
}

