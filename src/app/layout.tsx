// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Soradin | Gentle funeral pre-planning, online.",
  description: "Soradin helps families thoughtfully plan funeral wishes in advance and connects them with trusted local professionals when they're ready.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
