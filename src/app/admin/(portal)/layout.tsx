'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { CheckCircle, Users, Calendar, DollarSign, User, XCircle } from 'lucide-react';

type AdminLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: '/admin/(portal)/agent-approval', label: 'Approvals', icon: CheckCircle },
  { href: '/admin/(portal)/specialists', label: 'Specialists', icon: Users },
  { href: '/admin/(portal)/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/(portal)/payments', label: 'Payments', icon: DollarSign },
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-neutral-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - matching design folder */}
      <aside className="w-64 bg-black text-white flex flex-col">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-neutral-800">
          <Link href="/admin/(portal)/agent-approval" className="block">
            <h1 className="text-2xl tracking-tight text-white">Soradin</h1>
            <p className="text-sm text-neutral-400 mt-1">Admin Portal</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-emerald-700 text-white' 
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-sm text-white">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-white">{userName || 'Admin User'}</p>
              <p className="text-xs text-neutral-400">admin@soradin.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}

