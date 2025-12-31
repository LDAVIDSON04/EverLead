// src/lib/emails.ts
// Email helper functions using Resend API

type ConsumerEmailArgs = {
  to: string;
  name?: string | null;
  requestedDate: string;
  requestedWindow: string;
  appointmentId?: string; // Optional appointment ID for cancel link
  confirmedAt?: string; // Exact appointment time
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
  confirmedAt?: string; // Exact appointment time
  locationAddress?: string | null;
  clientEmail?: string | null;
};

type ReviewFollowUpEmailArgs = {
  to: string;
  familyName?: string | null;
  agentName?: string | null;
  appointmentId: string;
  token: string; // Token for review submission
};

type PaymentDeclineEmailArgs = {
  to: string;
  agentName?: string | null;
  appointmentId: string;
  amountCents: number;
  declineReason?: string | null;
};

/**
 * Send booking confirmation email to consumer/family
 */
export async function sendConsumerBookingEmail({
  to,
  name,
  requestedDate,
  requestedWindow,
  appointmentId,
  confirmedAt,
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

      // Parse date as local date to avoid timezone shift
      // requestedDate is in YYYY-MM-DD format from database
      const [year, month, day] = requestedDate.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      const prettyDate = date.toLocaleDateString('en-US', {
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

    const fetchStartTime = Date.now();
    
    // Add timeout to prevent hanging (30 seconds)
    // Use Promise.race to ensure timeout works in server environment
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const duration = Date.now() - fetchStartTime;
        console.error('❌ Resend API request timeout after 30 seconds for consumer booking email', {
          to,
          duration: `${duration}ms`,
        });
        reject(new Error('Request timeout after 30 seconds'));
      }, 30000);
    });
    
    // Build email body
    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: `Appointment Confirmed - ${prettyDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">Appointment Confirmed</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${name || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Your appointment has been confirmed for <strong>${prettyDate}</strong> during the <strong>${timeWindowLabel}</strong>.
                      </p>
                      
                      ${appointmentId ? `
                      <div style="background-color: #f9f9f9; border-left: 4px solid #0D5C3D; padding: 15px 20px; margin: 30px 0;">
                        <p style="color: #666666; font-size: 14px; margin: 0;">
                          Need to cancel or reschedule? <a href="${cleanSiteUrl}/book/cancel?appointmentId=${appointmentId}" style="color: #0D5C3D; text-decoration: none;">Click here</a>
                        </p>
                      </div>
                      ` : ''}
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        We look forward to meeting with you.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const fetchPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for consumer booking email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Consumer booking email sent successfully:', {
      emailId: result.id,
      to,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending consumer booking email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}

/**
 * Send booking notification email to agent
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
  confirmedAt,
  locationAddress,
  clientEmail,
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

  // Parse date
  const [year, month, day] = requestedDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const prettyDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeWindowLabel = requestedWindow.charAt(0).toUpperCase() + requestedWindow.slice(1);

  // Format time if confirmedAt is provided
  let timeDisplay = timeWindowLabel;
  if (confirmedAt) {
    try {
      const { DateTime } = await import('luxon');
      const confirmedDate = DateTime.fromISO(confirmedAt, { zone: "utc" });
      // Infer timezone from province
      let timezone = "America/Vancouver";
      if (province) {
        const prov = province.toUpperCase();
        if (prov === "BC" || prov === "BRITISH COLUMBIA") timezone = "America/Vancouver";
        else if (prov === "AB" || prov === "ALBERTA") timezone = "America/Edmonton";
        else if (prov === "SK" || prov === "SASKATCHEWAN") timezone = "America/Regina";
        else if (prov === "MB" || prov === "MANITOBA") timezone = "America/Winnipeg";
        else if (prov === "ON" || prov === "ONTARIO") timezone = "America/Toronto";
        else if (prov === "QC" || prov === "QUEBEC") timezone = "America/Montreal";
      }
      const localDate = confirmedDate.setZone(timezone);
      const hours = localDate.hour;
      const minutes = localDate.minute;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      timeDisplay = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
    }
  }

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
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: `New Appointment: ${consumerName || 'Client'} - ${prettyDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Appointment</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">New Appointment Scheduled</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${agentName || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        You have a new appointment scheduled:
                      </p>
                      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Client:</strong> ${consumerName || 'Not specified'}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Date:</strong> ${prettyDate}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Time:</strong> ${timeDisplay}</p>
                        ${locationAddress ? `<p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Location:</strong> ${locationAddress}</p>` : ''}
                        ${city || province ? `<p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Area:</strong> ${[city, province].filter(Boolean).join(', ')}</p>` : ''}
                        ${serviceType ? `<p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Service:</strong> ${serviceType}</p>` : ''}
                        ${clientEmail ? `<p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Client Email:</strong> ${clientEmail}</p>` : ''}
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for agent appointment email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Agent appointment email sent successfully:', {
      emailId: result.id,
      to,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending agent appointment email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}

/**
 * Send cancellation notification email to agent
 */
