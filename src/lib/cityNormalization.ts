/**
 * Normalize Canadian city names to correct spellings
 * This ensures consistency across the system and prevents mismatches
 * due to common misspellings or variations
 */

/**
 * Common Canadian city name corrections
 * Maps misspellings/variations to correct spellings
 */
const CITY_CORRECTIONS: Record<string, string> = {
  // Ontario
  'vaughn': 'Vaughan',
  'vaughon': 'Vaughan',
  'toronto': 'Toronto',
  'ottawa': 'Ottawa',
  'hamilton': 'Hamilton',
  'london': 'London',
  'mississauga': 'Mississauga',
  'markham': 'Markham',
  'brampton': 'Brampton',
  'windsor': 'Windsor',
  'kitchener': 'Kitchener',
  'waterloo': 'Waterloo',
  'oakville': 'Oakville',
  'burlington': 'Burlington',
  'richmond hill': 'Richmond Hill',
  'greater sudbury': 'Greater Sudbury',
  'oshawa': 'Oshawa',
  'barrie': 'Barrie',
  'st. catharines': 'St. Catharines',
  'guelph': 'Guelph',
  'cambridge': 'Cambridge',
  
  // British Columbia
  'vancouver': 'Vancouver',
  'victoria': 'Victoria',
  'surrey': 'Surrey',
  'burnaby': 'Burnaby',
  'richmond': 'Richmond',
  'langley': 'Langley',
  'coquitlam': 'Coquitlam',
  'abbotsford': 'Abbotsford',
  'kelowna': 'Kelowna',
  'penticton': 'Penticton',
  'west kelowna': 'West Kelowna',
  'summerland': 'Summerland',
  'salmon arm': 'Salmon Arm',
  'vernon': 'Vernon',
  'kamloops': 'Kamloops',
  'nanaimo': 'Nanaimo',
  'prince george': 'Prince George',
  
  // Alberta
  'calgary': 'Calgary',
  'edmonton': 'Edmonton',
  'red deer': 'Red Deer',
  'lethbridge': 'Lethbridge',
  'medicine hat': 'Medicine Hat',
  'grande prairie': 'Grande Prairie',
  
  // Quebec
  'montreal': 'Montreal',
  'quebec city': 'Quebec City',
  'laval': 'Laval',
  'gatineau': 'Gatineau',
  'longueuil': 'Longueuil',
  
  // Manitoba
  'winnipeg': 'Winnipeg',
  
  // Saskatchewan
  'saskatoon': 'Saskatoon',
  'regina': 'Regina',
  
  // Nova Scotia
  'halifax': 'Halifax',
  
  // New Brunswick
  'saint john': 'Saint John',
  'moncton': 'Moncton',
  
  // Newfoundland and Labrador
  'st. john\'s': 'St. John\'s',
  'st johns': 'St. John\'s',
  
  // Prince Edward Island
  'charlottetown': 'Charlottetown',
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
