-- Migration: Add planning_for_name and planning_for_age columns to leads table
-- These fields store information about the person being planned for when planning_for is spouse_partner, parent, or other_family

DO $$
BEGIN
  -- Add planning_for_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'planning_for_name'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN planning_for_name text NULL;
    
    RAISE NOTICE 'Added planning_for_name column to leads table';
  ELSE
    RAISE NOTICE 'planning_for_name column already exists in leads table';
  END IF;

  -- Add planning_for_age column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'planning_for_age'
  ) THEN
    ALTER TABLE public.leads
    ADD COLUMN planning_for_age integer NULL;
    
    RAISE NOTICE 'Added planning_for_age column to leads table';
  ELSE
    RAISE NOTICE 'planning_for_age column already exists in leads table';
  END IF;
END $$;

