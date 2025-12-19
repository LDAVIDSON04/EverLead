-- Backfill confirmed_at for existing appointments that don't have it
-- This helps with conflict detection for appointments created before confirmed_at was being set
-- For appointments without confirmed_at, we'll use created_at as a proxy (only for very recent ones)

-- Note: This migration doesn't actually backfill, it just ensures the column exists
-- The application logic handles appointments without confirmed_at by not blocking them
-- (since we can't be sure which exact slot was booked)

-- Verify confirmed_at column exists (it should from create_appointments_table.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN confirmed_at timestamptz;
  END IF;
END $$;

-- Add index for faster conflict detection queries
CREATE INDEX IF NOT EXISTS idx_appointments_confirmed_at ON public.appointments(confirmed_at) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_agent_date_confirmed ON public.appointments(agent_id, requested_date, confirmed_at) WHERE confirmed_at IS NOT NULL;
