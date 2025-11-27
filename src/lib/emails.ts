// src/lib/emails.ts
// Email helper functions using Resend API

type ConsumerEmailArgs = {
  to: string;
  name?: string | null;
  requestedDate: string;
  requestedWindow: string;
};

type AgentEmailArgs = {
  to: string;
  agentName?: string | null;
  consumerName?: string | null;
  requestedDate: string;
  requestedWindow: string;
  city?: string | null;
  province?: string | null;
  serviceType?: string | null;
};

/**
 * Send booking confirmation email to consumer/family
 */
export async function sendConsumerBookingEmail({
  to,
  name,
  requestedDate,
  requestedWindow,
}: ConsumerEmailArgs) {
  if (!to) {
    console.warn('sendConsumerBookingEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendConsumerBookingEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

  const prettyDate = new Date(requestedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeWindowLabel = requestedWindow.charAt(0).toUpperCase() + requestedWindow.slice(1);

  // Format from email properly for Resend - always brand as Soradin
  let fromEmail = resendFromEmail;
  if (fromEmail && !fromEmail.includes('<')) {
    fromEmail = `Soradin <${fromEmail}>`;
  } else if (fromEmail && fromEmail.includes('<')) {
    // Replace name with Soradin
    const emailMatch = fromEmail.match(/<(.+@.+?)>/);
    if (emailMatch) {
      fromEmail = `Soradin <${emailMatch[1]}>`;
    }
  } else {
    fromEmail = 'Soradin <notifications@soradin.com>';
  }

  try {
    // Clean siteUrl for logo
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    console.log('📧 Sending request to Resend API for consumer booking email...', {
      to,
      from: fromEmail,
      timestamp: new Date().toISOString(),
    });

    const fetchStartTime = Date.now();
    console.log('📧 Step 1: Starting email send process...', { timestamp: new Date().toISOString() });
    
    // Add timeout to prevent hanging (30 seconds)
    // Use Promise.race to ensure timeout works in server environment
    console.log('📧 Step 2: Creating timeout promise...', { timestamp: new Date().toISOString() });
    
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const duration = Date.now() - fetchStartTime;
        console.error('❌ Resend API request timeout after 30 seconds for consumer booking email', {
          to,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
        reject(new Error('Request timeout after 30 seconds'));
      }, 30000);
    });

    console.log('📧 Step 3: Building email body...', { timestamp: new Date().toISOString() });
    
    // Build email body first
    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: 'Your pre-need planning call is booked',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f7f4ef; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                  <!-- Header with Logo -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(to bottom, #faf8f5, #ffffff);">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="height: 48px; width: auto; margin: 0 auto 12px; display: block; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <div style="display: none;">
                        <h1 style="color: #2a2a2a; font-size: 32px; font-weight: 300; letter-spacing: -0.5px; margin: 0;">Soradin</h1>
                        <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 8px 0 0 0;">Pre-Planning</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #2a2a2a; font-size: 24px; font-weight: 400; margin: 0 0 20px; letter-spacing: -0.3px;">Your planning call is booked</h2>
                      
                      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${name || 'there'},</p>
                      
                      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                        Thank you for using Soradin to start your pre-need planning. We've received your request for a call on <strong>${prettyDate}</strong> (${timeWindowLabel}).
                      </p>
                      
                      <div style="background-color: #f7f4ef; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Date:</strong> ${prettyDate}</p>
                        <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Time:</strong> ${timeWindowLabel}</p>
                      </div>
                      
                      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 24px 0 16px;">
                        A licensed specialist will contact you at that time to walk you through options, answer questions, and help you move at your own pace.
                      </p>
                      
                      <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">
                        If you didn't request this, you can ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #faf8f5; border-top: 1px solid #e5e5e5;">
                      <p style="color: #6b6b6b; font-size: 12px; margin: 0; text-align: center;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: [
        `Hi ${name || 'there'},`,
        '',
        `Thank you for using Soradin to start your pre-need planning.`,
        `We've received your request for a call on ${prettyDate} (${timeWindowLabel}).`,
        '',
        'A licensed specialist will contact you at that time to walk you through options, answer questions, and help you move at your own pace.',
        '',
        `If you didn't request this, you can ignore this email.`,
        '',
        '— Soradin',
      ].join('\n'),
    };
    
    console.log('📧 Step 4: Email body built, creating fetch promise...', { 
      timestamp: new Date().toISOString(),
      bodySize: JSON.stringify(emailBody).length,
    });
    
    const fetchPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    console.log('📧 Starting Promise.race (fetch vs timeout)...', { 
      timestamp: new Date().toISOString(),
      hasTimeoutId: timeoutId !== undefined,
    });
    
    // Add a heartbeat to verify the function is still running
    console.log('📧 Setting up heartbeat interval...', { timestamp: new Date().toISOString() });
    const heartbeatInterval = setInterval(() => {
      const elapsed = Date.now() - fetchStartTime;
      console.log('💓 Email send heartbeat:', {
        elapsed: `${elapsed}ms`,
        timestamp: new Date().toISOString(),
        to,
      });
    }, 5000); // Every 5 seconds
    
    console.log('📧 Heartbeat interval set up, about to await Promise.race...', { 
      timestamp: new Date().toISOString(),
      intervalId: heartbeatInterval ? 'set' : 'not set',
    });
    
    let resendResponse: Response;
    try {
      console.log('📧 About to await Promise.race...', { timestamp: new Date().toISOString() });
      resendResponse = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('📧 Promise.race resolved, cleaning up...', { timestamp: new Date().toISOString() });
      clearInterval(heartbeatInterval);
      if (timeoutId) clearTimeout(timeoutId);
      console.log('📧 Promise.race completed successfully', { timestamp: new Date().toISOString() });
    } catch (raceError: any) {
      console.log('📧 Promise.race rejected, cleaning up...', { timestamp: new Date().toISOString() });
      clearInterval(heartbeatInterval);
      if (timeoutId) clearTimeout(timeoutId);
      console.error('❌ Promise.race error:', {
        error: raceError?.message || raceError,
        name: raceError?.name,
        code: raceError?.code,
        to,
        timestamp: new Date().toISOString(),
      });
      throw raceError;
    }
    
    const fetchDuration = Date.now() - fetchStartTime;
    console.log('📧 Resend API response received for consumer booking email:', {
      status: resendResponse.status,
      statusText: resendResponse.statusText,
      ok: resendResponse.ok,
      duration: `${fetchDuration}ms`,
      timestamp: new Date().toISOString(),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error for consumer booking email:', {
        status: resendResponse.status,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const responseData = await resendResponse.json().catch(() => ({}));
    console.log(`✅ Consumer booking email sent successfully to ${to}`, {
      emailId: responseData?.id,
      status: resendResponse.status,
    });
  } catch (err: any) {
    // Check if it's an abort error (timeout)
    if (err?.name === 'AbortError' || err?.code === 'ECONNRESET') {
      console.error('❌ Resend API request failed (network/timeout):', {
        error: err?.message || err,
        code: err?.code,
        name: err?.name,
        to,
        suggestion: 'Check network connectivity, firewall settings, or Resend API status',
      });
    } else {
      console.error('❌ Error sending consumer booking email:', {
        error: err?.message || err,
        cause: err?.cause,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
        to,
      });
    }
    // Re-throw so the caller knows it failed
    throw err;
  }
}

/**
 * Send notification email to agent when they purchase an appointment
 */
export async function sendAgentNewAppointmentEmail({
  to,
  agentName,
  consumerName,
  requestedDate,
  requestedWindow,
  city,
  province,
  serviceType,
}: AgentEmailArgs) {
  if (!to) {
    console.warn('sendAgentNewAppointmentEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendAgentNewAppointmentEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

  const prettyDate = new Date(requestedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeWindowLabel = requestedWindow.charAt(0).toUpperCase() + requestedWindow.slice(1);
  const location = city && province ? `${city}, ${province}` : city || province || 'Location not specified';

  // Format from email properly for Resend - always brand as Soradin
  let fromEmail = resendFromEmail;
  if (fromEmail && !fromEmail.includes('<')) {
    fromEmail = `Soradin <${fromEmail}>`;
  } else if (fromEmail && fromEmail.includes('<')) {
    const emailMatch = fromEmail.match(/<(.+@.+?)>/);
    if (emailMatch) {
      fromEmail = `Soradin <${emailMatch[1]}>`;
    }
  } else {
    fromEmail = 'Soradin <notifications@soradin.com>';
  }

  try {
    // Clean siteUrl for logo
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: 'New Soradin appointment booked',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f7f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f7f4ef; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
                    <!-- Header with Logo -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(to bottom, #faf8f5, #ffffff);">
                        <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="height: 48px; width: auto; margin: 0 auto 12px; display: block; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div style="display: none;">
                          <h1 style="color: #2a2a2a; font-size: 32px; font-weight: 300; letter-spacing: -0.5px; margin: 0;">Soradin</h1>
                          <p style="color: #6b6b6b; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin: 8px 0 0 0;">Pre-Planning</p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #2a2a2a; font-size: 24px; font-weight: 400; margin: 0 0 20px; letter-spacing: -0.3px;">New appointment booked</h2>
                        
                        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">Hi ${agentName || 'there'},</p>
                        
                        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                          You have a new booked Soradin appointment.
                        </p>
                        
                        <div style="background-color: #f7f4ef; padding: 20px; border-radius: 8px; margin: 24px 0;">
                          <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Date:</strong> ${prettyDate}</p>
                          <p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Time window:</strong> ${timeWindowLabel}</p>
                          ${location ? `<p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Location:</strong> ${location}</p>` : ''}
                          ${serviceType ? `<p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Service type:</strong> ${serviceType}</p>` : ''}
                          ${consumerName ? `<p style="margin: 8px 0; color: #2a2a2a; font-size: 16px;"><strong>Client:</strong> ${consumerName}</p>` : ''}
                        </div>
                        
                        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 24px 0 16px;">
                          Log in to your Soradin agent portal to see full details and contact information.
                        </p>
                        
                        <p style="margin: 30px 0 0;">
                          <a href="${cleanSiteUrl}/agent/my-appointments" style="background-color: #2a2a2a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">
                            View My Appointments
                          </a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #faf8f5; border-top: 1px solid #e5e5e5;">
                        <p style="color: #6b6b6b; font-size: 12px; margin: 0; text-align: center;">
                          © ${new Date().getFullYear()} Soradin. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: [
          `Hi ${agentName || 'there'},`,
          '',
          'You have a new booked Soradin appointment.',
          '',
          `Date: ${prettyDate}`,
          `Time window: ${timeWindowLabel}`,
          location !== 'Location not specified' ? `Location: ${location}` : '',
          serviceType ? `Service type: ${serviceType}` : '',
          consumerName ? `Client: ${consumerName}` : '',
          '',
          'Log in to Soradin to see full details and contact information.',
          '',
          '— Soradin',
        ]
          .filter(Boolean)
          .join('\n'),
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error for agent appointment email:', {
        status: resendResponse.status,
        error: errorText,
      });
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    console.log(`✅ Agent appointment email sent to ${to}`);
  } catch (err: any) {
    console.error('❌ Error sending agent appointment email:', err);
    // Don't throw - email failure shouldn't break appointment purchase
  }
}

