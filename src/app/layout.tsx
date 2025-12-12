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
  title: "Soradin | Gentle funeral pre-planning, online.",
  description: "Soradin helps families thoughtfully plan funeral wishes in advance and connects them with trusted local professionals when they're ready.",
  icons: {
    icon: [
      { url: '/Soradin.png', sizes: 'any' },
      { url: '/Soradin.png', type: 'image/png' },
    ],
    apple: '/Soradin.png',
  },
  openGraph: {
    title: "Soradin | Gentle funeral pre-planning, online.",
    description: "Soradin helps families thoughtfully plan funeral wishes in advance and connects them with trusted local professionals when they're ready.",
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Soradin Logo',
      },
    ],
    type: 'website',
    siteName: 'Soradin',
  },
  twitter: {
    card: 'summary',
    title: "Soradin | Gentle funeral pre-planning, online.",
    description: "Soradin helps families thoughtfully plan funeral wishes in advance and connects them with trusted local professionals when they're ready.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <BotIdClient protect={protectedRoutes} />
        <link rel="icon" href="/Soradin.png" type="image/png" />
        <link rel="shortcut icon" href="/Soradin.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Soradin.png" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
