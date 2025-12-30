"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page with billing tab
    router.replace("/agent/settings?tab=billing");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-sm text-gray-600">Redirecting to billing settings...</p>
    </div>
  );
}

