"use client";

import { Star, Shield } from 'lucide-react';

interface AgentHeaderProps {
  name: string;
  credentials: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  verified: boolean;
}

/**
 * Compact header for the public agent profile (no tab nav).
 * Matches the "learn more" layout used in the search modal.
 */
export function AgentHeader({
  name,
  credentials,
  specialty,
  location,
  rating,
  reviewCount,
  imageUrl,
  verified
}: AgentHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-6 pb-6">
        <div className="flex-shrink-0">
          <img
            src={imageUrl}
            alt={name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
        <div className="flex-1">
          <h1 className="mb-1">{name}</h1>
          <p className="text-gray-600 mb-2">{specialty}</p>
        </div>
      </div>
    </div>
  );
}
