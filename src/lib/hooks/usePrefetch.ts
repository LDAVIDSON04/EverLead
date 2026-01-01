import { useRef } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

type PrefetchMap = {
  [key: string]: (userId: string, token: string) => Promise<void>; // route -> prefetch function
};

// Map of routes to their prefetch functions
const routePrefetchMap: PrefetchMap = {
  '/agent/dashboard': async (userId: string, token: string) => {
    // Prefetch dashboard data
    fetch(`/api/agent/dashboard?agentId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
  '/agent/schedule': async (userId: string, token: string) => {
    // Prefetch schedule data
    fetch('/api/specialists/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
  '/agent/my-appointments': async (userId: string, token: string) => {
    // Prefetch appointments
    fetch('/api/appointments/mine', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
  '/agent/billing': async (userId: string, token: string) => {
    // Prefetch billing data
    fetch('/api/agent/settings/billing', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
  '/agent/availability': async (userId: string, token: string) => {
    // Prefetch availability data
    fetch('/api/agents/availability', {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },
};

export function usePrefetchOnHover(href: string) {
  const prefetchedRef = useRef(false);

  const handleMouseEnter = async () => {
    // Only prefetch once per mount
    if (prefetchedRef.current) return;

    const prefetchFn = routePrefetchMap[href];
    if (!prefetchFn) return;

    // Don't prefetch if we're already on this page
    if (typeof window !== 'undefined' && window.location.pathname === href) {
      return;
    }

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token || !session.user) return;

      prefetchedRef.current = true;

      // Prefetch the API data
      await prefetchFn(session.user.id, session.access_token);
    } catch (error) {
      // Silently fail - prefetch is optional
    }
  };

  return handleMouseEnter;
}

