/** Home & province landing pages: city grids + SEO (no Quebec cities on national grid). */

export const VALID_PROVINCE_CODES = ["BC", "AB", "SK", "MB", "ON"] as const;
export type ProvinceCode = (typeof VALID_PROVINCE_CODES)[number];
export type HomeRegion = "national" | ProvinceCode;

/** 16 major Canadian cities, no Quebec. Order: BC → AB → SK → MB → ON → NS; cities A→Z within each province. */
export const CANADA_16_CITIES = [
  "Kelowna, BC",
  "Vancouver, BC",
  "Victoria, BC",
  "Calgary, AB",
  "Edmonton, AB",
  "Regina, SK",
  "Saskatoon, SK",
  "Winnipeg, MB",
  "Hamilton, ON",
  "Kitchener, ON",
  "London, ON",
  "Mississauga, ON",
  "Ottawa, ON",
  "Toronto, ON",
  "Windsor, ON",
  "Halifax, NS",
] as const;

const BC_CITIES = [
  "Abbotsford, BC",
  "Burnaby, BC",
  "Chilliwack, BC",
  "Kamloops, BC",
  "Kelowna, BC",
  "Nanaimo, BC",
  "Penticton, BC",
  "Prince George, BC",
  "Richmond, BC",
  "Surrey, BC",
  "Vancouver, BC",
  "Victoria, BC",
];

const AB_CITIES = [
  "Calgary, AB",
  "Edmonton, AB",
  "Fort McMurray, AB",
  "Grande Prairie, AB",
  "Lethbridge, AB",
  "Medicine Hat, AB",
  "Red Deer, AB",
  "St. Albert, AB",
];

const SK_CITIES = ["Regina, SK", "Saskatoon, SK"];

const MB_CITIES = ["Brandon, MB", "Steinbach, MB", "Winnipeg, MB"];

const ON_CITIES = [
  "Barrie, ON",
  "Brampton, ON",
  "Hamilton, ON",
  "Kingston, ON",
  "Kitchener, ON",
  "London, ON",
  "Mississauga, ON",
  "Oshawa, ON",
  "Ottawa, ON",
  "St. Catharines, ON",
  "Thunder Bay, ON",
  "Toronto, ON",
  "Waterloo, ON",
  "Windsor, ON",
];

const PROVINCE_GRID: Record<ProvinceCode, readonly string[]> = {
  BC: BC_CITIES,
  AB: AB_CITIES,
  SK: SK_CITIES,
  MB: MB_CITIES,
  ON: ON_CITIES,
};

const PROVINCE_LABEL: Record<ProvinceCode, string> = {
  BC: "British Columbia",
  AB: "Alberta",
  SK: "Saskatchewan",
  MB: "Manitoba",
  ON: "Ontario",
};

export function getHomeGridCities(region: HomeRegion): string[] {
  if (region === "national") return [...CANADA_16_CITIES];
  return [...PROVINCE_GRID[region]];
}

export function getProvinceSeo(code: ProvinceCode): { title: string; description: string } {
  const name = PROVINCE_LABEL[code];
  return {
    title: `Find estate planning professionals in ${name} | Soradin`,
    description: `Browse estate planning professionals in ${name}. Book online and read reviews on Soradin.`,
  };
}

export const HOME_SEO = {
  title: "Find estate planning professionals near you | Soradin",
  description:
    "Book appointments with trusted estate planning professionals across Canada. Compare specialists and read reviews on Soradin.",
} as const;

export function isValidProvinceParam(s: string | undefined): s is ProvinceCode {
  if (!s) return false;
  const u = s.toUpperCase();
  return (VALID_PROVINCE_CODES as readonly string[]).includes(u);
}
