'use client';

import { FileText, Calendar, User, Upload, Share2 } from 'lucide-react';

interface FilterSidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterSidebar({ activeFilter, onFilterChange }: FilterSidebarProps) {
  const filters = [
    { id: 'all', label: 'All Files', icon: FileText },
    { id: 'appointment', label: 'By Appointment', icon: Calendar },
    { id: 'client', label: 'By Client', icon: User },
    { id: 'uploaded', label: 'Uploaded by Me', icon: Upload },
    { id: 'shared', label: 'Shared with Me', icon: Share2 },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-8">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${
                  activeFilter === filter.id
                    ? 'border-green-800 text-green-800'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
