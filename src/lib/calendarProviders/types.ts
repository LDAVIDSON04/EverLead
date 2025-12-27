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
  // Webhook fields (optional, may be null if webhook not set up)
  webhook_channel_id?: string | null; // Google Calendar webhook channel ID
  webhook_resource_id?: string | null; // Google Calendar webhook resource ID
  webhook_subscription_id?: string | null; // Microsoft Calendar webhook subscription ID
  webhook_expires_at?: string | null; // When the webhook subscription expires
};

