import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePageClient from "../page-client";
import {
  getProvinceSeo,
  isValidProvinceParam,
  type ProvinceCode,
  VALID_PROVINCE_CODES,
} from "@/lib/homeRegionContent";

type Props = { params: Promise<{ province: string }> };

export function generateStaticParams(): { province: ProvinceCode }[] {
  return VALID_PROVINCE_CODES.map((province) => ({ province }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province: raw } = await params;
  if (!isValidProvinceParam(raw)) {
    return { title: "Soradin" };
  }
  const code = raw.toUpperCase() as ProvinceCode;
  const seo = getProvinceSeo(code);
  const canonical = `https://www.soradin.com/${code}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      type: "website",
      siteName: "Soradin",
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function ProvinceHomePage({ params }: Props) {
  const { province: raw } = await params;
  if (!isValidProvinceParam(raw)) notFound();
  const region = raw.toUpperCase() as ProvinceCode;
  return <HomePageClient initialLocation="" region={region} />;
}
