-- Migration: Add 'expired' status to appointments table
-- This allows appointments to be marked as expired when they're older than 24 hours and still pending

DO $$
BEGIN
  -- Check if appointment_status enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'appointment_status'
  ) THEN
    -- It's using an enum type - add 'expired' value
    RAISE NOTICE 'Found appointment_status enum type, adding expired value...';
    
    -- Add 'expired' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'expired' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'expired';
      RAISE NOTICE 'Added expired to enum';
    END IF;
  ELSE
    -- It's using a CHECK constraint - update it
    RAISE NOTICE 'Using CHECK constraint, updating to include expired...';
    
    -- Drop existing constraint if it exists
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    
    -- Add new constraint with all statuses including 'expired'
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked', 'expired'));
    
    RAISE NOTICE 'Updated CHECK constraint to include expired';
  END IF;
END $$;

