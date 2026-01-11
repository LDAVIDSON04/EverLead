"use client";

import HomePageClient from "./page-client";

export default function HomePage() {
  // Pure client component - no server-side overhead
  return <HomePageClient initialLocation="" />;
}
