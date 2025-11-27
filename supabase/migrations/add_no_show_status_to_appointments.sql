-- Add 'no_show' and 'booked' status to appointments table
-- Handle both enum type and CHECK constraint cases

DO $$
BEGIN
  -- Check if appointment_status enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'appointment_status'
  ) THEN
    -- It's using an enum type - add new values
    RAISE NOTICE 'Found appointment_status enum type, adding new values...';
    
    -- Add 'no_show' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'no_show' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'no_show';
      RAISE NOTICE 'Added no_show to enum';
    END IF;
    
    -- Add 'booked' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'booked' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'booked';
      RAISE NOTICE 'Added booked to enum';
    END IF;
    
    -- Add 'confirmed' if it doesn't exist (since error suggests it's missing)
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'confirmed' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'confirmed';
      RAISE NOTICE 'Added confirmed to enum';
    END IF;
  ELSE
    -- It's using a CHECK constraint - update it
    RAISE NOTICE 'Using CHECK constraint, updating...';
    
    -- Drop existing constraint if it exists
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    
    -- Add new constraint with all statuses including 'no_show' and 'booked'
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked'));
    
    RAISE NOTICE 'Updated CHECK constraint';
  END IF;
END $$;
