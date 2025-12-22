"use client";

import { useState } from 'react';

interface AboutSectionProps {
  summary: string;
  fullBio: string;
}

export function AboutSection({ summary, fullBio }: AboutSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div id="about" className="py-8 border-t border-gray-200">
      <div className="text-gray-700 leading-relaxed">
        <p className="mb-4">{summary}</p>
        
        {isExpanded && (
          <div className="space-y-4">
            {fullBio.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-700 hover:text-gray-900 underline mt-3 text-sm"
        >
          {isExpanded ? 'show less' : 'show more'}
        </button>
      </div>
    </div>
  );
}
