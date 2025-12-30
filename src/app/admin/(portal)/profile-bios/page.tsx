"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileBiosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified approvals page
    router.replace('/admin/agent-approval');
  }, [router]);

  return (
    <div className="p-8">
      <p className="text-sm text-neutral-600">Redirecting to Approvals page...</p>
    </div>
  );
}
