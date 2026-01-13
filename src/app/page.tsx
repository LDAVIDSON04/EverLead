// Server component
import HomePageClient from "./page-client";

export default function HomePage() {
  // Location field is left blank - users will type their city manually
  return <HomePageClient initialLocation="" />;
}
