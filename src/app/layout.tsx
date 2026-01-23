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
  metadataBase: new URL('https://www.soradin.com'),
  title: "Soradin - Thoughtful funeral pre-planning, made simple",
  description: "Soradin removes friction by giving families a simple way to view an agent's availability and book a meeting directly online in just a few minutes.",
  alternates: {
    canonical: 'https://www.soradin.com/',
  },
  openGraph: {
    title: "Soradin - Thoughtful funeral pre-planning, made simple",
    description: "Soradin removes friction by giving families a simple way to view an agent's availability and book a meeting directly online in just a few minutes.",
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
    description: "Soradin removes friction by giving families a simple way to view an agent's availability and book a meeting directly online in just a few minutes.",
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
    "description": "Soradin removes friction by giving families a simple way to view an agent's availability and book a meeting directly online in just a few minutes.",
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
        {/* Resource hints for faster loading - moved to top for earlier connection */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Explicit canonical URL - ensure Google uses www version */}
        <link rel="canonical" href="https://www.soradin.com/" />
        {/* Favicon links for Google Search results - 48x48 is required for search snippets */}
        {/* Using relative URLs so favicon works on both www and non-www domains */}
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Soradin.png" />
        <link rel="shortcut icon" href="/favicon-48.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Google tag (gtag.js) - defer loading to not block render */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17787677639"></script>
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17787677639', {
                'send_page_view': false
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* BotIdClient must be in body - client components cannot be in head */}
        <BotIdClient protect={protectedRoutes} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
