/**
 * CRITICAL TIMEZONE UTILITIES
 * 
 * This file ensures 100% accuracy and consistency for all timezone operations.
 * Any timezone-related code should use these utilities instead of direct Luxon/Date operations.
 */

import { DateTime } from "luxon";

/**
 * Valid Canadian timezones (IANA timezone names)
 */
export const CANADIAN_TIMEZONES = {
  VANCOUVER: "America/Vancouver", // BC - PST/PDT
  EDMONTON: "America/Edmonton",   // AB - MST/MDT
  REGINA: "America/Regina",       // SK - CST (no DST)
  WINNIPEG: "America/Winnipeg",   // MB - CST/CDT
  TORONTO: "America/Toronto",     // ON - EST/EDT
  MONTREAL: "America/Montreal",   // QC - EST/EDT
  HALIFAX: "America/Halifax",     // NB, NS, PE - AST/ADT
  ST_JOHNS: "America/St_Johns",   // NL - NST/NDT
} as const;

export type CanadianTimezone = typeof CANADIAN_TIMEZONES[keyof typeof CANADIAN_TIMEZONES];

/**
 * Province to timezone mapping (for fallback only - timezone should be explicitly stored)
 */
export const PROVINCE_TO_TIMEZONE: Record<string, CanadianTimezone> = {
  BC: CANADIAN_TIMEZONES.VANCOUVER,
  "BRITISH COLUMBIA": CANADIAN_TIMEZONES.VANCOUVER,
  AB: CANADIAN_TIMEZONES.EDMONTON,
  ALBERTA: CANADIAN_TIMEZONES.EDMONTON,
  SK: CANADIAN_TIMEZONES.REGINA,
  SASKATCHEWAN: CANADIAN_TIMEZONES.REGINA,
  MB: CANADIAN_TIMEZONES.WINNIPEG,
  MANITOBA: CANADIAN_TIMEZONES.WINNIPEG,
  ON: CANADIAN_TIMEZONES.TORONTO,
  ONTARIO: CANADIAN_TIMEZONES.TORONTO,
  QC: CANADIAN_TIMEZONES.MONTREAL,
  QUEBEC: CANADIAN_TIMEZONES.MONTREAL,
  NB: CANADIAN_TIMEZONES.HALIFAX,
  "NEW BRUNSWICK": CANADIAN_TIMEZONES.HALIFAX,
  NS: CANADIAN_TIMEZONES.HALIFAX,
  "NOVA SCOTIA": CANADIAN_TIMEZONES.HALIFAX,
  PE: CANADIAN_TIMEZONES.HALIFAX,
  "PRINCE EDWARD ISLAND": CANADIAN_TIMEZONES.HALIFAX,
  NL: CANADIAN_TIMEZONES.ST_JOHNS,
  NEWFOUNDLAND: CANADIAN_TIMEZONES.ST_JOHNS,
} as const;

/**
 * Get agent timezone with strict validation
 * 
 * Priority:
 * 1. Explicitly stored timezone in metadata.timezone
 * 2. Timezone in metadata.availability.timezone
 * 3. Inferred from agent_province (fallback only)
 * 4. Default to America/Vancouver if all else fails
 * 
 * @param metadata - Agent's metadata object
 * @param agentProvince - Agent's province (for fallback inference)
 * @returns Valid IANA timezone name
 */
export function getAgentTimezone(
  metadata?: any,
  agentProvince?: string | null
): CanadianTimezone {
  // Priority 1: Explicit timezone in metadata
  if (metadata?.timezone) {
    const tz = metadata.timezone;
    if (isValidTimezone(tz)) {
      return tz;
    }
    console.error(`⚠️ [TIMEZONE] Invalid timezone in metadata.timezone: ${tz}, using fallback`);
  }

  // Priority 2: Timezone in availability data
  if (metadata?.availability?.timezone) {
    const tz = metadata.availability.timezone;
    if (isValidTimezone(tz)) {
      return tz;
    }
    console.error(`⚠️ [TIMEZONE] Invalid timezone in metadata.availability.timezone: ${tz}, using fallback`);
  }

  // Priority 3: Infer from province (fallback only)
  if (agentProvince) {
    const province = agentProvince.toUpperCase().trim();
    const inferredTz = PROVINCE_TO_TIMEZONE[province];
    if (inferredTz) {
      console.warn(`⚠️ [TIMEZONE] Inferred timezone from province (${province}): ${inferredTz}. Timezone should be explicitly stored.`);
      return inferredTz;
    }
  }

  // Priority 4: Default fallback
  console.warn(`⚠️ [TIMEZONE] Using default timezone (America/Vancouver). Timezone should be explicitly stored.`);
  return CANADIAN_TIMEZONES.VANCOUVER;
}

/**
 * Validate if a timezone string is a valid Canadian timezone
 */
export function isValidTimezone(tz: string): tz is CanadianTimezone {
  return Object.values(CANADIAN_TIMEZONES).includes(tz as CanadianTimezone);
}

/**
 * Validate time string format (HH:MM in 24-hour format)
 * 
 * @param timeStr - Time string to validate (e.g., "09:00", "17:30")
 * @returns true if valid format
 */
