-- Migration: Ensure additional_notes column exists on leads table
-- Date: 2025-01-XX
-- Description: Add mandatory additional_notes field for questionnaire

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name = 'additional_notes'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN additional_notes text;
  END IF;
END $$;

