// src/lib/sms.ts
// SMS helper functions using Twilio API

import { DateTime } from 'luxon';
import { PROVINCE_TO_TIMEZONE, CanadianTimezone } from './timezone';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send SMS message using Twilio API
 */
async function sendSMS(to: string, message: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('📱 SMS: Twilio credentials not set, skipping SMS');
    return;
  }

  if (!to || !to.trim()) {
    console.warn('📱 SMS: No phone number provided');
    return;
  }

  // Format phone number (ensure it starts with +)
  let formattedPhone = to.trim();
  if (!formattedPhone.startsWith('+')) {
    // Assume Canadian number, add +1
    formattedPhone = '+1' + formattedPhone.replace(/[^\d]/g, '');
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Twilio API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        to: formattedPhone,
      });
      throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ SMS sent successfully:', {
      sid: result.sid,
      to: formattedPhone,
    });
  } catch (error: any) {
    console.error('❌ Error sending SMS:', {
      error: error.message,
      to: formattedPhone,
    });
    throw error;
  }
}

/**
 * Format date for SMS display
 * Formats as "Monday, January 15, 2026"
 */
function formatDateForSMS(dateStr: string): string {
  // dateStr is in YYYY-MM-DD format
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time window for SMS display
 */
function formatTimeWindowForSMS(window: string): string {
  const windowMap: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  };
  return windowMap[window] || window;
}

/**
 * Format time for SMS when we have a specific time (UTC ISO string)
 * Uses consumer's province timezone for display
 */
function formatTimeForSMS(utcISO: string, province: string): string {
  const { DateTime } = require('luxon');
  const { PROVINCE_TO_TIMEZONE } = require('./timezone');
  
  // Get timezone from province
  const provinceUpper = province.toUpperCase().trim();
  const timezone = PROVINCE_TO_TIMEZONE[provinceUpper] || 'America/Vancouver';
  
  const utcDateTime = DateTime.fromISO(utcISO, { zone: 'utc' });
  const localDateTime = utcDateTime.setZone(timezone);
  
  const hours = localDateTime.hour;
  const minutes = localDateTime.minute;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  
  // Calculate end time (assuming 1 hour appointment)
  const endDateTime = localDateTime.plus({ hours: 1 });
  const endHours = endDateTime.hour % 12 || 12;
  const endAmpm = endDateTime.hour >= 12 ? 'PM' : 'AM';
  const endTimeStr = `${endHours}:${String(endDateTime.minute).padStart(2, '0')} ${endAmpm}`;
  
  return `${timeStr} - ${endTimeStr}`;
}

/**
 * Send booking confirmation SMS to consumer/family
 */
