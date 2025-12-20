-- Create external_events table for storing calendar events from Google and Microsoft
-- This table stores events fetched from external calendars for two-way sync

CREATE TABLE IF NOT EXISTS public.external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Link to specialist/agent (using specialist_id to match calendar_connections table)
  specialist_id UUID NOT NULL,
  
  -- Calendar provider (google or microsoft)
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  
  -- External calendar event ID from the provider
  provider_event_id TEXT NOT NULL,
  
  -- Event timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  
  -- Event status
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
  
  -- Link to Soradin appointment if this event was created by Soradin
  appointment_id UUID NULL,
  is_soradin_created BOOLEAN NOT NULL DEFAULT false,
  
  -- Unique constraint: one event per specialist/provider/event_id combination
  CONSTRAINT unique_external_event UNIQUE (specialist_id, provider, provider_event_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_external_events_specialist_provider 
  ON public.external_events(specialist_id, provider);

CREATE INDEX IF NOT EXISTS idx_external_events_appointment_id 
  ON public.external_events(appointment_id) 
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_external_events_starts_at 
  ON public.external_events(starts_at);

CREATE INDEX IF NOT EXISTS idx_external_events_ends_at 
  ON public.external_events(ends_at);

-- Create index for time range queries (used in sync job)
CREATE INDEX IF NOT EXISTS idx_external_events_time_range 
  ON public.external_events(starts_at, ends_at);

-- Enable RLS
ALTER TABLE public.external_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything (for API routes using supabaseAdmin)
CREATE POLICY "Service role can manage external events"
  ON public.external_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Specialists can view their own external events
CREATE POLICY "Specialists can view their own external events"
  ON public.external_events
  FOR SELECT
  TO authenticated
  USING (
    specialist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE public.external_events IS 'Stores calendar events fetched from Google and Microsoft calendars for two-way sync';
