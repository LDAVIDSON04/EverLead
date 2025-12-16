'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import { Upload } from 'lucide-react';
import { FilterSidebar } from './components/FilterSidebar';
import { FileTable, FileData } from './components/FileTable';
import { FileUploadModal } from './components/FileUploadModal';
import { EmptyState } from './components/EmptyState';

type Lead = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  service_type: string | null;
};

type Appointment = {
  id: string;
  requested_date: string;
  requested_window: string;
  status: 'booked' | 'completed' | 'no_show' | 'pending' | 'confirmed' | 'cancelled';
  leads: Lead | null;
};

export default function FilesPage() {
  useRequireRole('agent');
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
          setError('You must be logged in as an agent.');
          setLoading(false);
          return;
        }

        const agentId = user.id;

        // Fetch appointments assigned to this agent
        const { data, error: fetchError } = await supabaseClient
          .from('appointments')
          .select(`
            id,
            created_at,
            updated_at,
            requested_date,
            requested_window,
            status,
            leads (
              id,
              full_name,
              email,
              phone,
              city,
              province,
              service_type
            )
          `)
          .eq('agent_id', agentId)
          .order('updated_at', { ascending: false });

        if (fetchError) {
          console.error('Error loading appointments:', fetchError);
          setError('Failed to load appointments. Please try again later.');
          return;
        }

        // Transform data to match Appointment type
        const transformed = (data || []).map((item: any) => {
          const { created_at, updated_at, ...rest } = item;
          return {
            ...rest,
            leads: Array.isArray(item.leads) ? item.leads[0] || null : item.leads || null,
          };
        });

        setAppointments(transformed as Appointment[]);

        // Convert appointments to file data format
        // For now, we'll create placeholder files based on appointments
        // TODO: Replace with actual file data from storage/database
        const fileData: FileData[] = transformed.map((apt: any) => {
          const lead = Array.isArray(apt.leads) ? apt.leads[0] : apt.leads;
          const clientName = lead?.full_name || 'Client';
          const date = new Date(apt.requested_date);
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          return {
            id: apt.id,
            fileName: `${clientName} - Appointment Documents.pdf`,
            appointment: `${clientName} – ${formattedDate}`,
            client: clientName,
            uploadedBy: 'Agent',
            date: formattedDate,
          };
        });

        setFiles(fileData);
      } catch (err) {
        console.error('Unexpected error loading appointments:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const handleUpload = async (data: { file: File | null; appointment: string; note: string }) => {
    if (!data.file || !data.appointment) return;

    try {
      // TODO: Implement actual file upload to storage
      // For now, just add to local state
      const appointment = appointments.find(a => a.id === data.appointment);
      if (!appointment) return;

      const lead = appointment.leads;
      const clientName = lead?.full_name || 'Client';
      const date = new Date(appointment.requested_date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const newFile: FileData = {
        id: Date.now().toString(),
        fileName: data.file.name,
        appointment: `${clientName} – ${formattedDate}`,
        client: clientName,
        uploadedBy: 'Agent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };

      setFiles([newFile, ...files]);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  // Filter files based on active filter
  const filteredFiles = files.filter((file) => {
    switch (activeFilter) {
      case 'all':
        return true;
      case 'appointment':
        return true; // Show all, could be enhanced to group by appointment
      case 'client':
        return true; // Show all, could be enhanced to group by client
      case 'uploaded':
        return file.uploadedBy === 'Agent';
      case 'shared':
        return file.uploadedBy === 'Client';
      default:
        return true;
    }
  });

  // Format appointments for the upload modal
  const appointmentOptions = appointments.map((apt) => {
    const lead = apt.leads;
    const clientName = lead?.full_name || 'Client';
    const date = new Date(apt.requested_date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      id: apt.id,
      displayName: `${clientName} – ${formattedDate}`,
      date: formattedDate,
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <p className="text-sm text-gray-500">Loading files…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Files</h1>
              <p className="text-gray-600">Documents related to your appointments and clients</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>
        </div>
      </div>

      <FilterSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {filteredFiles.length === 0 ? (
          <EmptyState onUploadClick={() => setIsModalOpen(true)} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <FileTable files={filteredFiles} />
          </div>
        )}
      </main>

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUpload}
        appointments={appointmentOptions}
      />
    </div>
  );
}
