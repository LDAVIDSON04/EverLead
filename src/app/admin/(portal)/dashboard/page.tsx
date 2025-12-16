"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // (portal) is a route group; the public path omits it.
    router.replace("/admin/agent-approval");
  }, [router]);

  return (
    <div className="p-8">
      <p className="text-sm text-neutral-600">Redirecting...</p>
    </div>
  );
}
