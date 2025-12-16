'use client';

import { Eye, Download } from 'lucide-react';

export interface FileData {
  id: string;
  fileName: string;
  appointment: string;
  client: string;
  uploadedBy: string;
  date: string;
}

interface FileTableProps {
  files: FileData[];
}

export function FileTable({ files }: FileTableProps) {
  return (
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
                    aria-label="View file"
                    onClick={() => {
                      // TODO: Implement view file functionality
                      console.log('View file:', file.id);
                    }}
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                    aria-label="Download file"
                    onClick={() => {
                      // TODO: Implement download file functionality
                      console.log('Download file:', file.id);
                    }}
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
