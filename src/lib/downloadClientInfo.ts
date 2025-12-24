import { supabaseClient } from './supabaseClient';

interface LeadData {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  address_line1: string | null;
  postal_code: string | null;
  age: number | null;
  sex: string | null;
  planning_for: string | null;
  planning_for_name: string | null;
  planning_for_age: number | null;
  service_type: string | null;
  timeline_intent: string | null;
  remains_disposition: string | null;
  service_celebration: string | null;
  family_pre_arranged: string | null;
  additional_notes: string | null;
  notes_from_family: string | null;
  created_at: string | null;
}

export async function downloadClientInfo(leadId: string, clientName: string): Promise<void> {
  try {
    // Fetch lead data
    const { data, error } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !data) {
      throw new Error('Failed to fetch client information');
    }

    const lead = data as LeadData;

    // Format the data as text
    const formatField = (label: string, value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === '') return 'Not provided';
      return String(value);
    };

    const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'Not provided';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateString;
      }
    };

    // Build document content
    let content = `CLIENT INFORMATION\n`;
    content += `==================\n\n`;
    
    content += `PERSONAL INFORMATION\n`;
    content += `--------------------\n`;
    content += `Full Name: ${formatField('', lead.full_name)}\n`;
    content += `Email: ${formatField('', lead.email)}\n`;
    content += `Phone: ${formatField('', lead.phone)}\n`;
    content += `Age: ${formatField('', lead.age)}\n`;
    content += `Sex: ${formatField('', lead.sex)}\n\n`;

    content += `ADDRESS\n`;
    content += `-------\n`;
    content += `Street Address: ${formatField('', lead.address_line1)}\n`;
    content += `City: ${formatField('', lead.city)}\n`;
    content += `Province: ${formatField('', lead.province)}\n`;
    content += `Postal Code: ${formatField('', lead.postal_code)}\n\n`;

    content += `PLANNING DETAILS\n`;
    content += `----------------\n`;
    content += `Planning For: ${formatField('', lead.planning_for)}\n`;
    if (lead.planning_for_name) {
      content += `Planning For Name: ${formatField('', lead.planning_for_name)}\n`;
    }
    if (lead.planning_for_age) {
      content += `Planning For Age: ${formatField('', lead.planning_for_age)}\n`;
    }
    content += `Service Type: ${formatField('', lead.service_type)}\n`;
    content += `Timeline Intent: ${formatField('', lead.timeline_intent)}\n`;
    content += `Remains Disposition: ${formatField('', lead.remains_disposition)}\n`;
    content += `Service Celebration: ${formatField('', lead.service_celebration)}\n`;
    content += `Family Pre-arranged: ${formatField('', lead.family_pre_arranged)}\n\n`;

    if (lead.additional_notes || lead.notes_from_family) {
      content += `NOTES\n`;
      content += `-----\n`;
      if (lead.additional_notes) {
        content += `Additional Notes:\n${lead.additional_notes}\n\n`;
      }
      if (lead.notes_from_family) {
        content += `Notes from Family:\n${lead.notes_from_family}\n\n`;
      }
    }

    content += `SUBMISSION DATE\n`;
    content += `---------------\n`;
    content += `${formatDate(lead.created_at)}\n`;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${clientName || 'Client'} - Information.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading client info:', error);
    throw error;
  }
}
