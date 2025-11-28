'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { maskName, maskEmail, maskPhone } from '@/lib/masking';

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
  leads: LeadSummary | null;
};

type FullLead = {
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
  timeline_intent: string | null;
  remains_disposition: string | null;
  service_celebration: string | null;
  family_pre_arranged: string | null;
  additional_notes: string | null;
};

export default function AvailableAppointments({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);
  const [fullLead, setFullLead] = useState<FullLead | null>(null);
  const [loadingLead, setLoadingLead] = useState(false);

  function toggleAcknowledgment(id: string) {
    const newSet = new Set(acknowledgedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAcknowledgedIds(newSet);
  }

  async function handleBuy(id: string) {
    if (!acknowledgedIds.has(id)) {
      setError('You must acknowledge the time-window policy before purchasing.');
      return;
    }

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
        body: JSON.stringify({ 
          appointmentId: id, 
          agentId,
          acknowledgedTimeWindow: true,
        }),
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

  async function handleViewDetails(appointmentId: string, leadId: string) {
    setViewingAppointmentId(appointmentId);
    setLoadingLead(true);
    setFullLead(null);

    try {
      const { data, error: fetchError } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('Error loading lead details:', fetchError);
        setError('Failed to load lead details.');
        setLoadingLead(false);
        return;
      }

      setFullLead(data as FullLead);
    } catch (err) {
      console.error('Error loading lead:', err);
      setError('Failed to load lead details.');
    } finally {
      setLoadingLead(false);
    }
  }

  function closeModal() {
    setViewingAppointmentId(null);
    setFullLead(null);
  }

  function formatTimelineIntent(intent: string | null) {
    if (!intent) return 'Not specified';
    if (intent === 'ready_now') return "I'm ready to plan soon";
    if (intent === 'speak_with_family') return "I need to speak with my family first";
    if (intent === 'collecting_info_need_done') return "I'm gathering information right now";
    if (intent === 'collecting_info_unsure') return "I'm planning for the future";
    if (intent === 'unsure') return 'Not sure yet';
    return intent;
  }

  function formatPlanningFor(planning: string | null) {
    if (!planning) return 'Not specified';
    if (planning === 'myself') return 'Myself';
    if (planning === 'spouse_partner') return 'Spouse / Partner';
    if (planning === 'spouse') return 'Spouse';
    if (planning === 'parent') return 'Parent';
    if (planning === 'other_family') return 'Other family member';
    if (planning === 'other') return 'Other';
    return planning;
  }

  function formatRemainsDisposition(disposition: string | null) {
    if (!disposition) return 'Not specified';
    if (disposition === 'scatter_cremated_remains') return 'Scatter cremated remains';
    if (disposition === 'keep_remains') return 'Keep remains';
    if (disposition === 'burial_at_cemetery') return 'Burial at cemetery';
    if (disposition === 'unsure') return 'Unsure';
    return disposition.replace(/_/g, ' ');
  }

  function formatServiceCelebration(celebration: string | null) {
    if (!celebration) return 'Not specified';
    if (celebration === 'yes') return 'Yes';
    if (celebration === 'no') return 'No';
    if (celebration === 'unsure') return 'Unsure';
    return celebration;
  }

  function formatFamilyPreArranged(preArranged: string | null) {
    if (!preArranged) return 'Not specified';
    if (preArranged === 'yes') return 'Yes';
    if (preArranged === 'no') return 'No';
    if (preArranged === 'unsure') return 'Unsure';
    return preArranged;
  }

  // Close modal on Escape key
  useEffect(() => {
    if (!viewingAppointmentId) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [viewingAppointmentId]);

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
                  <button
                    onClick={() => handleViewDetails(appt.id, appt.lead_id)}
                    className="text-xs text-[#6b6b6b] hover:text-[#2a2a2a] underline transition-colors mt-1"
                  >
                    View lead details →
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">

                <label className="flex items-start gap-2 text-xs text-[#6b6b6b] cursor-pointer max-w-xs">
                  <input
                    type="checkbox"
                    checked={acknowledgedIds.has(appt.id)}
                    onChange={() => toggleAcknowledgment(appt.id)}
                    className="mt-0.5"
                  />
                  <span>
                    I understand this is a <span className="font-medium">requested time window</span> and
                    may require confirmation or rescheduling with the family.
                  </span>
                </label>

                <button
                  onClick={() => handleBuy(appt.id)}
                  disabled={!acknowledgedIds.has(appt.id) || loadingId === appt.id}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap ${
                    acknowledgedIds.has(appt.id)
                      ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-60'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {loadingId === appt.id ? 'Processing…' : 'Buy Appointment – $39'}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* View Details Modal */}
      {viewingAppointmentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2a2a2a]">Appointment Details</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingLead ? (
                <p className="text-sm text-[#6b6b6b]">Loading details…</p>
              ) : fullLead ? (
                <>
                  {/* Appointment Info */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-[#2a2a2a]">Appointment Request</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Date
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a]">
                          {(() => {
                            const appt = appointments.find((a) => a.id === viewingAppointmentId);
                            return appt ? formatDate(appt.requested_date) : 'N/A';
                          })()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                          Time Window
                        </dt>
                        <dd className="mt-1 text-[#2a2a2a] capitalize">
                          {(() => {
                            const appt = appointments.find((a) => a.id === viewingAppointmentId);
                            if (!appt?.requested_window) return 'N/A';
                            return appt.requested_window.charAt(0).toUpperCase() + appt.requested_window.slice(1);
                          })()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Contact Information (Blurred) */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-[#2a2a2a]">Contact Information</h3>
                    <dl className="space-y-2 text-sm">
                      {fullLead.full_name || fullLead.first_name || fullLead.last_name ? (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Name
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">
                            {maskName(
                              fullLead.full_name ||
                                (fullLead.first_name || fullLead.last_name
                                  ? [fullLead.first_name, fullLead.last_name].filter(Boolean).join(' ')
                                  : null)
                            )}
                          </dd>
                        </div>
                      ) : null}
                      {fullLead.email && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Email
                          </dt>
                          <dd className="mt-1 break-all text-[#2a2a2a]">{maskEmail(fullLead.email)}</dd>
                        </div>
                      )}
                      {fullLead.phone && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Phone
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">{maskPhone(fullLead.phone)}</dd>
                        </div>
                      )}
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-[11px] text-amber-900">
                          🔒 Purchase this appointment to reveal full contact details.
                        </p>
                      </div>
                    </dl>
                  </div>

                  {/* Lead Details */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-base font-semibold text-[#2a2a2a]">Lead Information</h3>
                    <dl className="space-y-2 text-sm">
                      {(fullLead.city || fullLead.province) && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Location
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">
                            {fullLead.city || ''}
                            {fullLead.city && fullLead.province ? ', ' : ''}
                            {fullLead.province || ''}
                          </dd>
                        </div>
                      )}
                      {fullLead.age && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Age
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">{fullLead.age}</dd>
                        </div>
                      )}
                      {fullLead.service_type && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Service type
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">{formatServiceType(fullLead.service_type)}</dd>
                        </div>
                      )}
                      {fullLead.urgency_level && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Urgency
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                fullLead.urgency_level === 'hot'
                                  ? 'bg-red-100 text-red-900'
                                  : fullLead.urgency_level === 'warm'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              {formatUrgency(fullLead.urgency_level)}
                            </span>
                          </dd>
                        </div>
                      )}
                      {fullLead.planning_for && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Planning for
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">{formatPlanningFor(fullLead.planning_for)}</dd>
                        </div>
                      )}
                      {fullLead.timeline_intent && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            How soon do you expect to move forward after learning your options?
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a]">{formatTimelineIntent(fullLead.timeline_intent)}</dd>
                        </div>
                      )}
                      {fullLead.remains_disposition && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            What will the family do with the remains?
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a] capitalize">
                            {fullLead.remains_disposition.replace(/_/g, ' ')}
                          </dd>
                        </div>
                      )}
                      {fullLead.service_celebration && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Would there be a service celebration of life, memorial event?
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a] capitalize">{fullLead.service_celebration}</dd>
                        </div>
                      )}
                      {fullLead.family_pre_arranged && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Has anyone else in your family had a pre-arranged funeral plan?
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a] capitalize">{fullLead.family_pre_arranged}</dd>
                        </div>
                      )}
                      {fullLead.additional_notes && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
                            Additional details
                          </dt>
                          <dd className="mt-1 text-[#2a2a2a] whitespace-pre-wrap">{fullLead.additional_notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-600">Failed to load lead details.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

