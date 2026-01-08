/**
 * Normalize Canadian city names to correct spellings
 * This ensures consistency across the system and prevents mismatches
 * due to common misspellings or variations
 */

const CITY_CORRECTIONS: Record<string, string> = {
  // Common misspellings
  'vaughn': 'Vaughan',
  'vaughon': 'Vaughan',
  // Add more corrections as needed
};

/**
 * Normalize a city name to its correct spelling
 * @param cityName - The city name to normalize
 * @returns The correctly spelled city name
 */
export function normalizeCityName(cityName: string | null | undefined): string {
  if (!cityName) return '';
  
  const trimmed = cityName.trim();
  if (!trimmed) return '';
  
  // Check if it's in our corrections map (case-insensitive)
  const lowerKey = trimmed.toLowerCase();
  if (CITY_CORRECTIONS[lowerKey]) {
    return CITY_CORRECTIONS[lowerKey];
  }
  
  // Return the original city name (capitalized properly)
  // Capitalize first letter of each word
  return trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if two city names refer to the same city (handles variations)
 * @param city1 - First city name
 * @param city2 - Second city name
 * @returns true if they refer to the same city
 */
export function isSameCity(city1: string, city2: string): boolean {
  const norm1 = normalizeCityName(city1).toLowerCase();
  const norm2 = normalizeCityName(city2).toLowerCase();
  
  return norm1 === norm2;
}
