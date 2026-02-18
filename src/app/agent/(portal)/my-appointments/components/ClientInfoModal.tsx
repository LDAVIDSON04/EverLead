'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { DateTime } from 'luxon';
import { formatTimeForDisplay, CanadianTimezone } from '@/lib/timezone';

interface ClientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
  appointmentId: string | null;
  /** When set, show this name (from this booking) instead of lead full_name so agents see exactly what the customer entered */
  displayNameOverride?: string | null;
  onEdit?: (appointmentId: string, leadId: string) => void;
  onDelete?: (appointmentId: string) => Promise<void>;
}

interface LeadData {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  address_line1: string | null;
  postal_code: string | null;
  age: number | null;
  sex: string | null;
  planning_for: string | null;
  planning_for_name: string | null;
  planning_for_age: number | null;
  service_type: string | null;
  timeline_intent: string | null;
  remains_disposition: string | null;
  service_celebration: string | null;
  family_pre_arranged: string | null;
  additional_notes: string | null;
  notes_from_family: string | null;
  created_at: string | null;
}

interface OfficeLocation {
  id: string;
  name: string | null;
  city: string | null;
  street_address: string | null;
  province: string | null;
  postal_code: string | null;
}

interface AppointmentData {
  id: string;
  agent_id?: string | null;
  starts_at: string | null;
  ends_at: string | null;
  confirmed_at: string | null;
  requested_date: string | null;
  requested_window: string | null;
  office_location: OfficeLocation | null;
  office_location_id?: string | null;
  agent_timezone?: string;
  agent?: {
    full_name: string | null;
  } | null;
}

