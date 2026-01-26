-- Prevent duplicate SMS reminders: track when 1h (in-person) and 10m (video) reminders were sent.
-- Send-reminders cron runs periodically; without this, the same appointment gets multiple texts.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_10m_sent_at timestamptz;

COMMENT ON COLUMN public.appointments.reminder_1h_sent_at IS 'Set when in-person 1-hour-before SMS reminder was sent (avoids duplicate texts)';
COMMENT ON COLUMN public.appointments.reminder_10m_sent_at IS 'Set when video 10-min-before SMS reminder was sent (avoids duplicate texts)';
