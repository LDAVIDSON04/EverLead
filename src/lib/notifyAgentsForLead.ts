// src/lib/notifyAgentsForLead.ts
// Helper to notify agents when a new lead is created in their area

import { supabaseAdmin } from './supabaseAdmin';
import { isWithinRadius } from './distance';

/**
 * Find agents within the lead's location radius and send email notifications
 * Only notifies agents who:
 * 1. Have their location set (agent_latitude, agent_longitude)
 * 2. Have a search radius set (search_radius_km)
 * 3. Are within the lead's location radius
 * 4. Are approved agents
 */
export async function notifyAgentsForLead(lead: any, supabaseAdminClient: any = supabaseAdmin): Promise<void> {
  // Add immediate logging to confirm function is executing
  console.log(`📧 [NOTIFY] ===== NOTIFICATION FUNCTION CALLED =====`);
  console.log(`📧 [NOTIFY] Function execution started for lead ${lead.id}`);
  
  try {
    console.log(`📧 [NOTIFY] Starting notification process for lead ${lead.id}`, {
      leadId: lead.id,
      city: lead.city,
      province: lead.province,
      hasLatitude: !!lead.latitude,
      hasLongitude: !!lead.longitude,
      latitude: lead.latitude,
      longitude: lead.longitude,
      hasSupabaseClient: !!supabaseAdminClient,
    });

    // Check if lead has location data
    if (!lead.latitude || !lead.longitude) {
      console.warn('❌ Cannot notify agents: lead has no location coordinates', { 
        leadId: lead.id,
        city: lead.city,
        province: lead.province,
      });
      return;
    }

    const leadLat = parseFloat(lead.latitude);
    const leadLon = parseFloat(lead.longitude);

    console.log(`📍 Parsed lead coordinates:`, { leadLat, leadLon, isNaNLat: isNaN(leadLat), isNaNLon: isNaN(leadLon) });

    if (isNaN(leadLat) || isNaN(leadLon)) {
      console.warn('❌ Cannot notify agents: lead has invalid coordinates', { leadId: lead.id, lat: lead.latitude, lon: lead.longitude });
      return;
    }

    console.log(`🔍 [NOTIFY] Fetching approved agents with location settings or notification cities...`);
    console.log(`🔍 [NOTIFY] About to execute Supabase query...`);

    // Get all approved agents - either with location settings OR notification cities
    // IMPORTANT: We need to filter by province later, so we fetch agent_province too
    let agents: any[] | null = null;
    let agentsError: any = null;
    
    try {
      console.log(`🔍 [NOTIFY] Executing Supabase query...`);
      const queryResult = await supabaseAdminClient
        .from('profiles')
        .select('id, full_name, agent_latitude, agent_longitude, search_radius_km, notification_cities, agent_province')
        .eq('role', 'agent')
        .eq('approval_status', 'approved');
      
      agents = queryResult.data;
      agentsError = queryResult.error;
      
      console.log(`🔍 [NOTIFY] Supabase query completed`, {
        hasData: !!agents,
        dataLength: agents?.length || 0,
        hasError: !!agentsError,
      });
    } catch (queryException: any) {
      console.error(`❌ [NOTIFY] Exception during Supabase query:`, queryException);
      agentsError = queryException;
    }

    console.log(`🔍 [NOTIFY] Agent query result:`, {
      hasError: !!agentsError,
      error: agentsError,
      errorMessage: agentsError?.message,
      errorCode: agentsError?.code,
      agentsCount: agents?.length || 0,
      agents: agents?.map((a: any) => ({ id: a.id, name: a.full_name })) || [],
    });

    if (agentsError) {
      console.error('❌ Error fetching agents for notification:', agentsError);
      return;
    }

    console.log(`📧 Notification check: Found ${agents?.length || 0} approved agents with location settings for lead ${lead.id}`);

    if (!agents || agents.length === 0) {
      console.log('⚠️ No agents with location settings found to notify');
      return;
    }

    console.log(`🔍 [STEP] About to start distance filtering loop for ${agents.length} agents`);

    // Filter agents by distance - only notify those within their search radius
    const agentsToNotify: Array<{ id: string; full_name: string | null; email: string }> = [];

    console.log(`🔍 [LOOP] Starting to check ${agents.length} agents against lead location (${leadLat}, ${leadLon})`);

    // First, filter agents by city match or distance (fast operation)
    const agentsWithinRadius: Array<{ agent: any; distance: number; reason?: string }> = [];
    
    for (const agent of agents) {
      console.log(`🔍 Checking agent: ${agent.full_name} (${agent.id})`, {
        agentLat: agent.agent_latitude,
        agentLon: agent.agent_longitude,
        radius: agent.search_radius_km,
        notificationCities: agent.notification_cities,
        agentProvince: agent.agent_province,
        leadProvince: lead.province,
      });

      // CRITICAL: Check province match first - agents can only receive notifications for leads in their province
      if (agent.agent_province) {
        const agentProvinceUpper = (agent.agent_province || '').toUpperCase().trim();
        const leadProvinceUpper = (lead.province || '').toUpperCase().trim();
        
        if (agentProvinceUpper !== leadProvinceUpper) {
          console.log(`⏭️ [LOOP] Agent ${agent.full_name} (${agent.id}) - Province mismatch: agent is in ${agent.agent_province}, lead is in ${lead.province} - SKIPPING`);
          continue; // Skip this agent - province doesn't match
        }
        console.log(`✅ [LOOP] Agent ${agent.full_name} (${agent.id}) - Province match: ${agent.agent_province} = ${lead.province}`);
      } else {
        console.log(`⚠️ [LOOP] Agent ${agent.full_name} (${agent.id}) - No agent_province set, allowing notification (should set province)`);
      }

      let shouldNotify = false;
      let notificationReason = '';

      // First, check if agent has notification cities set
      if (agent.notification_cities && Array.isArray(agent.notification_cities) && agent.notification_cities.length > 0) {
        const leadCityLower = (lead.city || '').toLowerCase().trim();
        const leadProvinceUpper = (lead.province || '').toUpperCase().trim();
        
        // Check if lead's city matches any of the agent's notification cities
        const matchesCity = agent.notification_cities.some((cityObj: any) => {
          const cityLower = (cityObj.city || '').toLowerCase().trim();
          const provinceUpper = (cityObj.province || '').toUpperCase().trim();
          return cityLower === leadCityLower && provinceUpper === leadProvinceUpper;
        });

        if (matchesCity) {
          shouldNotify = true;
          notificationReason = `Lead city "${lead.city}, ${lead.province}" matches notification city`;
          console.log(`✅ [LOOP] Agent ${agent.full_name} should be notified: ${notificationReason}`);
        } else {
          console.log(`⏭️ [LOOP] Agent ${agent.full_name} (${agent.id}) - Lead city "${lead.city}, ${lead.province}" does not match any notification cities`, {
            agentNotificationCities: agent.notification_cities,
          });
        }
      }

      // If not matched by city, check radius-based location (if agent has location set)
      if (!shouldNotify && agent.agent_latitude && agent.agent_longitude) {
        const agentLat = parseFloat(agent.agent_latitude);
        const agentLon = parseFloat(agent.agent_longitude);
        const radius = agent.search_radius_km || 50; // Default to 50km if not set

        if (!isNaN(agentLat) && !isNaN(agentLon)) {
          // Check if lead is within agent's search radius
          const isWithin = isWithinRadius(agentLat, agentLon, leadLat, leadLon, radius);
          
          console.log(`📍 Distance check for ${agent.full_name}:`, {
            agentLocation: `${agentLat}, ${agentLon}`,
            leadLocation: `${leadLat}, ${leadLon}`,
            radius: `${radius}km`,
            isWithin,
          });
          
          if (isWithin) {
            shouldNotify = true;
            const { calculateDistance } = await import('./distance');
            const distance = calculateDistance(agentLat, agentLon, leadLat, leadLon);
            notificationReason = `Within ${radius}km radius (${distance.toFixed(2)}km away)`;
            console.log(`✅ [LOOP] Agent ${agent.full_name} is within ${radius}km (distance: ${distance.toFixed(2)}km)`);
          } else {
            // Calculate distance for logging
            const { calculateDistance } = await import('./distance');
            const distance = calculateDistance(agentLat, agentLon, leadLat, leadLon);
            console.log(`⏭️ [LOOP] Agent ${agent.full_name} (${agent.id}) is ${distance.toFixed(1)}km away (radius: ${radius}km) - not notifying`, {
              agentLocation: `${agentLat}, ${agentLon}`,
              leadLocation: `${leadLat}, ${leadLon}`,
              calculatedDistance: `${distance.toFixed(2)}km`,
              agentRadius: `${radius}km`,
            });
          }
        } else {
          console.log(`⚠️ Skipping agent ${agent.full_name}: Invalid coordinates (${agent.agent_latitude}, ${agent.agent_longitude})`);
        }
      }

      if (shouldNotify) {
        agentsWithinRadius.push({ agent, distance: 0, reason: notificationReason });
      } else {
        console.log(`⏭️ [LOOP] Agent ${agent.full_name} (${agent.id}) - Not eligible: no city match and not within radius`);
      }
    }

    console.log(`📧 [EMAIL] Found ${agentsWithinRadius.length} agents within radius. Fetching emails in batch...`);

    // Batch fetch all emails at once
    for (const { agent, distance } of agentsWithinRadius) {
      try {
          console.log(`📧 [EMAIL] Starting getUserById for agent ${agent.id} (${agent.full_name})...`);
          console.log(`📧 [EMAIL] supabaseAdminClient available:`, !!supabaseAdminClient);
          console.log(`📧 [EMAIL] supabaseAdminClient.auth available:`, !!supabaseAdminClient?.auth);
          console.log(`📧 [EMAIL] supabaseAdminClient.auth.admin available:`, !!supabaseAdminClient?.auth?.admin);
          
          const getUserStartTime = Date.now();
          
          // Add timeout wrapper to prevent hanging
          let authUser, authUserError;
          try {
            const timeoutId = setTimeout(() => {
              console.error(`❌ [EMAIL] getUserById timeout after 10 seconds for agent ${agent.id}`);
            }, 10000);
            
            const result = await supabaseAdminClient.auth.admin.getUserById(agent.id);
            clearTimeout(timeoutId);
            
            authUser = result?.data;
            authUserError = result?.error;
          } catch (getUserError: any) {
            console.error(`❌ [EMAIL] Exception in getUserById for agent ${agent.id}:`, getUserError);
            authUserError = getUserError;
          }
          
          const getUserDuration = Date.now() - getUserStartTime;
          console.log(`📧 [EMAIL] getUserById completed in ${getUserDuration}ms for agent ${agent.id}`, {
            hasData: !!authUser,
            hasError: !!authUserError,
          });
          
          if (authUserError) {
            console.error(`❌ [EMAIL] Error fetching auth user for agent ${agent.id}:`, authUserError);
            console.error(`❌ [EMAIL] Error details:`, {
              message: authUserError?.message,
              status: authUserError?.status,
              code: authUserError?.code,
            });
            continue;
          }
          
          console.log(`📧 [EMAIL] Auth user data for ${agent.id}:`, {
            hasUser: !!authUser?.user,
            hasEmail: !!authUser?.user?.email,
            email: authUser?.user?.email || 'NOT FOUND',
            userId: authUser?.user?.id,
          });
          
          if (authUser?.user?.email) {
            agentsToNotify.push({
              id: agent.id,
              full_name: agent.full_name,
              email: authUser.user.email,
            });
            console.log(`✅ [EMAIL] Agent ${agent.full_name} (${authUser.user.email}) added to notification list`);
          } else {
            console.log(`⚠️ [EMAIL] Agent ${agent.id} (${agent.full_name}) has no email in auth.users`, {
              authUserData: authUser,
            });
          }
        } catch (authError: any) {
          console.error(`❌ [EMAIL] Exception caught fetching email for agent ${agent.id}:`, authError);
          console.error(`❌ [EMAIL] Exception details:`, {
            message: authError?.message,
            stack: authError?.stack,
            name: authError?.name,
            code: authError?.code,
          });
          // Continue with other agents
        }
    }
    
    console.log(`📧 [EMAIL] Finished fetching emails. Found ${agentsToNotify.length} agents with valid emails out of ${agentsWithinRadius.length} eligible agents.`);

    if (agentsToNotify.length === 0) {
      console.log(`⚠️ No agents eligible for notification for lead ${lead.id} in ${lead.city}, ${lead.province}`);
      console.log(`   Lead location: ${leadLat}, ${leadLon}`);
      console.log(`   Checked ${agents.length} approved agents`);
      console.log(`   Agents checked:`, agents.map((a: any) => ({
        name: a.full_name,
        hasLocation: !!(a.agent_latitude && a.agent_longitude),
        hasNotificationCities: !!(a.notification_cities && Array.isArray(a.notification_cities) && a.notification_cities.length > 0),
        notificationCities: a.notification_cities,
      })));
      return;
    }

    console.log(`📬 [SEND] ===== STARTING EMAIL SENDING PROCESS =====`);
    console.log(`📬 [SEND] Preparing to send notifications to ${agentsToNotify.length} agent(s) for lead ${lead.id}`);

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
    const leadUrl = `${baseUrl}/agent/leads/available`;

    const city = lead.city || 'your area';
    const province = lead.province || '';
    const urgency = lead.urgency_level || 'warm';
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);
    const price = lead.lead_price ? `$${lead.lead_price.toFixed(2)}` : 'See pricing';

    // Process emails in batches to respect Resend rate limits and avoid timeouts
    // Resend allows 2 requests/second, so we'll send 2 emails per second
    // Batch size: 2 emails at a time, with 1 second delay between batches
    const BATCH_SIZE = 2;
    const BATCH_DELAY_MS = 1000; // 1 second between batches (allows 2 req/sec)
    
    let successCount = 0;
    const totalAgents = agentsToNotify.length;
    
    console.log(`📬 Processing ${totalAgents} email notifications in batches of ${BATCH_SIZE}`);
    console.log(`⏱️ Estimated time: ~${Math.ceil(totalAgents / BATCH_SIZE)} seconds`);
    
    // Process agents in batches
    for (let i = 0; i < agentsToNotify.length; i += BATCH_SIZE) {
      const batch = agentsToNotify.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalAgents / BATCH_SIZE);
      
      // Log progress every 10 batches to avoid log spam for large numbers
      if (batchNumber % 10 === 0 || batchNumber === 1 || batchNumber === totalBatches) {
        console.log(`📧 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails) - ${successCount}/${totalAgents} sent so far`);
      }
      
      // Send emails in current batch concurrently (up to BATCH_SIZE at once)
      const batchPromises = batch.map(async (agent, batchIndex) => {
        try {
          await sendEmailNotification({
            to: agent.email,
            agentName: agent.full_name || 'Agent',
            city,
            province,
            urgency: urgencyLabel,
            price,
            leadUrl,
          });
          successCount++;
          // Only log individual sends for small batches to avoid log spam
          if (totalAgents <= 20) {
            console.log(`✅ [NOTIFY] Email sent to ${agent.email} (${i + batchIndex + 1}/${totalAgents})`);
          }
          return { success: true, email: agent.email };
        } catch (emailError: any) {
          console.error(`❌ Failed to send notification to ${agent.email}:`, {
            error: emailError?.message,
            status: emailError?.status,
            code: emailError?.code,
          });
          
          // If it's a rate limit error, we'll handle it after the batch
          return { 
            success: false, 
            email: agent.email, 
            error: emailError,
            isRateLimit: emailError?.status === 429 || emailError?.message?.includes('rate_limit')
          };
        }
      });
      
      // Wait for all emails in batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Check if any emails in this batch hit rate limits
      const rateLimitHit = batchResults.some(r => r.isRateLimit);
      if (rateLimitHit) {
        console.log(`⏳ Rate limit detected, waiting 3 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Add delay between batches (except after the last batch)
      if (i + BATCH_SIZE < agentsToNotify.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    console.log(`📬 Completed processing ${totalAgents} email notifications: ${successCount} successful`);

    console.log(`✅ [NOTIFY] Sent email notifications to ${successCount}/${agentsToNotify.length} agents for lead ${lead.id} in ${city}, ${province}`);
    console.log(`✅ [NOTIFY] ===== NOTIFICATION FUNCTION COMPLETED SUCCESSFULLY =====`);
  } catch (err: any) {
    console.error('❌ [NOTIFY] ===== NOTIFICATION FUNCTION ERROR =====');
    console.error('❌ [NOTIFY] Error in notifyAgentsForLead:', err);
    console.error('❌ [NOTIFY] Error details:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      leadId: lead?.id,
    });
    // Don't throw - notification failure shouldn't break lead creation
    console.error('❌ [NOTIFY] ===== END ERROR =====');
  }
}

interface EmailNotificationParams {
  to: string;
  agentName: string;
  city: string;
  province: string;
  urgency: string;
  price: string;
  leadUrl: string;
}

/**
 * Send email notification using Resend or fallback to console log
 */
async function sendEmailNotification(params: EmailNotificationParams): Promise<void> {
  const { to, agentName, city, province, urgency, price, leadUrl } = params;
  
  console.log(`📧 [SEND-EMAIL] Starting to send email to ${to} for lead in ${city}, ${province}`);

  // Check if Resend is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  
  console.log(`📧 [SEND-EMAIL] Resend configuration check:`, {
    hasApiKey: !!resendApiKey,
    fromEmail: resendFromEmail || 'not set',
  });

  console.log(`📧 Email send attempt for ${to}:`, {
    hasResendKey: !!resendApiKey,
    resendKeyLength: resendApiKey?.length || 0,
    fromEmail: resendFromEmail || 'Soradin <notifications@soradin.com>',
  });

  if (resendApiKey) {
    // Use Resend API
    try {
      // Format from email properly for Resend - always brand as Soradin
      let fromEmail = resendFromEmail || 'Soradin <notifications@soradin.com>';
      
      // Always ensure email is branded as "Soradin" regardless of what's in RESEND_FROM_EMAIL
      if (fromEmail && !fromEmail.includes('<')) {
        // If it's just an email address, wrap it with Soradin name
        fromEmail = `Soradin <${fromEmail}>`;
        console.log(`📧 [RESEND] Wrapped from email: ${fromEmail}`);
      } else if (fromEmail && fromEmail.includes('<')) {
        // If it already has a name, replace it with Soradin
        const emailMatch = fromEmail.match(/<(.+@.+?)>/);
        if (emailMatch) {
          fromEmail = `Soradin <${emailMatch[1]}>`;
          console.log(`📧 [RESEND] Replaced name with Soradin: ${fromEmail}`);
        }
      } else {
        // Fallback
        fromEmail = 'Soradin <notifications@soradin.com>';
        console.log(`📧 [RESEND] Using fallback from email: ${fromEmail}`);
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject: `New Lead Available in ${city}, ${province} - ${urgency} Lead`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${leadUrl.split('/agent')[0]}/logo.png" alt="Soradin" style="height: 40px; width: auto; margin: 0 auto 10px; display: block;" />
                    <div style="display: none;">
                      <h1 style="color: #2a2a2a; font-size: 28px; margin: 0; font-weight: 300;">Soradin</h1>
                      <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 5px 0 0 0;">Pre-Planning</p>
                    </div>
                  </div>
                  <h2 style="color: #2a2a2a; margin-bottom: 20px;">New Lead Available in Your Area</h2>
                  <p>Hi ${agentName},</p>
                  <p>A new pre-need inquiry has been submitted in <strong>${city}, ${province}</strong> and is now available for purchase.</p>
                  <div style="background-color: #f7f4ef; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Location:</strong> ${city}, ${province}</p>
                    <p style="margin: 5px 0;"><strong>Urgency:</strong> ${urgency}</p>
                    <p style="margin: 5px 0;"><strong>Price:</strong> ${price}</p>
                  </div>
                  <p style="margin-top: 30px;">
                    <a href="${leadUrl}" style="background-color: #00A86B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                      View Available Leads
                    </a>
                  </p>
                  <p style="margin-top: 30px; color: #6b6b6b; font-size: 14px;">
                    This is an automated notification from Soradin. You're receiving this because you're a registered agent and this lead is within your service area.
                  </p>
                  <p style="margin-top: 15px; color: #6b6b6b; font-size: 12px;">
                    To update your notification preferences, log in to your agent portal.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
                  <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Soradin. All rights reserved.
                  </p>
                </div>
              `,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.error(`❌ Resend API error for ${to}:`, {
          status: resendResponse.status,
          error: errorText,
          parsedError: errorData,
        });
        
        // If domain not verified, provide helpful error message
        if (resendResponse.status === 403 && errorData?.message?.includes('not verified')) {
          // Extract domain from email (handle both "email@domain.com" and "Name <email@domain.com>" formats)
          const emailMatch = fromEmail.match(/<(.+@(.+))>/);
          const domain = emailMatch ? emailMatch[2] : fromEmail.split('@')[1]?.split('>')[0] || 'unknown';
          
          console.error(`❌ [RESEND] Domain verification error:`, {
            fromEmail,
            extractedDomain: domain,
            domainLowercase: domain.toLowerCase(),
            errorMessage: errorData?.message,
          });
          console.error(`❌ [RESEND] Troubleshooting steps:`);
          console.error(`   1. Check Resend dashboard: https://resend.com/domains`);
          console.error(`   2. Verify domain "${domain}" (case-sensitive) is listed and shows "Verified" status`);
          console.error(`   3. If verified, try using lowercase: "${domain.toLowerCase()}"`);
          console.error(`   4. Ensure DNS records are still valid and not expired`);
          console.error(`   5. Check if the from email "${fromEmail}" matches a verified domain`);
          
          throw new Error(`Domain "${domain}" appears not verified in Resend. Please check https://resend.com/domains. Error: ${errorData?.message}`);
        }
        
        throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
      }

      const responseData = await resendResponse.json().catch(() => ({}));
      console.log(`✅ Email sent successfully to ${to}`, {
        emailId: responseData?.id,
        status: resendResponse.status,
      });
      return;
    } catch (resendError) {
      console.error('Resend API error, falling back to console log:', resendError);
      // Fall through to console log
    }
  }

  // Fallback: log to console (useful for development)
  console.log('📧 Email notification (not sent - no RESEND_API_KEY):', {
    to,
    subject: `New Soradin pre-need lead available in ${city}`,
    agentName,
    city,
    province,
    urgency,
    price,
    leadUrl,
  });
}

