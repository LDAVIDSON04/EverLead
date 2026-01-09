// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BotIdClient } from 'botid/client';

// Protected routes that need bot protection
const protectedRoutes = [
  {
    path: '/api/appointments/buy',
    method: 'POST',
  },
  {
    path: '/api/appointments/confirm',
    method: 'POST',
  },
  {
    path: '/api/checkout',
    method: 'POST',
  },
  {
    path: '/api/checkout/confirm',
    method: 'POST',
  },
  {
    path: '/api/agent/leads/confirm-purchase',
    method: 'POST',
  },
  {
    path: '/api/agent/signup',
    method: 'POST',
  },
  {
    path: '/api/agent/forgot-password',
    method: 'POST',
  },
  {
    path: '/api/leads/create',
    method: 'POST',
  },
];

export const metadata: Metadata = {
  title: "Soradin - Thoughtful funeral pre-planning, made simple",
  description: "Soradin helps families plan funeral wishes in advance and connect with trusted local professionals without pressure or urgency.",
  icons: {
    icon: [
      { url: '/Soradin.png', sizes: 'any' },
      { url: '/Soradin.png', type: 'image/png' },
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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Soradin",
    "url": "https://www.soradin.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.soradin.com/Soradin.png",
      "width": 1024,
      "height": 1024
    },
    "image": "https://www.soradin.com/Soradin.png",
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
        <BotIdClient protect={protectedRoutes} />
        {/* Favicon is handled by Next.js via app/icon.png - no need for manual links */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
