import { supabaseAdmin } from '@/lib/supabaseAdmin';
import MyAppointmentsClient from './MyAppointmentsClient';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export default async function MyAppointmentsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">My Appointments</h1>
        <p className="text-sm text-red-600">Server configuration error.</p>
      </div>
    );
  }

  // Get user from cookies using Supabase client
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Create Supabase client with cookie-based auth
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          // Try to find the cookie
          const cookie = cookieStore.get(key);
          if (cookie) return cookie.value;
          
          // Try common Supabase cookie patterns
          for (const c of allCookies) {
            if (c.name.includes(key) || key.includes(c.name)) {
              return c.value;
            }
          }
          return null;
        },
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">My Appointments</h1>
        <p className="text-sm text-gray-600">You must be logged in as an agent.</p>
      </div>
    );
  }

  const agentId = user.id;

  // Use admin client to bypass RLS for agent's own appointments
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id,
      requested_date,
      requested_window,
      status,
      leads (
        id,
        full_name,
        email,
        phone,
        city,
        province,
        service_type
      )
    `)
    .eq('agent_id', agentId)
    .order('requested_date', { ascending: true });

  if (error) {
    console.error(error);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">My Appointments</h1>
        <p className="text-sm text-red-600">
          Error loading your appointments. Please try again later.
        </p>
      </div>
    );
  }

  const appointments = (data || []) as any[];

  // Transform leads data (comes as array from Supabase join)
  const transformed = appointments.map((item: any) => ({
    ...item,
    leads: Array.isArray(item.leads) ? item.leads[0] || null : item.leads || null,
  }));

  const total = transformed.length;
  const completed = transformed.filter((a: any) => a.status === 'completed').length;
  const noShow = transformed.filter((a: any) => a.status === 'no_show').length;

  return (
    <div className="p-6">
      <MyAppointmentsClient
        appointments={transformed}
        stats={{ total, completed, noShow }}
      />
    </div>
  );
}
