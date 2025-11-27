'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useRouter } from 'next/navigation';
import MyAppointmentsClient from './MyAppointmentsClient';

type LeadInfo = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  age: number | null;
  service_type: string | null;
  urgency_level: string | null;
  planning_for: string | null;
  additional_notes: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  created_at: string;
  leads: LeadInfo | null;
};

export default function MyAppointmentsPage() {
  useRequireRole('agent');
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);

      try {
        // Get current user (agent)
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
          router.push('/agent');
          return;
        }

        setUserId(user.id);
        const agentId = user.id;

        // Fetch this agent's booked appointments + full lead info
        const { data, error: fetchError } = await supabaseClient
          .from('appointments')
          .select(`
            id,
            requested_date,
            requested_window,
            status,
            created_at,
            leads (
              id,
              full_name,
              first_name,
              last_name,
              email,
              phone,
              city,
              province,
              age,
              service_type,
              urgency_level,
              planning_for,
              additional_notes
            )
          `)
          .eq('agent_id', agentId)
          .order('requested_date', { ascending: true });

        if (fetchError) {
          console.error('Error loading appointments:', fetchError);
          setError('Failed to load your appointments. Please try again later.');
          return;
        }

        // Transform data to match Appointment type (leads comes as array from Supabase join)
        const transformed = (data || []).map((item: any) => ({
          ...item,
          leads: Array.isArray(item.leads) ? item.leads[0] || null : item.leads || null,
        }));

        setAppointments(transformed as Appointment[]);
      } catch (err) {
        console.error('Unexpected error loading appointments:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [router]);

  return (
    <div className="w-full">
      {loading ? (
        <p className="text-sm text-[#6b6b6b]">Loading your appointments…</p>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : !appointments.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-[#6b6b6b]">
            You don&apos;t have any booked appointments yet. Visit{' '}
            <a
              href="/agent/appointments"
              className="text-[#2a2a2a] hover:underline font-medium"
            >
              Available Appointments
            </a>{' '}
            to purchase appointments.
          </p>
        </div>
      ) : (
        <MyAppointmentsClient appointments={appointments} />
      )}
    </div>
  );
}