export async function sendAgentCancellationEmail({
  to,
  agentName,
  consumerName,
  requestedDate,
  requestedWindow,
}: AgentEmailArgs) {
  if (!to) {
    console.warn('sendAgentCancellationEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendAgentCancellationEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

  const [year, month, day] = requestedDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const prettyDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeWindowLabel = requestedWindow.charAt(0).toUpperCase() + requestedWindow.slice(1);

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
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: `Appointment Cancelled: ${consumerName || 'Client'} - ${prettyDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">Appointment Cancelled</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${agentName || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        The following appointment has been cancelled:
                      </p>
                      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Client:</strong> ${consumerName || 'Not specified'}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Date:</strong> ${prettyDate}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Time:</strong> ${timeWindowLabel}</p>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for agent cancellation email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Agent cancellation email sent successfully:', {
      emailId: result.id,
      to,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending agent cancellation email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}

/**
 * Send rebooking notification email to agent
 */
export async function sendAgentRebookingEmail({
  to,
  agentName,
  consumerName,
  requestedDate,
  requestedWindow,
}: AgentEmailArgs) {
  if (!to) {
    console.warn('sendAgentRebookingEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendAgentRebookingEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

  const [year, month, day] = requestedDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const prettyDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeWindowLabel = requestedWindow.charAt(0).toUpperCase() + requestedWindow.slice(1);

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
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: `Appointment Reschedule Request: ${consumerName || 'Client'} - ${prettyDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reschedule Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">Appointment Reschedule Request</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${agentName || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        ${consumerName || 'A client'} has requested to reschedule their appointment:
                      </p>
                      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Client:</strong> ${consumerName || 'Not specified'}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Original Date:</strong> ${prettyDate}</p>
                        <p style="color: #2a2a2a; font-size: 16px; margin: 8px 0;"><strong>Original Time:</strong> ${timeWindowLabel}</p>
                      </div>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        They will be selecting a new time slot. Please check your calendar for the updated appointment.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for agent rebooking email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Agent rebooking email sent successfully:', {
      emailId: result.id,
      to,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending agent rebooking email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}

/**
 * Send review follow-up email to family (24 hours after appointment)
 */
export async function sendReviewFollowUpEmail({
  to,
  familyName,
  agentName,
  appointmentId,
  token,
}: ReviewFollowUpEmailArgs) {
  if (!to) {
    console.warn('sendReviewFollowUpEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendReviewFollowUpEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

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
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const reviewUrl = `${cleanSiteUrl}/review?appointmentId=${appointmentId}&token=${token}`;

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: `How was your appointment with ${agentName || 'your specialist'}?`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Share Your Experience</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">How was your appointment?</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${familyName || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        We hope your appointment with <strong>${agentName || 'your specialist'}</strong> went well. Your feedback helps us improve and helps other families find the right specialist.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${reviewUrl}" style="display: inline-block; background-color: #0D5C3D; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                          Share Your Experience
                        </a>
                      </div>
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                        This link will expire in 30 days.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        Thank you for choosing Soradin.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for review follow-up email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Review follow-up email sent successfully:', {
      emailId: result.id,
      to,
      appointmentId,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending review follow-up email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}

/**
 * Send payment decline notification email to agent
 */
export async function sendPaymentDeclineEmail({
  to,
  agentName,
  appointmentId,
  amountCents,
  declineReason,
}: PaymentDeclineEmailArgs) {
  if (!to) {
    console.warn('sendPaymentDeclineEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendPaymentDeclineEmail: RESEND_API_KEY not set, skipping email');
    return;
  }

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
    let cleanSiteUrl = (siteUrl || '').trim().replace(/\/+$/, '');
    if (!cleanSiteUrl.startsWith('http')) {
      cleanSiteUrl = `https://${cleanSiteUrl}`;
    }

    const billingUrl = `${cleanSiteUrl}/agent/billing`;

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: 'Action Required: Update Your Payment Method',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Method Declined</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                      <img src="${cleanSiteUrl}/logo.png" alt="Soradin" style="max-width: 150px; height: auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h1 style="color: #2a2a2a; font-size: 24px; margin: 0 0 20px 0;">Payment Method Declined</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${agentName || 'there'},
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        We were unable to process the payment for an appointment booking. Your account has been temporarily paused, and you will not appear in search results until you update your payment method.
                      </p>
                      
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin: 30px 0;">
                        <p style="color: #856404; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">Appointment Details:</p>
                        <p style="color: #856404; font-size: 14px; margin: 5px 0;"><strong>Amount:</strong> $${(amountCents / 100).toFixed(2)} CAD</p>
                        <p style="color: #856404; font-size: 14px; margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
                        ${declineReason ? `<p style="color: #856404; font-size: 14px; margin: 5px 0;"><strong>Reason:</strong> ${declineReason}</p>` : ''}
                      </div>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
                        <strong>What you need to do:</strong>
                      </p>
                      <ol style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 25px;">
                        <li>Log in to your agent portal</li>
                        <li>Go to the Billing section</li>
                        <li>Update your payment method</li>
                        <li>Once updated, we'll automatically charge the outstanding payment</li>
                        <li>Your account will be reactivated and you'll appear in search results again</li>
                      </ol>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${billingUrl}" style="display: inline-block; background-color: #0D5C3D; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                          Update Payment Method
                        </a>
                      </div>
                      
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        If you have any questions, please contact our support team.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                        Best regards,<br>
                        The Soradin Team
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
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
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resend API error for payment decline email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Payment decline email sent successfully:', {
      emailId: result.id,
      to,
      appointmentId,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending payment decline email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}
