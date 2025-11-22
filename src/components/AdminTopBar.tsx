// src/components/AdminTopBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export function AdminTopBar() {
  const router = useRouter();

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.push("/");
  }

  return (
    <header className="border-b border-[#ded3c2] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-[#2a2a2a]">
            Soradin
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b6b6b]">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#6b6b6b]">Owner view</span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-[#ded3c2] bg-white px-3 py-1 text-xs font-medium text-[#6b6b6b] hover:bg-[#f7f4ef] transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

