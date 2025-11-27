'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

type LeadSummary = {
  id: string;
  city: string | null;
  province: string | null;
  age: number | null;
  service_type: string | null;
  urgency_level: string | null;
  region: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: string;
  lead_id: string;
  leads: LeadSummary | null;
};

export default function AvailableAppointments({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(id: string) {
    setLoadingId(id);
    setError(null);

    try {
      // Get current user (agent)
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        setError('You must be logged in to purchase appointments.');
        setLoadingId(null);
        return;
      }

      const agentId = user.id;

      // Create Stripe checkout session
      const res = await fetch('/api/appointments/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, agentId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start checkout');
      }

      const { url } = await res.json();

      if (!url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoadingId(null);
    }
  }

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

  function formatUrgency(urgency: string | null) {
    if (!urgency) return 'Unknown';
    const lower = urgency.toLowerCase();
    if (lower === 'hot') return 'Hot';
    if (lower === 'warm') return 'Warm';
    if (lower === 'cold') return 'Cold';
    return urgency;
  }

  function formatServiceType(service: string | null) {
    if (!service) return 'N/A';
    if (service === 'cremation') return 'Cremation';
    if (service === 'burial') return 'Burial';
    if (service === 'unsure') return 'Unsure';
    return service;
  }

  if (!appointments.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6b6b6b]">
          No available appointments right now. Check back later for new appointment requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {appointments.map((appt) => {
        const lead = appt.leads;
        const location = lead
          ? `${lead.city || ''}${lead.city && lead.province ? ', ' : ''}${lead.province || ''}`
          : 'Location not specified';

        return (
          <div
            key={appt.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-[#2a2a2a]">
                    {formatDate(appt.requested_date)}
                  </p>
                  <span className="text-xs text-[#6b6b6b]">
                    {appt.requested_window.charAt(0).toUpperCase() +
                      appt.requested_window.slice(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  {lead?.region && (
                    <p className="text-xs text-[#6b6b6b]">
                      <strong>Region:</strong> <span className="capitalize">{lead.region}</span>
                    </p>
                  )}
                  <p className="text-xs text-[#6b6b6b]">
                    <strong>Location:</strong> {location}
                  </p>
                  {lead?.age && (
                    <p className="text-xs text-[#6b6b6b]">
                      <strong>Age:</strong> {lead.age}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {lead?.service_type && (
                      <p className="text-xs text-[#6b6b6b]">
                        <strong>Service:</strong> {formatServiceType(lead.service_type)}
                      </p>
                    )}
                    {lead?.urgency_level && (
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
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBuy(appt.id)}
                disabled={loadingId === appt.id}
                className="rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                {loadingId === appt.id ? 'Processing…' : 'Buy Appointment – $39'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

