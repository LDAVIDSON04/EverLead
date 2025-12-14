-- Add specialist approval workflow
-- Creates specialist_status enum and adds approval columns to specialists table

-- Create specialist_status enum
DO $$ 
BEGIN
  CREATE TYPE specialist_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column (default 'pending')
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'specialists' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE specialists 
    ADD COLUMN status specialist_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Add approved_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'specialists' 
      AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE specialists 
    ADD COLUMN approved_at timestamptz NULL;
  END IF;
END $$;

-- Add rejected_reason column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'specialists' 
      AND column_name = 'rejected_reason'
  ) THEN
    ALTER TABLE specialists 
    ADD COLUMN rejected_reason text NULL;
  END IF;
END $$;

-- Add certification_details column for credentials
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'specialists' 
      AND column_name = 'certification_details'
  ) THEN
    ALTER TABLE specialists 
    ADD COLUMN certification_details text NULL;
  END IF;
END $$;

-- Set existing active specialists to 'approved'
UPDATE specialists 
SET 
  status = 'approved',
  approved_at = now()
WHERE is_active = true 
  AND status = 'pending'
  AND approved_at IS NULL;

-- Add comment explaining the relationship between status and is_active
COMMENT ON COLUMN specialists.status IS 'Approval status: pending (under review), approved (can receive bookings), rejected (application denied). status = approved AND is_active = true means the specialist is live and can receive bookings. status != approved OR is_active = false means they should NOT appear in search or be bookable.';
COMMENT ON COLUMN specialists.approved_at IS 'Timestamp when the specialist application was approved';
COMMENT ON COLUMN specialists.rejected_reason IS 'Reason provided when application is rejected';
COMMENT ON COLUMN specialists.certification_details IS 'Details about certifications, licenses, or credentials submitted by the specialist';

