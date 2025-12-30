"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AvailabilityPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page with calendar tab
    router.replace("/agent/settings?tab=calendar");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-gray-600">Redirecting to availability settings...</p>
    </div>
  );
}

