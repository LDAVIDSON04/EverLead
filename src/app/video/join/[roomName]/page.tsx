// Video link preview page with Open Graph tags for rich SMS previews
// This page redirects to the actual video room but provides meta tags for link previews

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ identity?: string; role?: string }>;
}

function pickParam(params: Record<string, string | string[] | undefined>, ...keyNames: string[]): string | undefined {
  for (const key of keyNames) {
    const v = params[key];
    if (v != null) return Array.isArray(v) ? v[0] : v;
  }
  const want = keyNames.map((k) => k.toLowerCase());
  for (const [k, v] of Object.entries(params)) {
    if (v != null && want.includes(k.toLowerCase())) return Array.isArray(v) ? v[0] : v;
  }
  return undefined;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { roomName } = await params;
  const raw = await searchParams;
  const paramsObj = (raw && typeof raw === "object" ? raw : {}) as Record<string, string | string[] | undefined>;
  const identity = pickParam(paramsObj, "identity", "Identity");
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.soradin.com";
  const displayName = identity || "Participant";
  
  return {
    title: "Join Video Meeting - Soradin",
    description: `Join your video call appointment with ${displayName}`,
    openGraph: {
      title: "Join Meeting",
      description: `Join your video call appointment with ${displayName}`,
      url: `${siteUrl}/video/join/${roomName}${identity ? `?identity=${encodeURIComponent(identity)}` : ""}`,
      siteName: "Soradin",
      images: [
        {
          url: `${siteUrl}/Soradin.png`, // Your logo
          width: 1200,
          height: 630,
          alt: "Soradin Logo",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Join Meeting",
      description: `Join your video call appointment with ${displayName}`,
      images: [`${siteUrl}/Soradin.png`],
    },
  };
}

export default async function VideoJoinPage({ params, searchParams }: PageProps) {
  const { roomName } = await params;
  const raw = await searchParams;
  const paramsObj = (raw && typeof raw === "object" ? raw : {}) as Record<string, string | string[] | undefined>;
  const identity = pickParam(paramsObj, "identity", "Identity");
  const role = pickParam(paramsObj, "role", "Role");
  
  if (!roomName) {
    notFound();
  }
  
  // Redirect to the actual video room, forwarding identity and role (lowercase so room page and API get them)
  const query = new URLSearchParams();
  if (identity) query.set("identity", identity);
  if (role) query.set("role", role);
  const qs = query.toString();
  const videoUrl = `/video/${roomName}${qs ? `?${qs}` : ""}`;
  redirect(videoUrl);
}
