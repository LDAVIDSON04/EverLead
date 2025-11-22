// src/lib/notifyAgentsForLead.ts
// Helper to notify agents when an auction goes live

import { supabaseAdmin } from './supabaseAdmin';

/**
 * Find agents whose region matches the lead's location and send notifications
 */
export async function notifyAgentsForLead(lead: any, supabaseAdminClient: any = supabaseAdmin): Promise<void> {
  try {
    // Find agents - for now, we'll match by province
    // In the future, this could be more sophisticated (city, radius, etc.)
    const province = lead.province?.toLowerCase().trim();
    
    if (!province) {
      console.warn('Cannot notify agents: lead has no province', { leadId: lead.id });
      return;
    }

    // Get all agent profiles
    // Note: In a production system, you might have a more sophisticated matching
    // (e.g., agents table with service_areas, radius matching, etc.)
    const { data: agents, error: agentsError } = await supabaseAdminClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'agent')
      .not('email', 'is', null);

    if (agentsError) {
      console.error('Error fetching agents for notification:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.warn('No agents found to notify');
      return;
    }

    // For now, notify all agents (in production, you'd filter by region/territory)
    // This is a simple implementation - can be enhanced with actual region matching
    const agentsToNotify = agents.filter((agent: any) => agent.email);

    if (agentsToNotify.length === 0) {
      console.warn('No agents with email addresses found');
      return;
    }

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
    const leadUrl = `${baseUrl}/agent/leads/available`;

    const city = lead.city || 'your area';
    const urgency = lead.urgency_level || 'warm';
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);

    for (const agent of agentsToNotify) {
      try {
        await sendEmailNotification({
          to: agent.email,
          agentName: agent.full_name || 'Agent',
          city,
          province: lead.province || '',
          urgency: urgencyLabel,
          leadUrl,
        });
      } catch (emailError) {
        console.error(`Failed to send notification to ${agent.email}:`, emailError);
        // Continue with other agents even if one fails
      }
    }

    console.log(`Sent auction notifications to ${agentsToNotify.length} agents for lead ${lead.id}`);
  } catch (err) {
    console.error('Error in notifyAgentsForLead:', err);
    // Don't throw - notification failure shouldn't break the auction flow
  }
}

interface EmailNotificationParams {
  to: string;
  agentName: string;
  city: string;
  province: string;
  urgency: string;
  leadUrl: string;
}

/**
 * Send email notification using Resend or fallback to console log
 */
async function sendEmailNotification(params: EmailNotificationParams): Promise<void> {
  const { to, agentName, city, province, urgency, leadUrl } = params;

  // Check if Resend is configured
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    // Use Resend API
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>',
          to: [to],
          subject: `New Soradin pre-need lead available in ${city}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2a2a2a;">New Lead Available</h2>
              <p>Hi ${agentName},</p>
              <p>A new pre-need inquiry has been submitted in <strong>${city}, ${province}</strong> and is now available for bidding.</p>
              <p><strong>Urgency:</strong> ${urgency}</p>
              <p style="margin-top: 30px;">
                <a href="${leadUrl}" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Available Leads
                </a>
              </p>
              <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
                This is an automated notification from Soradin. You're receiving this because you're a registered agent.
              </p>
            </div>
          `,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
      }

      return;
    } catch (resendError) {
      console.error('Resend API error, falling back to console log:', resendError);
      // Fall through to console log
    }
  }

  // Fallback: log to console (useful for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email notification (not sent - no RESEND_API_KEY):', {
      to,
      subject: `New Soradin pre-need lead available in ${city}`,
      agentName,
      city,
      province,
      urgency,
      leadUrl,
    });
  }
}

