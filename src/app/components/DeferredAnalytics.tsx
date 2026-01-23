"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Analytics and SpeedInsights with no SSR to reduce initial bundle
const Analytics = dynamic(() => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })), {
  ssr: false,
});

const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })), {
  ssr: false,
});

export default function DeferredAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Defer loading until after page is interactive
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
