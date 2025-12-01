-- Migration: Add completed_at column to appointments table if it doesn't exist
-- This column is used to track when an appointment was completed

DO $$
BEGIN
  -- Check if completed_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'completed_at'
  ) THEN
    -- Add the column
    ALTER TABLE public.appointments
    ADD COLUMN completed_at timestamptz NULL;
    
    RAISE NOTICE 'Added completed_at column to appointments table';
  ELSE
    RAISE NOTICE 'completed_at column already exists in appointments table';
  END IF;
END $$;

