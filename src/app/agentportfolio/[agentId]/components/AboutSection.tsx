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
  const displayBio = aiGeneratedBio || fullBio || summary;
  
  // Split bio into paragraphs
  const bioParagraphs = displayBio ? displayBio.split('\n\n').filter(p => p.trim().length > 0) : [];
  
  // Always show at least the summary if bio paragraphs are empty
  const firstParagraph = bioParagraphs.length > 0 ? bioParagraphs[0] : (summary || displayBio || '');
  const remainingParagraphs = bioParagraphs.slice(1);

  // If there's only one paragraph and it matches the summary, don't show "show more"
  const hasMoreContent = remainingParagraphs.length > 0 || (bioParagraphs.length > 0 && bioParagraphs[0] !== summary);

  return (
    <div id="about" className="py-8 border-t border-gray-200">
      <div className="text-gray-700 leading-relaxed">
        <p className="mb-4">{firstParagraph}</p>
        
        {isExpanded && remainingParagraphs.length > 0 && (
          <div className="space-y-4">
            {remainingParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        
        {hasMoreContent && (
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
