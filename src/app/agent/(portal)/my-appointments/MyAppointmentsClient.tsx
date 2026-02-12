'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabaseClient';

type Lead = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  province?: string | null;
  service_type?: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: 'booked' | 'completed' | 'no_show' | 'pending' | 'confirmed' | 'cancelled';
  leads: Lead | null;
};

type Stats = {
  total: number;
  completed: number;
  noShow: number;
};

export default function MyAppointmentsClient({
  appointments,
  stats,
}: {
  appointments: Appointment[];
  stats: Stats;
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
        throw new Error('You must be logged in to update appointments.');
      }

      const agentId = user.id;

      const res = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId: id, 
          status,
          agentId,
        }),
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

  function getDisplayName(lead: Lead | null) {
    if (!lead) return 'Client';
    if (lead.full_name) return lead.full_name;
    return 'Client';
  }

  function formatServiceType(service: string | null) {
    if (!service) return 'N/A';
    if (service === 'cremation') return 'Cremation';
    if (service === 'burial') return 'Burial';
    if (service === 'unsure') return 'Unsure';
    // Comma-separated questionnaire answers (lawyer, financial, insurance)
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

    const canUpdateStatus = appt.status === 'booked' || appt.status === 'pending';

    return (
      <div
        key={appt.id}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex flex-col gap-4">
          {/* Header with date/time and status */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDate(appt.requested_date)} • {formatTimeWindow(appt.requested_window)}
              </p>
            </div>
            {/* Only show status badge for completed or no_show */}
            {(appt.status === 'completed' || appt.status === 'no_show') && (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  appt.status === 'completed'
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'bg-red-100 text-red-900'
                }`}
              >
                {formatStatus(appt.status)}
              </span>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid gap-3 sm:grid-cols-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
                Email
              </p>
              {lead?.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm text-gray-900 hover:underline break-all"
                >
                  {lead.email}
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not provided</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
                Phone
              </p>
              {lead?.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm text-gray-900 hover:underline"
                >
                  {lead.phone}
                </a>
              ) : (
                <p className="text-sm text-gray-500">Not provided</p>
              )}
            </div>
          </div>

          {/* Lead Details */}
          <div className="grid gap-3 sm:grid-cols-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
                Location
              </p>
              <p className="text-sm text-gray-900">{location}</p>
            </div>
            {lead?.service_type && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">
                  Service Type
                </p>
                <p className="text-sm text-gray-900">
                  {formatServiceType(lead.service_type)}
                </p>
              </div>
            )}
          </div>

          {/* View Details Link */}
          {lead?.id && (
            <div className="border-t border-gray-200 pt-4">
              <Link
                href={`/agent/leads/${lead.id}`}
                className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
              >
                View full lead details →
              </Link>
            </div>
          )}

          {/* Status Update Buttons - only show for booked/pending appointments */}
          {canUpdateStatus && (
            <div className="border-t border-gray-200 pt-4 flex gap-3">
              <button
                onClick={() => updateStatus(appt.id, 'completed')}
                disabled={loadingId === appt.id}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {loadingId === appt.id ? 'Saving…' : 'Mark as Completed'}
              </button>
              <button
                onClick={() => updateStatus(appt.id, 'no_show')}
                disabled={loadingId === appt.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {loadingId === appt.id ? 'Saving…' : 'Mark as No-show'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-lg text-gray-900 mb-1">My Appointments</h3>
        <p className="text-sm text-gray-500 mb-4">
          View your booked appointments with full contact information.
        </p>

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-2xl text-gray-900">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Completion rate</p>
            <p className="text-2xl text-gray-900">{completionRate}%</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upcoming Appointments */}
      <section className="mb-8">
        <h3 className="text-lg text-gray-900 mb-4">Upcoming</h3>
        {!upcoming.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">No upcoming appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">{upcoming.map((appt) => renderAppointment(appt))}</div>
        )}
      </section>

      {/* Past Appointments */}
      <section>
        <h3 className="text-lg text-gray-900 mb-4">Past</h3>
        {!past.length ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">No past appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">{past.map((appt) => renderAppointment(appt))}</div>
        )}
      </section>
    </div>
  );
}

