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

    // Format field values
    const formatField = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined || value === '') return '—';
      return String(value);
    };

    const formatDate = (dateString: string | null): string => {
      if (!dateString) return '—';
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

    const formatFieldLabel = (value: string | null): string => {
      if (!value) return '—';
      return value.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    // Build professional HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client Information - ${clientName || 'Client'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #1a4d2e;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1a4d2e;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a4d2e;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 12px 24px;
      margin-bottom: 16px;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
    }
    .info-value {
      color: #1f2937;
      font-size: 14px;
    }
    .notes-section {
      background: #f9fafb;
      border-left: 4px solid #1a4d2e;
      padding: 16px 20px;
      margin-top: 8px;
      border-radius: 4px;
    }
    .notes-section .label {
      font-weight: 600;
      color: #1a4d2e;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .notes-section .content {
      color: #374151;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.7;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Client Information</h1>
    <div class="subtitle">Confidential Document</div>
  </div>

  <div class="section">
    <div class="section-title">Personal Information</div>
    <div class="info-grid">
      <div class="info-label">Full Name</div>
      <div class="info-value">${formatField(lead.full_name)}</div>
      
      <div class="info-label">Email</div>
      <div class="info-value">${formatField(lead.email)}</div>
      
      <div class="info-label">Phone</div>
      <div class="info-value">${formatField(lead.phone)}</div>
      
      <div class="info-label">Age</div>
      <div class="info-value">${formatField(lead.age)}</div>
      
      <div class="info-label">Sex</div>
      <div class="info-value">${formatField(lead.sex)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Address</div>
    <div class="info-grid">
      <div class="info-label">Street Address</div>
      <div class="info-value">${formatField(lead.address_line1)}</div>
      
      <div class="info-label">City</div>
      <div class="info-value">${formatField(lead.city)}</div>
      
      <div class="info-label">Province</div>
      <div class="info-value">${formatField(lead.province)}</div>
      
      <div class="info-label">Postal Code</div>
      <div class="info-value">${formatField(lead.postal_code)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Planning Details</div>
    <div class="info-grid">
      <div class="info-label">Planning For</div>
      <div class="info-value">${formatFieldLabel(lead.planning_for)}</div>
      
      ${lead.planning_for_name ? `
      <div class="info-label">Planning For Name</div>
      <div class="info-value">${formatField(lead.planning_for_name)}</div>
      ` : ''}
      
      ${lead.planning_for_age ? `
      <div class="info-label">Planning For Age</div>
      <div class="info-value">${formatField(lead.planning_for_age)}</div>
      ` : ''}
      
      <div class="info-label">Service Type</div>
      <div class="info-value">${formatFieldLabel(lead.service_type)}</div>
      
      <div class="info-label">Timeline Intent</div>
      <div class="info-value">${formatFieldLabel(lead.timeline_intent)}</div>
      
      <div class="info-label">Remains Disposition</div>
      <div class="info-value">${formatFieldLabel(lead.remains_disposition)}</div>
      
      <div class="info-label">Service Celebration</div>
      <div class="info-value">${formatFieldLabel(lead.service_celebration)}</div>
      
      <div class="info-label">Family Pre-arranged</div>
      <div class="info-value">${formatFieldLabel(lead.family_pre_arranged)}</div>
    </div>
  </div>

  ${lead.additional_notes || lead.notes_from_family ? `
  <div class="section">
    <div class="section-title">Notes</div>
    ${lead.additional_notes ? `
    <div class="notes-section">
      <div class="label">Additional Notes</div>
      <div class="content">${lead.additional_notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
    ` : ''}
    ${lead.notes_from_family ? `
    <div class="notes-section" style="margin-top: 16px;">
      <div class="label">Notes from Family</div>
      <div class="content">${lead.notes_from_family.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <div>Document Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div style="margin-top: 4px;">Submission Date: ${formatDate(lead.created_at)}</div>
  </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${clientName || 'Client'} - Information.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading client info:', error);
    throw error;
  }
}
