'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

type AgentLayoutProps = {
  children: ReactNode;
};

export default function AgentLayout({ children }: AgentLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/agent'); // send back to the agent landing/login
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex flex-col">
      <header className="bg-[#1f2933] text-white border-b border-[#ded3c2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <Link href="/agent/dashboard" className="text-lg font-semibold text-white">
              Soradin
            </Link>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#e0d5bf]">
              AGENT PORTAL
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-[#e5d7b5] bg-transparent px-3 py-1 text-[11px] font-medium text-[#e0d5bf] hover:bg-white/10 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
