"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Script from "next/script";

// Profession slug (from step3) -> display label and search "q" value for /search
const OTHER_PROFESSIONS: { slug: "funeral" | "lawyer" | "financial" | "insurance"; label: string; searchQ: string }[] = [
  { slug: "funeral", label: "Funeral / pre-need specialist", searchQ: "Pre-need planning" },
  { slug: "lawyer", label: "Estate Lawyer", searchQ: "Estate lawyer" },
  { slug: "financial", label: "Financial Advisor", searchQ: "Financial advisor" },
  { slug: "insurance", label: "Insurance Agent", searchQ: "Insurance agent" },
];

function buildSearchUrl(
  searchQ: string,
  location: string | null,
  mode: string | null
): string {
  const params = new URLSearchParams();
  params.set("q", searchQ);
  if (location && location.trim()) params.set("location", location.trim());
  if (mode === "video" || mode === "in-person") params.set("mode", mode);
  return `/search?${params.toString()}`;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const email = searchParams.get("email");
  const location = searchParams.get("location") || "";
  const mode = searchParams.get("mode") || "in-person";
  const profession = (searchParams.get("profession") || "funeral") as "funeral" | "lawyer" | "financial" | "insurance";

  const otherProfessions = OTHER_PROFESSIONS.filter((p) => p.slug !== profession);

  // Google Ads conversion tracking - fire immediately when gtag is available
  useEffect(() => {
    // Fire conversion event as soon as gtag is available
    const fireConversion = () => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17787677639/HmFXCPu0tOYbEMfX6aFC',
          'value': 1.0,
          'currency': 'CAD'
        });
      }
    };

    // Try immediately
    fireConversion();
    
    // Also try after a short delay in case gtag loads after this component
    const timeout = setTimeout(fireConversion, 100);
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-[#1A1A1A]/10 overflow-hidden">
          <div className="pt-10 pb-6 px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1A1A1A] text-white mb-6 shadow-md">
              <CheckCircle className="w-12 h-12" strokeWidth={2} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
              Appointment Confirmed!
            </h1>
            <p className="text-[#1A1A1A]/70 text-base mb-6">
              Your appointment has been successfully booked.
              {email && (
                <span className="block mt-2 text-sm text-[#1A1A1A]/60">
                  A confirmation email has been sent to <strong className="text-[#1A1A1A]/80">{email}</strong>.
                </span>
              )}
            </p>
          </div>

          {otherProfessions.length > 0 && (
            <div className="px-6 pb-6">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-3 px-1">
                Would you also like to meet with:
              </p>
              <div className="space-y-2">
                {otherProfessions.map((p) => (
                  <Link
                    key={p.slug}
                    href={buildSearchUrl(p.searchQ, location || null, mode || null)}
                    className="block w-full bg-[#FAF9F6] border-2 border-[#1A1A1A]/15 text-[#1A1A1A] py-3 px-4 rounded-xl font-semibold hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-200 text-center"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-8 pt-2">
            <Link
              href="/"
              className="block w-full bg-[#1A1A1A] text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-[#1A1A1A]/90 transition-colors text-center shadow-sm"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <>
      {/* Google Ads conversion event snippet - fires immediately when page loads */}
      <Script
        id="google-ads-conversion"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window.gtag) {
              gtag('event', 'conversion', {
                'send_to': 'AW-17787677639/HmFXCPu0tOYbEMfX6aFC',
                'value': 1.0,
                'currency': 'CAD'
              });
            }
          `,
        }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <p className="text-[#1A1A1A]/60">Loading...</p>
        </div>
      }>
        <BookingSuccessContent />
      </Suspense>
    </>
  );
}