export function isValidTimeFormat(timeStr: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Validate business hours (start time should be between 5 AM and 11 PM, end time should be after start)
 * 
 * @param startTime - Start time string (HH:MM)
 * @param endTime - End time string (HH:MM)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateBusinessHours(
  startTime: string,
  endTime: string
): { isValid: boolean; error?: string } {
  if (!isValidTimeFormat(startTime)) {
    return { isValid: false, error: `Invalid start time format: ${startTime}. Must be HH:MM (24-hour format).` };
  }

  if (!isValidTimeFormat(endTime)) {
    return { isValid: false, error: `Invalid end time format: ${endTime}. Must be HH:MM (24-hour format).` };
  }

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Check that end is after start
  if (endMinutes <= startMinutes) {
    return { isValid: false, error: `End time (${endTime}) must be after start time (${startTime}).` };
  }

  // Check for obviously wrong start times (before 5 AM or after 11 PM)
  if (startHour < 5 || startHour >= 23) {
    return {
      isValid: false,
      error: `Start time ${startTime} is unusual (before 5 AM or after 11 PM). Please verify this is correct.`,
    };
  }

  // Check for very long shifts (> 14 hours)
  if (endMinutes - startMinutes > 14 * 60) {
    return {
      isValid: false,
      error: `Availability window is over 14 hours (${startTime} - ${endTime}). Please verify this is correct.`,
    };
  }

  return { isValid: true };
}

/**
 * Convert a local time string (HH:MM) on a specific date (YYYY-MM-DD) in an agent's timezone to UTC ISO string
 * 
 * This is the ONLY way to create UTC timestamps from availability times.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format (24-hour, agent's local time)
 * @param agentTimezone - Agent's IANA timezone name
 * @returns UTC ISO string for the start time
 */
export function localTimeToUTC(dateStr: string, timeStr: string, agentTimezone: CanadianTimezone): string {
  // Validate inputs
  if (!isValidTimeFormat(timeStr)) {
    throw new Error(`Invalid time format: ${timeStr}. Must be HH:MM (24-hour format).`);
  }

  if (!isValidTimezone(agentTimezone)) {
    throw new Error(`Invalid timezone: ${agentTimezone}. Must be a valid Canadian timezone.`);
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Must be YYYY-MM-DD.`);
  }

  // Create DateTime in agent's timezone
  const localDateTimeStr = `${dateStr}T${timeStr}:00`;
  const localDateTime = DateTime.fromISO(localDateTimeStr, { zone: agentTimezone });

  if (!localDateTime.isValid) {
    throw new Error(
      `Invalid date/time combination: ${dateStr} ${timeStr} in timezone ${agentTimezone}. ` +
      `Error: ${localDateTime.invalidReason} - ${localDateTime.invalidExplanation}`
    );
  }

  // Convert to UTC and return ISO string
  const utcISO = localDateTime.toUTC().toISO();
  
  if (!utcISO) {
    throw new Error(`Failed to convert ${dateStr} ${timeStr} (${agentTimezone}) to UTC.`);
  }

  return utcISO;
}

/**
 * Convert a UTC ISO string back to agent's local time
 * 
 * @param utcISO - UTC ISO string
 * @param agentTimezone - Agent's IANA timezone name
 * @returns DateTime object in agent's timezone
 */
export function utcToLocalTime(utcISO: string, agentTimezone: CanadianTimezone): DateTime {
  if (!isValidTimezone(agentTimezone)) {
    throw new Error(`Invalid timezone: ${agentTimezone}. Must be a valid Canadian timezone.`);
  }

  const utcDateTime = DateTime.fromISO(utcISO, { zone: "utc" });

  if (!utcDateTime.isValid) {
    throw new Error(`Invalid UTC ISO string: ${utcISO}. Error: ${utcDateTime.invalidReason}`);
  }

  const localDateTime = utcDateTime.setZone(agentTimezone);

  if (!localDateTime.isValid) {
    throw new Error(`Failed to convert UTC to ${agentTimezone}.`);
  }

  return localDateTime;
}

/**
 * Format a UTC ISO string to display time in agent's timezone (12-hour format with timezone abbreviation)
 * 
 * @param utcISO - UTC ISO string
 * @param agentTimezone - Agent's IANA timezone name
 * @returns Formatted time string (e.g., "9:00 AM EST")
 */
export function formatTimeForDisplay(utcISO: string, agentTimezone: CanadianTimezone): string {
  const localDateTime = utcToLocalTime(utcISO, agentTimezone);
  
  const hours = localDateTime.hour;
  const minutes = localDateTime.minute;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  
  // Get timezone abbreviation (e.g., "EST", "PST")
  const tzAbbrev = localDateTime.offsetNameShort || "";
  
  return tzAbbrev ? `${timeStr} ${tzAbbrev}` : timeStr;
}

/**
 * Format a UTC ISO string to display time in agent's timezone (24-hour format, no timezone)
 * Used for availability slot display where timezone is shown separately
 * 
 * @param utcISO - UTC ISO string
 * @param agentTimezone - Agent's IANA timezone name
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTimeForSlots(utcISO: string, agentTimezone: CanadianTimezone): string {
  const localDateTime = utcToLocalTime(utcISO, agentTimezone);
  
  const hours = localDateTime.hour;
  const minutes = localDateTime.minute;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
}
