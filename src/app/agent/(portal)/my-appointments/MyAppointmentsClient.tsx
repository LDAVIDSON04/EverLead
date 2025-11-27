'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

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

export default function MyAppointmentsClient({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Compare dates only, not times

  const upcoming = appointments.filter((a) => {
    const appointmentDate = new Date(a.requested_date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate >= now;
  });

  const past = appointments.filter((a) => {
    const appointmentDate = new Date(a.requested_date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < now;
  });

  async function updateStatus(id: string, status: 'completed' | 'no_show') {
    setLoadingId(id);
    setError(null);

    try {
      // Get current user (agent)
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        setError('You must be logged in to update appointments.');
        setLoadingId(null);
        return;
      }

      const res = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status, agentId: user.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update appointment');
      }

      // Reload to reflect updated status
      window.location.reload();
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

  function formatTimeWindow(window: string) {
    return window.charAt(0).toUpperCase() + window.slice(1);
  }

  function formatStatus(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
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

  function renderAppointment(appt: Appointment) {
    const lead = appt.leads;
    const displayName = getDisplayName(lead);
    const location = lead
      ? `${lead.city || ''}${lead.city && lead.province ? ', ' : ''}${lead.province || ''}`
      : 'Location not specified';

    const isPast = new Date(appt.requested_date) < now;
    const canUpdateStatus = appt.status === 'booked' || appt.status === 'pending';

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
                  : appt.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-900'
                  : appt.status === 'no_show'
                  ? 'bg-red-100 text-red-900'
                  : appt.status === 'confirmed'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-900'
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

          {/* Status Update Buttons - only show for booked/pending appointments */}
          {canUpdateStatus && (
            <div className="border-t border-slate-200 pt-4 flex gap-3">
              <button
                onClick={() => updateStatus(appt.id, 'completed')}
                disabled={loadingId === appt.id}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {loadingId === appt.id ? 'Saving…' : 'Mark as Completed'}
              </button>
              <button
                onClick={() => updateStatus(appt.id, 'no_show')}
                disabled={loadingId === appt.id}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {loadingId === appt.id ? 'Saving…' : 'Mark as No-show'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
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

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upcoming Appointments */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#2a2a2a]">Upcoming</h2>
        {!upcoming.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6b6b6b]">No upcoming appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">{upcoming.map((appt) => renderAppointment(appt))}</div>
        )}
      </section>

      {/* Past Appointments */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#2a2a2a]">Past</h2>
        {!past.length ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6b6b6b]">No past appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">{past.map((appt) => renderAppointment(appt))}</div>
        )}
      </section>
    </div>
  );
}

