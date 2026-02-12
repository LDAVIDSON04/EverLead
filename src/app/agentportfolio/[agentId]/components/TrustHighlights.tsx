"use client";

import { useEffect, useState } from 'react';
import { Check, Shield, Award, FileCheck, Star, Clock } from 'lucide-react';

interface TrustHighlightsProps {
  agentId: string;
}

interface Stats {
  fiveStarPercentage: number;
  totalReviews: number;
  responseTimePercentage: number;
  verified: boolean;
}

export function TrustHighlights({ agentId }: TrustHighlightsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/agent/stats/${agentId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching agent stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (agentId) {
      fetchStats();
    }
  }, [agentId]);

  const getIcon = (icon: string) => {
    const iconProps = { className: "w-8 h-8", style: { color: '#1A1A1A' } };
    switch (icon) {
      case 'shield': 
        return (
          <div className="relative">
            <Shield {...iconProps} />
            <Check 
              className="w-5 h-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
              style={{ color: '#1A1A1A', strokeWidth: 3 }}
            />
          </div>
        );
      case 'award': return <Award {...iconProps} />;
      case 'file': return <FileCheck {...iconProps} />;
      case 'star': return <Star className="w-8 h-8" style={{ color: '#EAB308' }} fill="#EAB308" />;
      case 'clock': return <Clock {...iconProps} />;
      default: return <Check {...iconProps} />;
    }
  };

  if (loading || !stats) {
    return (
      <div id="highlights" className="py-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getIcon('clock')}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Excellent response time</h3>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getIcon('shield')}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Verified by Soradin</h3>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const highlights = [
    ...(stats.totalReviews > 0
      ? [{
          icon: 'star' as const,
          title: 'Highly recommended',
          description: `${stats.fiveStarPercentage}% of users give this specialist 5 stars`
        }]
      : []),
    { 
      icon: 'clock' as const, 
      title: 'Excellent response time', 
      description: stats.responseTimePercentage > 0
        ? `${stats.responseTimePercentage}% of inquiries answered within 2 hours`
        : 'Response time data not available'
    },
    { 
      icon: 'shield' as const, 
      title: 'Verified by Soradin', 
      description: 'All credentials and background checks verified' 
    },
  ];

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
