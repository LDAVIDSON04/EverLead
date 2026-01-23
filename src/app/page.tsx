// Server component
import HomePageClient from "./page-client";

export default function HomePage() {
  // Pre-fill location with Penticton
  return <HomePageClient initialLocation="Penticton" />;
}
