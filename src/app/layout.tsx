// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import BotIdClientWrapper from "@/components/BotIdClientWrapper";

export const metadata: Metadata = {
  title: "Soradin - Thoughtful funeral pre-planning, made simple",
  description: "Soradin helps families plan funeral wishes in advance and connect with trusted local professionals without pressure or urgency.",
  icons: {
    icon: [
      { url: '/Soradin.png', sizes: '192x192', type: 'image/png' },
      { url: '/Soradin.png', sizes: '512x512', type: 'image/png' },
      { url: '/Soradin.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: '/Soradin.png',
  },
  openGraph: {
    title: "Soradin - Thoughtful funeral pre-planning, made simple",
    description: "Soradin helps families plan funeral wishes in advance and connect with trusted local professionals without pressure or urgency.",
    images: [
      {
        url: '/Soradin.png',
        width: 1024,
        height: 1024,
        alt: 'Soradin Logo',
      },
    ],
    type: 'website',
    siteName: 'Soradin',
  },
  twitter: {
    card: 'summary',
    title: "Soradin - Thoughtful funeral pre-planning, made simple",
    description: "Soradin helps families plan funeral wishes in advance and connect with trusted local professionals without pressure or urgency.",
    images: ['/Soradin.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data for Google Knowledge Panel and logo in search results
  // Use www.soradin.com to avoid redirects (soradin.com redirects to www.soradin.com)
  // Google requires: Logo minimum 112x112px, square, multiples of 48px for favicon
  // Logo URL must be directly accessible and crawlable by Googlebot-Image
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Soradin",
    "url": "https://www.soradin.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.soradin.com/Soradin.png",
      "width": 1024,
      "height": 1024,
      "contentUrl": "https://www.soradin.com/Soradin.png",
      "encodingFormat": "image/png"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://www.soradin.com/Soradin.png",
      "width": 1024,
      "height": 1024
    },
    "description": "Soradin helps families plan funeral wishes in advance and connect with trusted local professionals without pressure or urgency.",
    "email": "support@soradin.com",
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61583953961107"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@soradin.com",
      "contactType": "Customer Service"
    }
  };

  return (
    <html lang="en">
      <head>
        <BotIdClientWrapper />
        {/* Explicit favicon links for Google Search results - must be square and multiples of 48px */}
        {/* Google requires: minimum 112x112px, square format, multiples of 48px (192x192, 512x512, etc.) */}
        <link rel="icon" type="image/png" sizes="192x192" href="https://www.soradin.com/Soradin.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="https://www.soradin.com/Soradin.png" />
        <link rel="icon" type="image/png" sizes="1024x1024" href="https://www.soradin.com/Soradin.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://www.soradin.com/Soradin.png" />
        {/* Canonical favicon for maximum compatibility */}
        <link rel="icon" type="image/png" href="https://www.soradin.com/Soradin.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        {/* Defer analytics to improve initial render performance */}
        <DeferredAnalytics />
      </body>
    </html>
  );
}
