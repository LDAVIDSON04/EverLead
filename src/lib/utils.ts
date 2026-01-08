import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get timezone abbreviation (e.g., EST, PST) for a given timezone name (e.g., America/Toronto)
 * @param timezone IANA timezone name (e.g., "America/Toronto")
 * @returns Timezone abbreviation (e.g., "EST", "PST")
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = DateTime.now().setZone(timezone);
    // Use Luxon's offsetNameShort which returns abbreviations like "EST", "PST"
    return now.offsetNameShort || timezone.split('/').pop()?.slice(0, 3).toUpperCase() || '';
  } catch (error) {
    console.error('Error getting timezone abbreviation:', error);
    return '';
  }
}

/**
 * Format a UTC ISO string to display in agent's timezone with abbreviation
 * @param isoString UTC ISO string
 * @param agentTimezone Agent's timezone (e.g., "America/Toronto")
 * @returns Formatted time string with timezone abbreviation (e.g., "9:00 AM EST")
 */
export function formatTimeWithTimezone(isoString: string, agentTimezone: string): string {
  try {
    const utcTime = DateTime.fromISO(isoString, { zone: 'utc' });
    const agentLocalTime = utcTime.setZone(agentTimezone);
    
    const hours = agentLocalTime.hour;
    const minutes = agentLocalTime.minute;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    
    const tzAbbrev = getTimezoneAbbreviation(agentTimezone);
    
    return tzAbbrev ? `${timeStr} ${tzAbbrev}` : timeStr;
  } catch (error) {
    console.error('Error formatting time with timezone:', error);
    // Fallback to simple formatting
    const date = new Date(isoString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }
}
