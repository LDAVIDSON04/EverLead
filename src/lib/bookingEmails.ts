// src/lib/bookingEmails.ts
// Email functions for booking confirmations

import { supabaseAdmin } from './supabaseAdmin';

export async function sendBookingConfirmationEmail(
  to: string,
  recipientName: string,
  appointmentDate: string,
  appointmentWindow: string,
  agentName: string,
  familyName: string,
  isFamily: boolean
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Soradin <notifications@soradin.com>';
  
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }

  const windowLabel = appointmentWindow === "morning" ? "Morning" : 
                     appointmentWindow === "afternoon" ? "Afternoon" : "Evening";
  
  const subject = isFamily 
    ? `Appointment Confirmed with ${agentName}`
    : `New Appointment: ${familyName}`;
  
  const greeting = isFamily
    ? `Hi ${recipientName},`
    : `Hi ${recipientName},`;
  
  const mainContent = isFamily
    ? `<p>Your appointment with <strong>${agentName}</strong> has been confirmed.</p>
       <div style="background-color: #f7f4ef; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
         <p style="margin: 5px 0;"><strong>Time:</strong> ${windowLabel}</p>
       </div>
       <p>We look forward to helping you with your pre-need planning.</p>`
    : `<p>You have a new appointment scheduled.</p>
       <div style="background-color: #f7f4ef; padding: 15px; border-radius: 8px; margin: 20px 0;">
         <p style="margin: 5px 0;"><strong>Family:</strong> ${familyName}</p>
         <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
         <p style="margin: 5px 0;"><strong>Time:</strong> ${windowLabel}</p>
       </div>
       <p>Please prepare for this appointment in your agent portal.</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #064e3b; font-size: 28px; margin: 0;">Soradin</h1>
      </div>
      <h2 style="color: #2a2a2a; margin-bottom: 20px;">${subject}</h2>
      ${greeting}
      ${mainContent}
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
      <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Soradin. All rights reserved.
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Error sending booking email:", error);
      throw new Error(`Resend API error: ${response.status}`);
    }

    console.log(`✅ Booking confirmation email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Error sending booking email to ${to}:`, error);
    throw error;
  }
}
