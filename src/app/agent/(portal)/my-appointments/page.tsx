'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import MyAppointmentsClient from './MyAppointmentsClient';

type Lead = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  service_type: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: 'booked' | 'completed' | 'no_show' | 'pending' | 'confirmed' | 'cancelled';
  leads: Lead | null;
};

export default function MyAppointmentsPage() {
  useRequireRole('agent');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);

      try {
        // Get current user
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          setError('You must be logged in as an agent.');
          setLoading(false);
          return;
        }

        const agentId = user.id;

        // Fetch appointments assigned to this agent
        const { data, error: fetchError } = await supabaseClient
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

        if (fetchError) {
          console.error('Error loading appointments:', fetchError);
          setError('Failed to load appointments. Please try again later.');
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
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">My Appointments</h1>
        <p className="text-sm text-[#6b6b6b]">Loading appointments…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">My Appointments</h1>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const noShow = appointments.filter((a) => a.status === 'no_show').length;

  return (
    <div className="p-6">
      <MyAppointmentsClient
        appointments={appointments}
        stats={{ total, completed, noShow }}
      />
    </div>
  );
}
