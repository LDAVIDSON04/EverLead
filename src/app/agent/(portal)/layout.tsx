'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Home, Calendar, File, Mail, FileText, User, XCircle } from 'lucide-react';

type AgentLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: '/agent/dashboard', label: 'Home', icon: Home },
  { href: '/agent/schedule', label: 'Schedule', icon: Calendar },
  { href: '/agent/my-appointments', label: 'Files', icon: File },
  { href: '#', label: 'Email', icon: Mail },
  { href: '/agent/dashboard#roi', label: 'Report', icon: FileText },
];

export default function AgentLayout({ children }: AgentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

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
          .select('role, approval_status, full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || profile.role !== 'agent') {
          router.push('/agent');
          return;
        }

        if (profile.approval_status !== 'approved') {
          setApprovalStatus(profile.approval_status || 'pending');
        }

        setUserName(profile.full_name || 'Agent');
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
    router.push('/agent');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (approvalStatus && approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-black flex flex-col">
        {/* Logo - Top Left */}
        <div className="px-4 py-6">
          <Link href="/agent/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
            />
          </Link>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 px-4">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === '/agent/dashboard#roi' && pathname === '/agent/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    isActive 
                      ? 'bg-green-900/30 text-white' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* User Profile */}
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm">{userName}</div>
              <div className="text-white/60 text-xs">Agent</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
