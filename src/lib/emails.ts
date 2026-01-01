// src/lib/emails.ts
// Email helper functions using Resend API

import fs from 'fs';
import path from 'path';

// Read logo and convert to base64 for inline email images
// Use smaller optimized logo for emails to avoid Gmail truncation
let LOGO_BASE64: string | null = null;
export function getLogoBase64(): string {
  if (!LOGO_BASE64) {
    try {
      // Try email-optimized logo first (60x60), fallback to regular logo
      const emailLogoPath = path.join(process.cwd(), 'public', 'logo-email.png');
      const regularLogoPath = path.join(process.cwd(), 'public', 'logo.png');
      
      let logoPath = emailLogoPath;
      if (!fs.existsSync(logoPath)) {
        logoPath = regularLogoPath;
      }
      
      const logoBuffer = fs.readFileSync(logoPath);
      LOGO_BASE64 = logoBuffer.toString('base64');
      
      // Log if using larger logo as warning
      if (logoPath === regularLogoPath && logoBuffer.length > 50000) {
        console.warn('⚠️ Using large logo for emails - may cause Gmail truncation. Consider creating logo-email.png');
      }
    } catch (error) {
      console.error('Error reading logo file:', error);
      // Return empty string if logo can't be read
      return '';
    }
  }
  return LOGO_BASE64;
}

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

