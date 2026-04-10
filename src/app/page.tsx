// Server component
import type { Metadata } from "next";
import HomePageClient from "./page-client";
import { HOME_SEO } from "@/lib/homeRegionContent";

export const metadata: Metadata = {
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  alternates: { canonical: "https://www.soradin.com/" },
  openGraph: {
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    url: "https://www.soradin.com/",
    type: "website",
    siteName: "Soradin",
  },
  twitter: {
    card: "summary",
    title: HOME_SEO.title,
    description: HOME_SEO.description,
  },
};

export default function HomePage() {
  return <HomePageClient initialLocation="" region="national" />;
}
