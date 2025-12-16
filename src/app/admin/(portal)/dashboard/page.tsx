"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/(portal)/agent-approval");
  }, [router]);

  return (
    <div className="p-8">
      <p className="text-sm text-neutral-600">Redirecting...</p>
    </div>
  );
}
