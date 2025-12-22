"use client";

import { MapPin, ExternalLink } from 'lucide-react';

interface OfficeLocationsProps {
  agentData: any;
}

export function OfficeLocations({ agentData }: OfficeLocationsProps) {
  const locations = [];
  
  // Build locations from agent data
  if (agentData.business_street || agentData.business_address) {
    const address = agentData.business_street && agentData.business_city && agentData.business_province && agentData.business_zip
      ? `${agentData.business_street}, ${agentData.business_city}, ${agentData.business_province} ${agentData.business_zip}`
      : agentData.business_address || `${agentData.business_city || ''}, ${agentData.business_province || ''}`;
    
    locations.push({
      id: '1',
      name: agentData.funeral_home || 'Main Office',
      address: address,
      city: agentData.business_city || agentData.agent_city || '',
      state: agentData.business_province || agentData.agent_province || '',
      zip: agentData.business_zip || ''
    });
  } else if (agentData.agent_city && agentData.agent_province) {
    locations.push({
      id: '1',
      name: agentData.funeral_home || 'Main Office',
      address: `${agentData.agent_city}, ${agentData.agent_province}`,
      city: agentData.agent_city,
      state: agentData.agent_province,
      zip: ''
    });
  }

  if (locations.length === 0) {
    return null;
  }

  const getDirectionsUrl = (location: any) => {
    const address = location.zip 
      ? `${location.address}, ${location.city}, ${location.state} ${location.zip}`
      : `${location.address}, ${location.city}, ${location.state}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };
  
  return (
    <div id="locations" className="mb-12">
      <h2 className="text-3xl font-medium text-gray-900 mb-6">Office locations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div 
            key={location.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-[#1a4d2e] mt-0.5 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">{location.name}</h3>
            </div>
            
            <p className="text-gray-700 text-sm mb-4">
              {location.address}
            </p>
            
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
        ))}
      </div>
    </div>
  );
}
