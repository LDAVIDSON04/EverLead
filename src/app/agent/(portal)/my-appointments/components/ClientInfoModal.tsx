'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

interface ClientInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
  appointmentId: string | null;
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

export function ClientInfoModal({ isOpen, onClose, leadId, appointmentId }: ClientInfoModalProps) {
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && leadId) {
      loadLeadData();
      if (appointmentId) {
        loadAppointmentData();
      }
    } else {
      setLeadData(null);
      setOfficeLocation(null);
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

      const appointmentData = await response.json();
      if (appointmentData.office_location) {
        setOfficeLocation(appointmentData.office_location);
      }
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

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Client Information</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : leadData ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{formatField('', leadData.full_name)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{formatField('', leadData.email)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{formatField('', leadData.phone)}</p>
                  </div>
                </div>
              </div>

              {/* Meeting Location */}
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
                    <p className="text-gray-900">{formatField('', leadData.service_type)}</p>
                  </div>
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
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
