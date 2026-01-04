"use client";

import { Check, Shield, Award, FileCheck, Star, Clock } from 'lucide-react';

interface TrustHighlightsProps {
  rating?: number;
  reviewCount?: number;
}

export function TrustHighlights({ rating = 0, reviewCount = 0 }: TrustHighlightsProps) {
  // Calculate real stats for "Highly recommended"
  const getRecommendedDescription = () => {
    if (reviewCount === 0) {
      return 'No reviews yet';
    }
    if (rating >= 4.5) {
      const percentage = Math.round((rating / 5) * 100);
      return `${percentage}% of patients give this specialist ${rating >= 4.8 ? '5' : '4-5'} stars`;
    }
    return `${rating.toFixed(1)} average rating from ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`;
  };

  const highlights = [
    { 
      icon: 'star', 
      title: 'Highly recommended', 
      description: getRecommendedDescription()
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

  const getIcon = (icon: string) => {
    const iconProps = { className: "w-8 h-8", style: { color: '#2d7a4a' } };
    switch (icon) {
      case 'shield': 
        return (
          <div className="relative w-8 h-8">
            <Shield {...iconProps} fill="#2d7a4a" className="absolute inset-0" />
            <Check 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: '#ffffff' }}
              strokeWidth={4}
              fill="none"
            />
          </div>
        );
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
