-- Migration: Add 'no_show' and 'booked' status to appointments table
-- This allows appointments to be marked as 'no_show' and 'booked' in addition to the existing statuses

-- Check if appointment_status enum exists and add missing values
DO $$
DECLARE
  enum_oid oid;
BEGIN
  -- Check if appointment_status enum exists
  SELECT oid INTO enum_oid FROM pg_type WHERE typname = 'appointment_status';
  
  IF enum_oid IS NOT NULL THEN
    -- Add 'no_show' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'no_show' 
      AND enumtypid = enum_oid
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'no_show';
    END IF;
    
    -- Add 'booked' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'booked' 
      AND enumtypid = enum_oid
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'booked';
    END IF;
    
    RAISE NOTICE 'Added no_show and booked to appointment_status enum';
  ELSE
    -- If no enum exists, check if there's a check constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'appointments_status_check'
      AND table_name = 'appointments'
      AND table_schema = 'public'
    ) THEN
      -- Drop the existing check constraint
      ALTER TABLE public.appointments
      DROP CONSTRAINT IF EXISTS appointments_status_check;

      -- Add the new check constraint that includes 'no_show' and 'booked'
      ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked'));
      
      RAISE NOTICE 'Updated check constraint to include no_show and booked';
    END IF;
  END IF;
END $$;
