"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import Script from "next/script";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const email = searchParams.get("email");

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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-neutral-800" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Appointment Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your appointment has been successfully booked.
          {email && (
            <span className="block mt-2">
              A confirmation email has been sent to <strong>{email}</strong>.
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/search"
            className="block w-full bg-neutral-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-900 transition-colors"
          >
            Book Another Appointment
          </Link>
          
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Return to Home
          </Link>
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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }>
        <BookingSuccessContent />
      </Suspense>
    </>
  );
}
