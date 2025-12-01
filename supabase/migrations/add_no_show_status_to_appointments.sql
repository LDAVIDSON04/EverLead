-- Migration: Add 'no_show' and 'booked' status to appointments table
-- This allows appointments to be marked as 'no_show' and 'booked' in addition to the existing statuses

-- First, check if we're using an enum type or a check constraint
-- If using enum, we need to alter the enum type
DO $$
BEGIN
  -- Check if appointment_status enum exists
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'appointment_status'
  ) THEN
    -- Add new values to the enum if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'no_show' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'no_show';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'booked' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
      ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'booked';
    END IF;
  ELSE
    -- If no enum exists, check if there's a check constraint
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'appointments_status_check'
      AND table_name = 'appointments'
    ) THEN
      -- Drop the existing check constraint
      ALTER TABLE public.appointments
      DROP CONSTRAINT IF EXISTS appointments_status_check;

      -- Add the new check constraint that includes 'no_show' and 'booked'
      ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'booked'));
    END IF;
  END IF;
END $$;
