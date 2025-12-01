'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import clsx from 'clsx';

type AgentLayoutProps = {
  children: ReactNode;
};

const tabs = [
  { href: '/agent/dashboard', label: 'Home' },
  { href: '/agent/appointments', label: 'Buy Appointments' },
  { href: '/agent/my-appointments', label: 'My Appointments' },
  { href: '/agent/dashboard#roi', label: 'Performance' },
];

export default function AgentLayout({ children }: AgentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

  useEffect(() => {
    async function checkApproval() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/agent');
          return;
        }

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role, approval_status')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || profile.role !== 'agent') {
          router.push('/agent');
          return;
        }

        if (profile.approval_status !== 'approved') {
          setApprovalStatus(profile.approval_status || 'pending');
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking approval:', error);
        router.push('/agent');
      }
    }

    checkApproval();
  }, [router]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/agent'); // send back to the agent landing/login
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-sm text-[#6b6b6b]">Loading...</p>
      </div>
    );
  }

  if (approvalStatus && approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-amber-900">Account Pending Approval</h2>
            <p className="mb-4 text-sm text-amber-800">
              {approvalStatus === 'pending' 
                ? "Your account is currently pending approval. Our team will review your application and you will receive an email notification once your account has been approved."
                : approvalStatus === 'declined'
                ? "Your account application has been declined. If you believe this is an error, please contact support."
                : "Your account status is being reviewed. Please check your email for updates."}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                // Handle active state: both Home and Performance are on /agent/dashboard
                const isActive = pathname === tab.href || 
                  (tab.href === '/agent/dashboard#roi' && pathname === '/agent/dashboard');
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