type PaymentReceiptEmailArgs = {
  to: string;
  agentName?: string | null;
  appointmentId: string;
  amountCents: number;
  paymentIntentId: string;
  consumerName?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
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
    
    // Format time if confirmedAt is provided
    let timeDisplay = timeWindowLabel;
    if (confirmedAt) {
      try {
        const { DateTime } = await import('luxon');
        const confirmedDate = DateTime.fromISO(confirmedAt, { zone: "utc" });
        const localDate = confirmedDate.setZone("America/Vancouver");
        const hours = localDate.hour;
        const minutes = localDate.minute;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const endDate = localDate.plus({ hours: 1 });
        const endHours = endDate.hour % 12 || 12;
        const endAmpm = endDate.hour >= 12 ? 'PM' : 'AM';
        timeDisplay = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm} - ${endHours}:${String(endDate.minute).padStart(2, '0')} ${endAmpm}`;
      } catch (error) {
        console.error('Error formatting time:', error);
      }
    }
    
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="80" style="vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%;">
                              <tr>
                                <td align="center" style="vertical-align: middle;">
                                  <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="60" height="60" style="display: block; max-width: 60px; max-height: 60px; border: 0; outline: none; text-decoration: none;" />
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: middle; padding-left: 24px;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">SORADIN</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">Appointment Confirmation</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Date</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${prettyDate}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Time</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${timeDisplay}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Additional Message Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                        <tr>
                          <td style="padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 ${appointmentId ? '12px' : '0'}; line-height: 1.6;">
                              Please arrive 10 minutes before your scheduled appointment time.
                            </p>
                            ${appointmentId ? `<p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.6;">
                              <a href="${cleanSiteUrl}/book/cancel?appointmentId=${appointmentId}" style="color: #0D5C3D; text-decoration: underline; font-weight: 500;">Cancel Or Reschedule Appointment</a>
                            </p>` : ''}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
      const endHours = (hours + 1) % 12 || 12;
      timeDisplay = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm} - ${endHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 32px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="120" height="40" style="display: block; max-width: 120px; max-height: 40px; border: 0; outline: none; text-decoration: none; margin-bottom: 16px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">New Appointment Scheduled</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Date</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${prettyDate}</p>
                    </td>
                  </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Time</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${timeDisplay}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${locationAddress ? `
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Location</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${locationAddress}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;"></td>
                        </tr>
                        ` : ''}
                        ${serviceType ? `
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Service</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${serviceType}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;"></td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">With</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${consumerName || 'Client'}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ${clientEmail ? `
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Contact</p>
                                  <p style="color: #0D5C3D; font-size: 16px; margin: 0; font-weight: normal;">${clientEmail}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ` : '<td width="50%" style="padding-left: 20px; padding-bottom: 20px;"></td>'}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 32px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="120" height="40" style="display: block; max-width: 120px; max-height: 40px; border: 0; outline: none; text-decoration: none; margin-bottom: 16px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">Appointment Cancelled</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Date</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${prettyDate}</p>
                    </td>
                  </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Time</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${timeWindowLabel}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">With</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${consumerName || 'Client'}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 32px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="120" height="40" style="display: block; max-width: 120px; max-height: 40px; border: 0; outline: none; text-decoration: none; margin-bottom: 16px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">Appointment Reschedule Request</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Original Date</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${prettyDate}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Original Time</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${timeWindowLabel}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">With</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${consumerName || 'Client'}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Additional Message Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                        <tr>
                          <td style="padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
                        They will be selecting a new time slot. Please check your calendar for the updated appointment.
                      </p>
                    </td>
                  </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 32px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: middle;">
                            <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="120" height="40" style="display: block; max-width: 120px; max-height: 40px; border: 0; outline: none; text-decoration: none; margin-bottom: 16px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">How was your appointment?</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">With</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${agentName || 'your specialist'}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Additional Message Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                        <tr>
                          <td style="padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                              We hope your appointment went well. Your feedback helps us improve and helps other families find the right specialist.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                              <tr>
                                <td>
                                  <a href="${reviewUrl}" style="display: inline-block; background-color: #0D5C3D; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500;">Share Your Experience</a>
                                </td>
                              </tr>
                            </table>
                            <p style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.5;">
                              This link will expire in 30 days.
                            </p>
                    </td>
                  </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                        © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="80" style="vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%;">
                              <tr>
                                <td align="center" style="vertical-align: middle;">
                                  <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="60" height="60" style="display: block; max-width: 60px; max-height: 60px; border: 0; outline: none; text-decoration: none;" />
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: middle; padding-left: 24px;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">SORADIN</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">Payment Method Declined</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Amount</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">$${(amountCents / 100).toFixed(2)} CAD</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Appointment ID</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${appointmentId}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${declineReason ? `
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Reason</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${declineReason}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                      
                      <!-- Additional Message Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                        <tr>
                          <td style="padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0; line-height: 1.5;">
                              We were unable to process the payment for an appointment booking. Your account has been temporarily paused, and you will not appear in search results until you update your payment method.
                            </p>
                            <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
                              Please <a href="${billingUrl}" style="color: #0D5C3D; text-decoration: underline;">update your payment method</a> to reactivate your account. Once updated, we'll automatically charge the outstanding payment and your account will be reactivated.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                            © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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

/**
 * Send payment receipt email to agent when they are successfully charged
 */
export async function sendPaymentReceiptEmail({
  to,
  agentName,
  appointmentId,
  amountCents,
  paymentIntentId,
  consumerName,
  appointmentDate,
  appointmentTime,
}: PaymentReceiptEmailArgs) {
  if (!to) {
    console.warn('sendPaymentReceiptEmail: No email address provided');
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://soradin.com';

  if (!resendApiKey) {
    console.log('📧 sendPaymentReceiptEmail: RESEND_API_KEY not set, skipping email');
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

    const emailBody = {
      from: fromEmail,
      to: [to],
      subject: 'Payment Receipt - Appointment Booking',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="800" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 800px;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #0D5C3D; padding: 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="80" style="vertical-align: middle;">
                            <table cellpadding="0" cellspacing="0" style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%;">
                              <tr>
                                <td align="center" style="vertical-align: middle;">
                                  <img src="data:image/png;base64,${getLogoBase64()}" alt="Soradin Logo" width="60" height="60" style="display: block; max-width: 60px; max-height: 60px; border: 0; outline: none; text-decoration: none;" />
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align: middle; padding-left: 24px;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0;">SORADIN</h1>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="color: #111827; font-size: 28px; margin: 0 0 32px 0; font-weight: 600; line-height: 1.3;">Payment Receipt</h2>
                      
                      <!-- Two Column Layout for Details -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                        <tr>
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Amount Charged</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">$${(amountCents / 100).toFixed(2)} CAD</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ${consumerName ? `
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Client</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${consumerName}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ` : ''}
                        </tr>
                        ${appointmentDate || appointmentTime ? `
                        <tr>
                          ${appointmentDate ? `
                          <td width="50%" style="padding-right: 16px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Appointment Date</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${appointmentDate}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ` : ''}
                          ${appointmentTime ? `
                          <td width="50%" style="padding-left: 20px; padding-bottom: 20px;">
                            <table cellpadding="0" cellspacing="0" style="border-left: 3px solid #0D5C3D; padding-left: 20px;">
                              <tr>
                                <td style="padding-top: 4px; padding-bottom: 4px;">
                                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Appointment Time</p>
                                  <p style="color: #111827; font-size: 18px; margin: 0; font-weight: 500; line-height: 1.4;">${appointmentTime}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          ` : ''}
                        </tr>
                        ` : ''}
                      </table>
                      
                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                        <tr>
                          <td style="padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
                              This is a receipt for the appointment booking fee that was charged to your payment method on file. This charge was processed immediately when the appointment was booked.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 16px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #ffffff; font-size: 12px;">
                            © ${new Date().getFullYear()} Soradin. All rights reserved.
                          </td>
                          <td align="right" style="color: #9ca3af; font-size: 12px;">
                            This is an automated message, please do not reply.
                          </td>
                        </tr>
                      </table>
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
      console.error('❌ Resend API error for payment receipt email:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to,
      });
      throw new Error(`Resend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Payment receipt email sent successfully:', {
      emailId: result.id,
      to,
      appointmentId,
      paymentIntentId,
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Error sending payment receipt email:', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
}
