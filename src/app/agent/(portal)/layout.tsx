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
      <header className="bg-[#111827] text-white border-b border-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex flex-col">
            <Link href="/agent/dashboard" className="font-semibold tracking-tight">
              Soradin
            </Link>
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Agent portal
            </span>
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <Link href="/agent/dashboard" className="hover:text-white/80">
              Dashboard
            </Link>
            <Link href="/agent/leads/available" className="hover:text-white/80">
              Available leads
            </Link>
            <Link href="/agent/leads/mine" className="hover:text-white/80">
              My leads
            </Link>
            <Link href="/agent/leads/purchased" className="hover:text-white/80">
              Purchased
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="ml-4 rounded-full border border-white/25 px-3 py-1 text-xs font-medium hover:bg-white/10 transition"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
