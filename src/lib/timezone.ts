// src/lib/timezone.ts
// Helper to determine IANA timezone based on lead's province/state

export function getTimezoneForLead(lead: { province?: string | null; country?: string | null }): string {
  // Very simple mapping for now – expand later as needed
  const province = (lead.province || '').toLowerCase().trim();

  // Canadian provinces
  if (province === 'bc' || province === 'british columbia') return 'America/Vancouver';
  if (province === 'ab' || province === 'alberta') return 'America/Edmonton';
  if (province === 'sk' || province === 'saskatchewan') return 'America/Regina';
  if (province === 'mb' || province === 'manitoba') return 'America/Winnipeg';
  if (province === 'on' || province === 'ontario') return 'America/Toronto';
  if (province === 'qc' || province === 'quebec') return 'America/Toronto';
  if (province === 'nb' || province === 'new brunswick') return 'America/Moncton';
  if (province === 'ns' || province === 'nova scotia') return 'America/Halifax';
  if (province === 'pe' || province === 'prince edward island') return 'America/Halifax';
  if (province === 'nl' || province === 'newfoundland' || province === 'newfoundland and labrador') return 'America/St_Johns';
  if (province === 'yt' || province === 'yukon') return 'America/Whitehorse';
  if (province === 'nt' || province === 'northwest territories') return 'America/Yellowknife';
  if (province === 'nu' || province === 'nunavut') return 'America/Iqaluit';

  // US states (common ones)
  if (province === 'wa' || province === 'washington') return 'America/Los_Angeles';
  if (province === 'or' || province === 'oregon') return 'America/Los_Angeles';
  if (province === 'ca' || province === 'california') return 'America/Los_Angeles';
  if (province === 'ny' || province === 'new york') return 'America/New_York';
  if (province === 'tx' || province === 'texas') return 'America/Chicago';
  if (province === 'fl' || province === 'florida') return 'America/New_York';

  // Fallback – safe default
  return 'America/Edmonton';
}

