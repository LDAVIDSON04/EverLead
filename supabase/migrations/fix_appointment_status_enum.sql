-- Migration: Fix appointment_status enum to include all necessary values
-- This ensures 'cancelled', 'no_show', and 'booked' are all available

DO $$
DECLARE
  enum_oid oid;
  existing_values text[];
BEGIN
  -- Check if appointment_status enum exists
  SELECT oid INTO enum_oid FROM pg_type WHERE typname = 'appointment_status';
  
  IF enum_oid IS NOT NULL THEN
    -- Get existing enum values
    SELECT array_agg(enumlabel::text ORDER BY enumsortorder) INTO existing_values
    FROM pg_enum
    WHERE enumtypid = enum_oid;
    
    RAISE NOTICE 'Existing appointment_status enum values: %', array_to_string(existing_values, ', ');
    
    -- Add 'cancelled' if it doesn't exist (check for both spellings)
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel IN ('cancelled', 'canceled')
      AND enumtypid = enum_oid
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'cancelled';
      RAISE NOTICE 'Added cancelled to enum';
    END IF;
    
    -- Add 'no_show' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'no_show' 
      AND enumtypid = enum_oid
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'no_show';
      RAISE NOTICE 'Added no_show to enum';
    END IF;
    
    -- Add 'booked' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'booked' 
      AND enumtypid = enum_oid
    ) THEN
      ALTER TYPE appointment_status ADD VALUE 'booked';
      RAISE NOTICE 'Added booked to enum';
    END IF;
    
  ELSE
    RAISE NOTICE 'No appointment_status enum found - using CHECK constraint instead';
  END IF;
END $$;

