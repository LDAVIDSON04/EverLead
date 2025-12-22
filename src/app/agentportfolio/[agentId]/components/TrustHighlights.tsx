"use client";

import { Check, Shield, Award, FileCheck, Star, Clock } from 'lucide-react';

interface Highlight {
  icon: 'check' | 'shield' | 'award' | 'file' | 'star' | 'clock';
  title: string;
  description: string;
}

const highlights: Highlight[] = [
  { 
    icon: 'star', 
    title: 'Highly recommended', 
    description: '100% of patients give this specialist 5 stars' 
  },
  { 
    icon: 'clock', 
    title: 'Excellent response time', 
    description: '100% of inquiries answered within 2 hours' 
  },
  { 
    icon: 'shield', 
    title: 'Verified by Soradin', 
    description: 'All credentials and background checks verified' 
  },
];

export function TrustHighlights() {
  const getIcon = (icon: string) => {
    const iconProps = { className: "w-8 h-8", style: { color: '#2d7a4a' } };
    switch (icon) {
      case 'shield': return <Shield {...iconProps} />;
      case 'award': return <Award {...iconProps} />;
      case 'file': return <FileCheck {...iconProps} />;
      case 'star': return <Star {...iconProps} fill="#2d7a4a" />;
      case 'clock': return <Clock {...iconProps} />;
      default: return <Check {...iconProps} />;
    }
  };

  return (
    <div id="highlights" className="py-8">
      <div className="space-y-6">
        {highlights.map((highlight, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getIcon(highlight.icon)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{highlight.title}</h3>
              <p className="text-gray-600 text-sm">{highlight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
