'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { file: File | null; appointment: string; note: string }) => void;
  appointments: Array<{ id: string; displayName: string; date: string }>;
}

export function FileUploadModal({ isOpen, onClose, onUpload, appointments }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [appointment, setAppointment] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !appointment) return;
    onUpload({ file: selectedFile, appointment, note });
    setSelectedFile(null);
    setAppointment('');
    setNote('');
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-800 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  {selectedFile ? (
                    <p className="text-sm text-gray-900">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG, DOC up to 10MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="appointment" className="block mb-2 text-sm font-medium text-gray-900">
              Attach to appointment <span className="text-red-500">*</span>
            </label>
            <select
              id="appointment"
              value={appointment}
              onChange={(e) => setAppointment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
              required
            >
              <option value="">Select an appointment</option>
              {appointments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note" className="block mb-2 text-sm font-medium text-gray-900">
              Optional note
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Signed intake form"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <p className="text-sm text-gray-500">
            Files are only visible to authorized participants in this appointment.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2.5 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
            >
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
