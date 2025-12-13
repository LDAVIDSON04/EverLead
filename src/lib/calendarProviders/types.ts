// src/lib/calendarProviders/types.ts
// Shared types for calendar providers

export type CalendarConnection = {
  id: string;
  specialist_id: string;
  provider: "google" | "microsoft";
  external_calendar_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  sync_enabled: boolean;
};

