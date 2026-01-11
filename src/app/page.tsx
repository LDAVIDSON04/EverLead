// Server component to get location server-side and pass as prop
import { headers } from "next/headers";
import HomePageClient from "./page-client";

export default async function HomePage() {
  // Get location from Vercel headers (server-side, no API call needed)
  const headersList = await headers();
  const vercelCity = headersList.get("x-vercel-ip-city");
  const vercelRegion = headersList.get("x-vercel-ip-country-region");

  let initialLocation = "";

  // Map Canadian provinces to standard abbreviations
  const provinceMap: Record<string, string> = {
    "Alberta": "AB",
    "British Columbia": "BC",
    "Manitoba": "MB",
    "New Brunswick": "NB",
    "Newfoundland and Labrador": "NL",
    "Northwest Territories": "NT",
    "Nova Scotia": "NS",
    "Nunavut": "NU",
    "Ontario": "ON",
    "Prince Edward Island": "PE",
    "Quebec": "QC",
    "Saskatchewan": "SK",
    "Yukon": "YT",
  };

  if (vercelCity && vercelRegion) {
    const province = provinceMap[vercelRegion] || vercelRegion;
    initialLocation = `${vercelCity}, ${province}`;
  }

  return <HomePageClient initialLocation={initialLocation} />;
}
