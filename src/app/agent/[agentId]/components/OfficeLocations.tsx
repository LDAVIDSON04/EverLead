"use client";

import { MapPin, ExternalLink } from 'lucide-react';
import { OfficeLocationMap } from '@/components/OfficeLocationMap';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

interface OfficeLocationsProps {
  agentData: any;
}

export function OfficeLocations({ agentData }: OfficeLocationsProps) {
  const [officeLocations, setOfficeLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOfficeLocations() {
      try {
        // First try to load from office_locations table
        const { data: locations, error } = await supabaseClient
          .from('office_locations')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('display_order', { ascending: true });

        if (!error && locations && locations.length > 0) {
          setOfficeLocations(locations);
          setLoading(false);
          return;
        }

        // Fallback to legacy business address fields
        const fallbackLocations = [];
        if (agentData.business_street || agentData.business_address) {
          const address = agentData.business_street && agentData.business_city && agentData.business_province && agentData.business_zip
            ? `${agentData.business_street}, ${agentData.business_city}, ${agentData.business_province} ${agentData.business_zip}`
            : agentData.business_address || `${agentData.business_city || ''}, ${agentData.business_province || ''}`;
          
          fallbackLocations.push({
            id: '1',
            name: agentData.funeral_home || 'Main Office',
            street_address: agentData.business_street || '',
            address: address,
            city: agentData.business_city || agentData.agent_city || '',
            province: agentData.business_province || agentData.agent_province || '',
            postal_code: agentData.business_zip || '',
            latitude: null,
            longitude: null,
          });
        } else if (agentData.agent_city && agentData.agent_province) {
          fallbackLocations.push({
            id: '1',
            name: agentData.funeral_home || 'Main Office',
            street_address: '',
            address: `${agentData.agent_city}, ${agentData.agent_province}`,
            city: agentData.agent_city,
            province: agentData.agent_province,
            postal_code: '',
            latitude: null,
            longitude: null,
          });
        }

        setOfficeLocations(fallbackLocations);
      } catch (err) {
        console.error('Error loading office locations:', err);
      } finally {
        setLoading(false);
      }
    }

    if (agentData?.id) {
      loadOfficeLocations();
    }
  }, [agentData]);

  if (loading) {
    return null;
  }

  if (officeLocations.length === 0) {
    return null;
  }

  const getDirectionsUrl = (location: any) => {
    const address = location.postal_code 
      ? `${location.street_address || location.address}, ${location.city}, ${location.province} ${location.postal_code}`
      : location.street_address
      ? `${location.street_address}, ${location.city}, ${location.province}`
      : `${location.city}, ${location.province}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };
  
  return (
    <div id="locations" className="mb-12">
      <h2 className="text-3xl font-medium text-gray-900 mb-6">Office locations</h2>
      
      <div className="space-y-8">
        {officeLocations.map((location) => {
          const fullAddress = location.street_address
            ? `${location.street_address}, ${location.city}, ${location.province}${location.postal_code ? ` ${location.postal_code}` : ''}`
            : `${location.city}, ${location.province}`;

          return (
            <div key={location.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Map Section */}
                <div className="order-2 md:order-1">
                  <OfficeLocationMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                    city={location.city}
                    province={location.province}
                    address={location.street_address || undefined}
                    className="h-full"
                  />
                </div>
                
                {/* Info Section */}
                <div className="order-1 md:order-2 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="w-5 h-5 text-[#1a4d2e] mt-0.5 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4">
                      {fullAddress}
                    </p>
                  </div>
                  
                  <a
                    href={getDirectionsUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#1a4d2e] hover:text-[#0f291a] font-medium text-sm transition-colors"
                  >
                    Get directions
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
