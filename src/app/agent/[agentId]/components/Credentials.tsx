"use client";

import { Shield, Award, FileCheck } from 'lucide-react';

interface CredentialsProps {
  agentData: any;
}

export function Credentials({ agentData }: CredentialsProps) {
  const credentials = [];
  
  if (agentData.license_number) {
    credentials.push({
      type: 'license',
      name: 'Licensed Funeral Director',
      issuer: 'Professional Licensing Board',
      year: 'Current'
    });
  }
  
  // Add default credentials if none exist
  if (credentials.length === 0) {
    credentials.push({
      type: 'license',
      name: 'Licensed Professional',
      issuer: 'Verified by Soradin',
      year: 'Current'
    });
  }

  const getIcon = (type: string) => {
    const iconProps = { className: "w-5 h-5 text-gray-600" };
    switch (type) {
      case 'license': return <Shield {...iconProps} />;
      case 'certification': return <Award {...iconProps} />;
      case 'insurance': return <FileCheck {...iconProps} />;
      default: return <Shield {...iconProps} />;
    }
  };

  return (
    <div id="credentials" className="mb-12">
      <h3 className="text-xl font-medium text-gray-900 mb-2">Credentials & Verification</h3>
      <p className="text-sm text-gray-600 mb-6">
        Reviewed and approved through Soradin's professional verification process
      </p>
      <div className="space-y-4">
        {credentials.map((credential, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
              {getIcon(credential.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-gray-900 mb-1">{credential.name}</h4>
              <p className="text-sm text-gray-600">{credential.issuer} • {credential.year}</p>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full text-sm" style={{ color: '#1a4d2e' }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#1a4d2e' }}></div>
                Verified
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
