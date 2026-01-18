// Server component - renders critical LCP content immediately
import { HomeHero } from "./components/HomeHero";
import HomePageClient from "./page-client";

export default function HomePage() {
  // Location field is left blank - users will type their city manually
  return (
    <>
      {/* Critical LCP content - server rendered for instant display */}
      <HomeHero />
      {/* Interactive components - client rendered */}
      <HomePageClient initialLocation="" />
    </>
  );
}
