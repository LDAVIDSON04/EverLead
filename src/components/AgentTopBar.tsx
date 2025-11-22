// src/components/AgentTopBar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { AgentNav } from "@/components/AgentNav";

export function AgentTopBar() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.push("/");
  }

  return (
    <>
      {/* Top bar */}
      <header className="border-b border-[#ded3c2] bg-[#1f2933] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-white">
              Soradin
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              Agent Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-xs text-[#e0d5bf]">{userEmail}</span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md border border-[#e5d7b5] bg-transparent px-3 py-1 text-[11px] font-medium text-[#e0d5bf] hover:bg-white/10 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Agent nav */}
      <AgentNav />
    </>
  );
}

