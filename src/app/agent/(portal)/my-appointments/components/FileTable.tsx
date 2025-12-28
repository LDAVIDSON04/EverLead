'use client';

import { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { ClientInfoModal } from './ClientInfoModal';
import { downloadClientInfo } from '@/lib/downloadClientInfo';

export interface FileData {
  id: string;
  fileName: string;
  appointment: string;
  client: string;
  uploadedBy: string;
  date: string;
  leadId?: string | null;
  appointmentId?: string | null;
  _sortDate?: number; // Internal property for sorting by date (timestamp)
}

interface FileTableProps {
  files: FileData[];
}

export function FileTable({ files }: FileTableProps) {
  const [viewingLeadId, setViewingLeadId] = useState<string | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<string | null>(null);

  const handleView = (file: FileData) => {
    if (file.leadId) {
      setViewingLeadId(file.leadId);
      setViewingAppointmentId(file.appointmentId || null);
    }
  };

  const handleDownload = async (file: FileData) => {
    if (file.leadId) {
      try {
        await downloadClientInfo(file.leadId, file.client);
      } catch (error) {
        console.error('Error downloading client info:', error);
        alert('Failed to download client information. Please try again.');
      }
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 text-gray-600 font-medium">File name</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium">Appointment</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium">Client</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium">Uploaded by</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium">Date</th>
              <th className="text-left py-4 px-6 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 text-gray-900">{file.fileName}</td>
                <td className="py-4 px-6 text-gray-700">{file.appointment}</td>
                <td className="py-4 px-6 text-gray-700">{file.client}</td>
                <td className="py-4 px-6 text-gray-700">{file.uploadedBy}</td>
                <td className="py-4 px-6 text-gray-700">{file.date}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      aria-label="View client information"
                      onClick={() => handleView(file)}
                      disabled={!file.leadId}
                      title={file.leadId ? 'View client information' : 'No client information available'}
                    >
                      <Eye className={`w-4 h-4 ${file.leadId ? 'text-gray-600' : 'text-gray-300'}`} />
                    </button>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      aria-label="Download client information"
                      onClick={() => handleDownload(file)}
                      disabled={!file.leadId}
                      title={file.leadId ? 'Download client information' : 'No client information available'}
                    >
                      <Download className={`w-4 h-4 ${file.leadId ? 'text-gray-600' : 'text-gray-300'}`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientInfoModal
        isOpen={viewingLeadId !== null}
        onClose={() => {
          setViewingLeadId(null);
          setViewingAppointmentId(null);
        }}
        leadId={viewingLeadId}
        appointmentId={viewingAppointmentId}
      />
    </>
  );
}