export function ClientInfoModal({ isOpen, onClose, leadId, appointmentId, displayNameOverride, onEdit, onDelete }: ClientInfoModalProps) {
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadData();
      if (appointmentId) {
        loadAppointmentData();
      }
    } else {
      setLeadData(null);
      setOfficeLocation(null);
      setAppointmentData(null);
      setError(null);
    }
  }, [isOpen, leadId, appointmentId]);

  async function loadLeadData() {
    if (!leadId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError) {
        console.error('Error loading lead data:', fetchError);
        setError('Failed to load client information.');
        return;
      }

      setLeadData(data as LeadData);
    } catch (err) {
      console.error('Unexpected error loading lead data:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointmentData() {
    if (!appointmentId) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (!response.ok) {
        console.error('Error loading appointment data');
        return;
      }

      const data = await response.json();
      setAppointmentData(data);
      setOfficeLocation(data.office_location ?? null);
    } catch (err) {
      console.error('Error loading appointment data:', err);
      // Don't show error to user, just log it
    }
  }

  if (!isOpen) return null;

  const formatField = (label: string, value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    return String(value);
  };

  const getDateOfBirthFromNotes = (notes: string | null | undefined): string | null => {
    if (!notes || typeof notes !== 'string') return null;
    const match = notes.match(/Date of Birth:\s*([^\s|]+)/i);
    return match ? match[1].trim() : null;
  };

  const formatDate = (dateString: string | null, timezone?: string): string => {
    if (!dateString) return 'Not provided';
    try {
      if (timezone) {
        // Use agent's timezone for date formatting
        const utcDate = DateTime.fromISO(dateString, { zone: 'utc' });
        const localDate = utcDate.setZone(timezone);
        return localDate.toLocaleString({
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | null, timezone?: string): string => {
    if (!dateString) return 'Not provided';
    try {
      if (timezone) {
        // Use formatTimeForDisplay to get time with timezone label (e.g., "2:00 PM PST")
        return formatTimeForDisplay(dateString, timezone as CanadianTimezone);
      }
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Check if this is an agent-created event
  const isAgentEvent = leadData?.email?.includes('@soradin.internal') || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            {isAgentEvent ? 'Event Details' : 'Client Information'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-700"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : isAgentEvent && leadData ? (
            // Simplified view for agent-created events
            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Event Title</h3>
                <div>
                  <p className="text-gray-900">{(displayNameOverride && displayNameOverride.trim()) || leadData.full_name || 'Untitled Event'}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-gray-900">
                      {appointmentData?.starts_at 
                        ? formatDate(appointmentData.starts_at, appointmentData.agent_timezone)
                        : appointmentData?.confirmed_at
                        ? formatDate(appointmentData.confirmed_at, appointmentData.agent_timezone)
                        : appointmentData?.requested_date 
                        ? formatDate(appointmentData.requested_date, appointmentData.agent_timezone)
                        : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Time</label>
                    <p className="text-gray-900">
                      {appointmentData?.starts_at && appointmentData?.ends_at
                        ? (() => {
                            const agentTimezone = appointmentData.agent_timezone as CanadianTimezone | undefined;
                            const startTime = formatTime(appointmentData.starts_at, agentTimezone);
                            const endTime = formatTime(appointmentData.ends_at, agentTimezone);
                            const start = DateTime.fromISO(appointmentData.starts_at, { zone: 'utc' });
                            const end = DateTime.fromISO(appointmentData.ends_at, { zone: 'utc' });
                            const durationMinutes = Math.round(end.diff(start, 'minutes').minutes);
                            const durationHours = Math.floor(durationMinutes / 60);
                            const durationMins = durationMinutes % 60;
                            const durationStr = durationHours > 0 
                              ? `${durationHours} ${durationHours === 1 ? 'hour' : 'hours'}${durationMins > 0 ? ` ${durationMins} ${durationMins === 1 ? 'minute' : 'minutes'}` : ''}`
                              : `${durationMins} ${durationMins === 1 ? 'minute' : 'minutes'}`;
                            return `${startTime} - ${endTime} (${durationStr})`;
                          })()
                        : appointmentData?.starts_at
                        ? formatTime(appointmentData.starts_at, appointmentData.agent_timezone as CanadianTimezone | undefined)
                        : appointmentData?.confirmed_at
                        ? formatTime(appointmentData.confirmed_at, appointmentData.agent_timezone as CanadianTimezone | undefined)
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* For agent-created events, only show the location text the agent entered, not office address */}
                  {leadData.city && leadData.city !== 'Internal' ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">
                        {leadData.city}
                        {leadData.province && leadData.province !== 'BC' ? `, ${leadData.province}` : ''}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p className="text-gray-900">Not provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Description</h3>
                <div>
                  <p className="text-gray-900">
                    {(() => {
                      // Extract description from additional_notes (remove EVENT_DURATION prefix if present)
                      const notes = leadData.additional_notes || leadData.notes_from_family || '';
                      const descriptionMatch = notes.match(/^EVENT_DURATION:\d+\|(.*)$/);
                      return descriptionMatch ? descriptionMatch[1] : notes || 'No description provided';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ) : leadData ? (
            // Full view for regular client appointments
            <div className="space-y-6">
              {/* Personal Information - use displayNameOverride when set so agents see exactly what the customer entered for this booking */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{formatField('', (displayNameOverride && displayNameOverride.trim()) ? displayNameOverride.trim() : leadData.full_name)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{formatField('', leadData.email)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{formatField('', leadData.phone)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of birth</label>
                    <p className="text-gray-900">
                      {formatField('', getDateOfBirthFromNotes(leadData.additional_notes))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meeting time (for appointments) */}
              {appointmentData?.starts_at && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900">
                        {formatDate(appointmentData.starts_at, appointmentData.agent_timezone)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Time</label>
                      <p className="text-gray-900">
                        {formatTime(appointmentData.starts_at, appointmentData.agent_timezone as CanadianTimezone | undefined)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Location or Join Meeting (for video calls) */}
              {appointmentData ? (() => {
                // Video vs in-person: use office_location_id only (bookings set it null for video).
                // API may return office_location from fallback; we ignore that for this check.
                const isVideoAppointment = !appointmentData.office_location_id;
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.soradin.com';
                const agentName = appointmentData.agent?.full_name || 'Agent';
                
                if (isVideoAppointment && appointmentData.id) {
                  // Video appointment: Show "Meeting link" with join URL (Agent | X so unique in room, role=host for owner permissions)
                  const videoLink = `${baseUrl}/video/join/appointment-${appointmentData.id}?identity=${encodeURIComponent(`Agent | ${agentName}`)}&role=host`;
                  
                  return (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting link</h3>
                      <div>
                        <a
                          href={videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                        >
                          <span>Join Video Call</span>
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                } else {
                  // In-person appointment: Show meeting location
                  return (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {officeLocation ? (
                          <>
                            {officeLocation.name && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Office Name</label>
                                <p className="text-gray-900">{officeLocation.name}</p>
                              </div>
                            )}
                            {officeLocation.city && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">City</label>
                                <p className="text-gray-900">{officeLocation.city}</p>
                              </div>
                            )}
                            {officeLocation.street_address && (
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500">Street Address</label>
                                <p className="text-gray-900">{officeLocation.street_address}</p>
                              </div>
                            )}
                            {officeLocation.province && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Province</label>
                                <p className="text-gray-900">{officeLocation.province}</p>
                              </div>
                            )}
                            {officeLocation.postal_code && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Postal Code</label>
                                <p className="text-gray-900">{officeLocation.postal_code}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <p className="text-gray-500">Not specified</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })() : appointmentId ? (
                // Loading state: appointmentId exists but appointmentData not loaded yet
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Information</h3>
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                    <span className="text-sm">Loading...</span>
                  </div>
                </div>
              ) : null}

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p className="text-gray-900">{formatField('', leadData.city)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Province</label>
                    <p className="text-gray-900">{formatField('', leadData.province)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Postal Code</label>
                    <p className="text-gray-900">{formatField('', leadData.postal_code)}</p>
                  </div>
                </div>
              </div>

              {/* Planning Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Planning Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Type</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{formatField('', leadData.service_type)}</p>
                  </div>
                  {leadData.additional_notes && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Booking notes</label>
                      <p className="text-gray-900 whitespace-pre-wrap mt-1">{leadData.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No client information available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-3">
            {isAgentEvent && appointmentId && leadId && onEdit && (
              <button
                onClick={() => {
                  onEdit(appointmentId, leadId);
                  onClose();
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                Edit Event
              </button>
            )}
            {isAgentEvent && appointmentId && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete Event"}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">Delete event?</h3>
                <p className="mt-1 text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!appointmentId || !onDelete) return;
                  setDeleting(true);
                  setShowDeleteConfirm(false);
                  try {
                    await onDelete(appointmentId);
                    onClose();
                  } catch (e) {
                    setError("Failed to delete event.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
