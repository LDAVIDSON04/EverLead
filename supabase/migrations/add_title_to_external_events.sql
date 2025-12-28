-- Add title column to external_events table to store the actual event title/subject
ALTER TABLE public.external_events
ADD COLUMN IF NOT EXISTS title TEXT NULL;

-- Create an index on the title column for faster lookups (optional, but helpful)
CREATE INDEX IF NOT EXISTS idx_external_events_title
ON public.external_events(title)
WHERE title IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.external_events.title IS 'Title/subject of the external calendar event (e.g., "Team Meeting", "Client Call"). Extracted from Google Calendar summary or Microsoft Calendar subject.';

