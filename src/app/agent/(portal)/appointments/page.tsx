'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import AvailableAppointments from './AvailableAppointments';

type LeadSummary = {
  id: string;
  city: string | null;
  province: string | null;
  age: number | null;
  service_type: string | null;
  urgency_level: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  lead_id: string;
  price_cents: number | null;
  price: number | null;
  is_discounted: boolean;
  is_hidden: boolean;
  leads: LeadSummary | null;
};

export default function AgentAppointmentsPage() {
  useRequireRole('agent');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);

      try {
        // Fetch available appointments (pending, unassigned, not hidden) with lead info
        const { data, error: fetchError } = await supabaseClient
          .from('appointments')
          .select(`
            id,
            requested_date,
            requested_window,
            status,
            lead_id,
            price_cents,
            price,
            is_discounted,
            is_hidden,
            leads (
              id,
              city,
              province,
              age,
              service_type,
              urgency_level
            )
          `)
          .eq('status', 'pending')
          .eq('is_hidden', false)
          .is('agent_id', null)
          .order('created_at', { ascending: true });

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

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-normal text-[#2a2a2a]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Available Appointments
        </h1>
        <p className="text-sm text-[#6b6b6b]">
          Claim planning call appointments with families who have requested a consultation.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#6b6b6b]">Loading appointments…</p>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <AvailableAppointments appointments={appointments} />
      )}
    </div>
  );
}