export async function sendConsumerBookingSMS({
  to,
  agentName,
  requestedDate,
  requestedWindow,
  province,
  confirmedAt,
  appointmentType,
  videoLink,
}: {
  to: string;
  agentName?: string;
  requestedDate: string;
  requestedWindow: string;
  province?: string;
  confirmedAt?: string;
  appointmentType?: "in-person" | "video";
  videoLink?: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendConsumerBookingSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  
  // Use specific time if available, otherwise use window
  let timeDisplay: string;
  if (confirmedAt && province) {
    timeDisplay = formatTimeForSMS(confirmedAt, province);
  } else {
    timeDisplay = formatTimeWindowForSMS(requestedWindow);
  }

  // Agent name is optional (appointments may be created before agent is assigned)
  const agentPart = agentName ? ` with ${agentName}` : '';
  
  // Different message for video vs in-person
  let message: string;
  if (appointmentType === "video" && videoLink) {
    message = `Soradin: Your video call appointment${agentPart} is confirmed for ${formattedDate} at ${timeDisplay}. Join your call: ${videoLink} Reply STOP to opt out.`;
  } else {
    message = `Soradin: Your appointment${agentPart} is confirmed for ${formattedDate} at ${timeDisplay}. Please arrive 10 minutes early. Reply STOP to opt out.`;
  }

  await sendSMS(to, message);
}

/**
 * Send cancellation confirmation SMS to consumer/family
 */
export async function sendConsumerCancellationSMS({
  to,
  requestedDate,
  province,
}: {
  to: string;
  requestedDate: string;
  province?: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendConsumerCancellationSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.soradin.com';
  
  const message = `Soradin: Your appointment for ${formattedDate} has been cancelled. To reschedule, visit ${siteUrl} or contact your agent. Reply STOP to opt out.`;

  await sendSMS(to, message);
}

/**
 * Send new appointment notification SMS to agent
 */
export async function sendAgentNewAppointmentSMS({
  to,
  consumerName,
  requestedDate,
  requestedWindow,
  province,
  confirmedAt,
  appointmentType,
  videoLink,
}: {
  to: string;
  consumerName: string;
  requestedDate: string;
  requestedWindow: string;
  province?: string;
  confirmedAt?: string;
  appointmentType?: "in-person" | "video";
  videoLink?: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendAgentNewAppointmentSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  
  // Use specific time if available, otherwise use window
  let timeDisplay: string;
  if (confirmedAt && province) {
    timeDisplay = formatTimeForSMS(confirmedAt, province);
  } else {
    timeDisplay = formatTimeWindowForSMS(requestedWindow);
  }

  // Different message for video vs in-person
  let message: string;
  if (appointmentType === "video" && videoLink) {
    message = `Soradin: New video call booked with ${consumerName} on ${formattedDate} at ${timeDisplay}. Join: ${videoLink} Check portal for details.`;
  } else {
    message = `Soradin: New appointment booked with ${consumerName} on ${formattedDate} at ${timeDisplay}. Check your agent portal for details.`;
  }

  await sendSMS(to, message);
}

/**
 * Send appointment cancellation notification SMS to agent
 */
export async function sendAgentCancellationSMS({
  to,
  consumerName,
  requestedDate,
  province,
}: {
  to: string;
  consumerName: string;
  requestedDate: string;
  province?: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendAgentCancellationSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  
  const message = `Soradin: Appointment with ${consumerName} on ${formattedDate} has been cancelled. Check your agent portal for details.`;

  await sendSMS(to, message);
}

/**
 * Send reminder SMS to consumer for video call (10 minutes before)
 */
export async function sendConsumerVideoReminderSMS({
  to,
  agentName,
  requestedDate,
  province,
  confirmedAt,
  videoLink,
}: {
  to: string;
  agentName?: string;
  requestedDate: string;
  province?: string;
  confirmedAt: string;
  videoLink: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendConsumerVideoReminderSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  const timeDisplay = formatTimeForSMS(confirmedAt, province || 'BC');
  
  const agentPart = agentName ? ` with ${agentName}` : '';
  const message = `Soradin: Your video call${agentPart} starts in 10 minutes (${formattedDate} at ${timeDisplay}). Join now: ${videoLink} Reply STOP to opt out.`;

  await sendSMS(to, message);
}

/**
 * Send reminder SMS to consumer for in-person appointment (1 hour before)
 */
export async function sendConsumerInPersonReminderSMS({
  to,
  agentName,
  requestedDate,
  province,
  confirmedAt,
}: {
  to: string;
  agentName?: string;
  requestedDate: string;
  province?: string;
  confirmedAt: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendConsumerInPersonReminderSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  const timeDisplay = formatTimeForSMS(confirmedAt, province || 'BC');
  
  const agentPart = agentName ? ` with ${agentName}` : '';
  const message = `Soradin: Reminder: Your appointment${agentPart} is in 1 hour (${formattedDate} at ${timeDisplay}). Please arrive 10 minutes early. Reply STOP to opt out.`;

  await sendSMS(to, message);
}

/**
 * Send reminder SMS to agent for video call (10 minutes before)
 */
export async function sendAgentVideoReminderSMS({
  to,
  consumerName,
  requestedDate,
  province,
  confirmedAt,
  videoLink,
}: {
  to: string;
  consumerName: string;
  requestedDate: string;
  province?: string;
  confirmedAt: string;
  videoLink: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendAgentVideoReminderSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  const timeDisplay = formatTimeForSMS(confirmedAt, province || 'BC');
  
  const message = `Soradin: Video call with ${consumerName} starts in 10 minutes (${formattedDate} at ${timeDisplay}). Join: ${videoLink}`;

  await sendSMS(to, message);
}

/**
 * Send reminder SMS to agent for in-person appointment (1 hour before)
 */
export async function sendAgentInPersonReminderSMS({
  to,
  consumerName,
  requestedDate,
  province,
  confirmedAt,
}: {
  to: string;
  consumerName: string;
  requestedDate: string;
  province?: string;
  confirmedAt: string;
}): Promise<void> {
  if (!to) {
    console.warn('📱 sendAgentInPersonReminderSMS: No phone number provided');
    return;
  }

  const formattedDate = formatDateForSMS(requestedDate);
  const timeDisplay = formatTimeForSMS(confirmedAt, province || 'BC');
  
  const message = `Soradin: Reminder: Appointment with ${consumerName} in 1 hour (${formattedDate} at ${timeDisplay}). Check portal for details.`;

  await sendSMS(to, message);
}
