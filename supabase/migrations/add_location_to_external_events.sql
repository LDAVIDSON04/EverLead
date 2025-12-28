-- Add location field to external_events table to support location-aware blocking
-- This allows external calendar events to only block availability for the matching city

ALTER TABLE public.external_events 
ADD COLUMN IF NOT EXISTS location TEXT NULL;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_external_events_location 
  ON public.external_events(location) 
  WHERE location IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.external_events.location IS 'City/location extracted from external calendar event. Used to only block availability for matching location.';

