// src/lib/emailQueue.ts
// Queue-based email sending for scalability
// This allows sending emails to thousands of agents without hitting timeouts

import { supabaseAdmin } from './supabaseAdmin';

interface QueuedEmail {
  id: string;
  lead_id: string;
  agent_email: string;
  agent_name: string;
  city: string;
  province: string;
  urgency: string;
  price: string;
  lead_url: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  created_at: string;
  processed_at?: string;
}

/**
 * Queue emails for background processing
 * This allows us to handle thousands of agents without timing out
 */
export async function queueAgentEmails(
  leadId: string,
  agents: Array<{ email: string; full_name: string | null }>,
  leadData: { city: string; province: string; urgency_level: string; lead_price: number }
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
    const leadUrl = `${baseUrl}/agent/leads/available`;
    
    const city = leadData.city || 'your area';
    const province = leadData.province || '';
    const urgency = leadData.urgency_level || 'warm';
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);
    const price = leadData.lead_price ? `$${leadData.lead_price.toFixed(2)}` : 'See pricing';

    // Create email queue entries in database
    const queueEntries = agents.map(agent => ({
      lead_id: leadId,
      agent_email: agent.email,
      agent_name: agent.full_name || 'Agent',
      city,
      province,
      urgency: urgencyLabel,
      price,
      lead_url: leadUrl,
      status: 'pending' as const,
    }));

    // Insert into email_queue table (we'll create this table)
    const { error } = await supabaseAdmin
      .from('email_queue')
      .insert(queueEntries);

    if (error) {
      console.error('❌ Error queueing emails:', error);
      // If table doesn't exist, fall back to direct sending
      throw error;
    }

    console.log(`✅ Queued ${agents.length} emails for lead ${leadId}`);
    
    // Trigger background processing (non-blocking)
    processEmailQueue().catch(err => {
      console.error('❌ Error processing email queue (non-fatal):', err);
    });
  } catch (err) {
    console.error('❌ Error in queueAgentEmails:', err);
    throw err;
  }
}

/**
 * Process queued emails in batches
 * This runs in the background and can handle thousands of emails
 */
export async function processEmailQueue(): Promise<void> {
  const BATCH_SIZE = 2; // Respect Resend's 2 req/sec limit
  const BATCH_DELAY_MS = 500;
  
  try {
    // Fetch pending emails
    const { data: pendingEmails, error } = await supabaseAdmin
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100); // Process 100 at a time

    if (error) {
      console.error('❌ Error fetching email queue:', error);
      return;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return; // No emails to process
    }

    console.log(`📬 Processing ${pendingEmails.length} queued emails...`);

    // Process in batches
    for (let i = 0; i < pendingEmails.length; i += BATCH_SIZE) {
      const batch = pendingEmails.slice(i, i + BATCH_SIZE);
      
      // Mark as processing
      const batchIds = batch.map((e: QueuedEmail) => e.id);
      await supabaseAdmin
        .from('email_queue')
        .update({ status: 'processing' })
        .in('id', batchIds);

      // Send emails concurrently
      const sendPromises = batch.map(async (email: QueuedEmail) => {
        try {
          const { sendEmailNotification } = await import('./notifyAgentsForLead');
          await sendEmailNotification({
            to: email.agent_email,
            agentName: email.agent_name,
            city: email.city,
            province: email.province,
            urgency: email.urgency,
            price: email.price,
            leadUrl: email.lead_url,
          });

          // Mark as sent
          await supabaseAdmin
            .from('email_queue')
            .update({ 
              status: 'sent',
              processed_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          return { success: true, id: email.id };
        } catch (err: any) {
          // Mark as failed
          await supabaseAdmin
            .from('email_queue')
            .update({ 
              status: 'failed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          return { success: false, id: email.id, error: err };
        }
      });

      await Promise.all(sendPromises);

      // Delay between batches
      if (i + BATCH_SIZE < pendingEmails.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`✅ Processed ${pendingEmails.length} queued emails`);
    
    // If there are more pending emails, process them (recursive)
    const { count } = await supabaseAdmin
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (count && count > 0) {
      // Process next batch after a short delay
      setTimeout(() => {
        processEmailQueue().catch(err => {
          console.error('❌ Error in recursive queue processing:', err);
        });
      }, 1000);
    }
  } catch (err) {
    console.error('❌ Error processing email queue:', err);
  }
}

