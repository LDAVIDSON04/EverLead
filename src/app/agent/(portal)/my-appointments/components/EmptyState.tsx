'use client';

import { FileText } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
      <p className="text-gray-600 mb-6 max-w-sm">
        Upload documents related to your appointments to keep everything organized.
      </p>
      <button
        onClick={onUploadClick}
        className="px-6 py-2.5 bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors"
      >
        Upload first file
      </button>
    </div>
  );
}
