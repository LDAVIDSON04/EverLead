-- Add new questionnaire fields to leads table
-- Migration: Add remains_disposition, service_celebration, family_pre_arranged

DO $$
BEGIN
  -- Add remains_disposition column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'remains_disposition'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN remains_disposition text;
  END IF;

  -- Add service_celebration column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'service_celebration'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN service_celebration text;
  END IF;

  -- Add family_pre_arranged column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'family_pre_arranged'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN family_pre_arranged text;
  END IF;
END $$;

