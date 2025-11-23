-- Add latitude and longitude to leads table for distance-based filtering
-- This allows calculating distance between agent location and lead location

DO $$
BEGIN
  -- Add latitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN latitude numeric(10, 8);
  END IF;

  -- Add longitude
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN longitude numeric(11, 8);
  END IF;
END $$;

