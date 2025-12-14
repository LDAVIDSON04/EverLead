'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Home, Users, FileText, Settings, User, CheckCircle, XCircle } from 'lucide-react';

type AdminLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: '/admin/dashboard', label: 'Home', icon: Home },
  { href: '/admin/agent-approval', label: 'Agent Approval', icon: CheckCircle },
  { href: '/admin/leads', label: 'Leads', icon: FileText },
  { href: '/admin/specialists', label: 'Specialists', icon: Users },
  { href: '#', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
          router.push('/agent');
          return;
        }

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || profile.role !== 'admin') {
          router.push('/agent');
          return;
        }

        setUserName(profile.full_name || 'Admin');
        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/agent');
      }
    }

    checkAuth();
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-black flex flex-col">
        {/* Logo - Top Left */}
        <div className="px-4 py-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
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
                (item.href === '/admin/dashboard' && pathname?.startsWith('/admin/dashboard'));
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
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm">{userName}</div>
              <div className="text-white/60 text-xs">Admin</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-white text-xs"
              title="Logout"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

