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

    console.log(`🔍 Fetching approved agents with location settings...`);

    // Get all approved agents with location settings
    const { data: agents, error: agentsError } = await supabaseAdminClient
      .from('profiles')
      .select('id, full_name, agent_latitude, agent_longitude, search_radius_km')
      .eq('role', 'agent')
      .eq('approval_status', 'approved')
      .not('agent_latitude', 'is', null)
      .not('agent_longitude', 'is', null)
      .not('search_radius_km', 'is', null);

    console.log(`🔍 Agent query result:`, {
      hasError: !!agentsError,
      error: agentsError,
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

    // First, filter agents by distance (fast operation)
    const agentsWithinRadius: Array<{ agent: any; distance: number }> = [];
    
    for (const agent of agents) {
      console.log(`🔍 Checking agent: ${agent.full_name} (${agent.id})`, {
        agentLat: agent.agent_latitude,
        agentLon: agent.agent_longitude,
        radius: agent.search_radius_km,
      });

      const agentLat = parseFloat(agent.agent_latitude);
      const agentLon = parseFloat(agent.agent_longitude);
      const radius = agent.search_radius_km || 50; // Default to 50km if not set

      if (isNaN(agentLat) || isNaN(agentLon)) {
        console.log(`⚠️ Skipping agent ${agent.full_name}: Invalid coordinates (${agent.agent_latitude}, ${agent.agent_longitude})`);
        continue; // Skip agents with invalid coordinates
      }

      // Check if lead is within agent's search radius
      // isWithinRadius(agentLat, agentLon, leadLat, leadLon, radiusKm)
      const isWithin = isWithinRadius(agentLat, agentLon, leadLat, leadLon, radius);
      
      console.log(`📍 Distance check for ${agent.full_name}:`, {
        agentLocation: `${agentLat}, ${agentLon}`,
        leadLocation: `${leadLat}, ${leadLon}`,
        radius: `${radius}km`,
        isWithin,
      });
      
      if (isWithin) {
        const { calculateDistance } = await import('./distance');
        const distance = calculateDistance(agentLat, agentLon, leadLat, leadLon);
        agentsWithinRadius.push({ agent, distance });
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

    if (agentsToNotify.length === 0) {
      console.log(`⚠️ No agents within radius for lead ${lead.id} in ${lead.city}, ${lead.province}`);
      console.log(`   Lead location: ${leadLat}, ${leadLon}`);
      console.log(`   Checked ${agents.length} agents with location settings`);
      return;
    }

    console.log(`📬 Preparing to send notifications to ${agentsToNotify.length} agent(s) for lead ${lead.id}`);

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';
    const leadUrl = `${baseUrl}/agent/leads/available`;

    const city = lead.city || 'your area';
    const province = lead.province || '';
    const urgency = lead.urgency_level || 'warm';
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);
    const price = lead.lead_price ? `$${lead.lead_price.toFixed(2)}` : 'See pricing';

    let successCount = 0;
    for (const agent of agentsToNotify) {
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
      } catch (emailError) {
        console.error(`Failed to send notification to ${agent.email}:`, emailError);
        // Continue with other agents even if one fails
      }
    }

    console.log(`✅ [NOTIFY] Sent email notifications to ${successCount}/${agentsToNotify.length} agents for lead ${lead.id} in ${city}, ${province}`);
  } catch (err: any) {
    console.error('❌ [NOTIFY] Error in notifyAgentsForLead:', err);
    console.error('❌ [NOTIFY] Error details:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
      leadId: lead?.id,
    });
    // Don't throw - notification failure shouldn't break lead creation
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

  // Check if Resend is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  console.log(`📧 Email send attempt for ${to}:`, {
    hasResendKey: !!resendApiKey,
    resendKeyLength: resendApiKey?.length || 0,
    fromEmail: resendFromEmail || 'Soradin <notifications@soradin.com>',
  });

  if (resendApiKey) {
    // Use Resend API
    try {
      // Format from email properly for Resend
      // If RESEND_FROM_EMAIL doesn't contain <>, wrap it
      let fromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
      if (fromEmail && !fromEmail.includes('<')) {
        // If it's just an email, wrap it with a name
        fromEmail = `Soradin <${fromEmail}>`;
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
          console.error(`❌ [RESEND] Domain verification required. Please verify your domain in Resend: https://resend.com/domains`);
          console.error(`❌ [RESEND] Current from email: ${fromEmail}`);
          throw new Error(`Domain not verified in Resend. Please verify ${fromEmail.split('@')[1]?.split('>')[0] || 'your domain'} at https://resend.com/domains`);
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

