"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AboutSectionProps {
  summary: string;
  fullBio: string;
  aiGeneratedBio?: string | null;
}

export function AboutSection({ summary, fullBio, aiGeneratedBio }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use AI-generated bio if available, otherwise use provided summary/fullBio
  const displayBio = aiGeneratedBio || fullBio;
  const displaySummary = aiGeneratedBio ? aiGeneratedBio.split('\n\n')[0] || aiGeneratedBio : summary;
  const remainingBio = aiGeneratedBio 
    ? aiGeneratedBio.split('\n\n').slice(1).join('\n\n')
    : fullBio.replace(summary, '').trim();

  return (
    <div id="about" className="py-8 border-t border-gray-200">
      <div className="text-gray-700 leading-relaxed">
        <p className="mb-4">{displaySummary}</p>
        
        {isExpanded && remainingBio && (
          <div className="space-y-4">
            {remainingBio.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        
        {remainingBio && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-700 hover:text-gray-900 underline mt-3 text-sm"
          >
            {isExpanded ? 'show less' : 'show more'}
          </button>
        )}
      </div>
    </div>
  );
}
