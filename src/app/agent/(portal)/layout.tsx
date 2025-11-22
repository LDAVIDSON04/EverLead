'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import clsx from 'clsx';

type AgentLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: '/agent/dashboard', label: 'Dashboard' },
  { href: '/agent/leads/available', label: 'Available leads' },
  { href: '/agent/leads/mine', label: 'My leads' },
  { href: '/agent/leads/purchased', label: 'Purchased' },
];

export default function AgentLayout({ children }: AgentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

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

      <main className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-10">
        <div className="w-full">
          {/* Horizontal tab navigation at top of content */}
          <nav className="border-b border-gray-200 mb-6">
            <ul className="flex gap-8 text-sm">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      className={clsx(
                        'pb-3 inline-block',
                        isActive
                          ? 'border-b-2 border-gray-900 font-semibold text-gray-900'
                          : 'text-gray-500 hover:text-gray-900'
                      )}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Page content */}
          {children}
        </div>
      </main>
    </div>
  );
}
