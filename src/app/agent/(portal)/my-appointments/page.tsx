'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { useRouter } from 'next/navigation';

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

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  function formatTimeWindow(window: string) {
    return window.charAt(0).toUpperCase() + window.slice(1);
  }

  function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getDisplayName(lead: LeadInfo | null) {
    if (!lead) return 'Client';
    if (lead.full_name) return lead.full_name;
    if (lead.first_name || lead.last_name) {
      return [lead.first_name, lead.last_name].filter(Boolean).join(' ');
    }
    return 'Client';
  }

  function formatServiceType(service: string | null) {
    if (!service) return 'N/A';
    if (service === 'cremation') return 'Cremation';
    if (service === 'burial') return 'Burial';
    if (service === 'unsure') return 'Unsure';
    return service;
  }

  function formatUrgency(urgency: string | null) {
    if (!urgency) return 'Unknown';
    const lower = urgency.toLowerCase();
    if (lower === 'hot') return 'Hot';
    if (lower === 'warm') return 'Warm';
    if (lower === 'cold') return 'Cold';
    return urgency;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-normal text-[#2a2a2a]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          My Appointments
        </h1>
        <p className="text-sm text-[#6b6b6b]">
          View your booked appointments with full contact information.
        </p>
      </div>

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
        <div className="space-y-4">
          {appointments.map((appt) => {
            const lead = appt.leads;
            const displayName = getDisplayName(lead);
            const location = lead
              ? `${lead.city || ''}${lead.city && lead.province ? ', ' : ''}${lead.province || ''}`
              : 'Location not specified';

            return (
              <div
                key={appt.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4">
                  {/* Header with date/time and status */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#2a2a2a] mb-1">
                        {displayName}
                      </h3>
                      <p className="text-sm text-[#6b6b6b]">
                        {formatDate(appt.requested_date)} • {formatTimeWindow(appt.requested_window)}
                      </p>
                    </div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        appt.status === 'booked'
                          ? 'bg-blue-100 text-blue-900'
                          : appt.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-900'
                          : appt.status === 'completed'
                          ? 'bg-slate-100 text-slate-900'
                          : appt.status === 'cancelled'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {formatStatus(appt.status)}
                    </span>
                  </div>

                  {/* Contact Information */}
                  <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                        Email
                      </p>
                      {lead?.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-sm text-[#2a2a2a] hover:underline break-all"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        <p className="text-sm text-[#6b6b6b]">Not provided</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                        Phone
                      </p>
                      {lead?.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-sm text-[#2a2a2a] hover:underline"
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-[#6b6b6b]">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* Lead Details */}
                  <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                        Location
                      </p>
                      <p className="text-sm text-[#2a2a2a]">{location}</p>
                    </div>
                    {lead?.age && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                          Age
                        </p>
                        <p className="text-sm text-[#2a2a2a]">{lead.age}</p>
                      </div>
                    )}
                    {lead?.service_type && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                          Service Type
                        </p>
                        <p className="text-sm text-[#2a2a2a]">
                          {formatServiceType(lead.service_type)}
                        </p>
                      </div>
                    )}
                    {lead?.urgency_level && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                          Urgency
                        </p>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            lead.urgency_level === 'hot'
                              ? 'bg-red-100 text-red-900'
                              : lead.urgency_level === 'warm'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {formatUrgency(lead.urgency_level)}
                        </span>
                      </div>
                    )}
                    {lead?.planning_for && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-1">
                          Planning For
                        </p>
                        <p className="text-sm text-[#2a2a2a]">{lead.planning_for}</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  {lead?.additional_notes && (
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b] mb-2">
                        Additional Notes
                      </p>
                      <p className="text-sm text-[#2a2a2a] whitespace-pre-wrap">
                        {lead.additional_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

