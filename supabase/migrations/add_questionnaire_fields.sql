-- Add questionnaire fields to leads table
-- This migration adds all the fields needed for the "Get Started" questionnaire

-- Add first_name and last_name (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'first_name') THEN
    ALTER TABLE public.leads ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'last_name') THEN
    ALTER TABLE public.leads ADD COLUMN last_name text;
  END IF;
END $$;

-- Add address_line1 (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'address_line1') THEN
    ALTER TABLE public.leads ADD COLUMN address_line1 text;
  END IF;
END $$;

-- Add age (integer, nullable)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'age') THEN
    ALTER TABLE public.leads ADD COLUMN age integer;
  END IF;
END $$;

-- Add sex (text, nullable)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'sex') THEN
    ALTER TABLE public.leads ADD COLUMN sex text;
  END IF;
END $$;

-- Ensure city, province, postal_code exist (they probably do, but check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'city') THEN
    ALTER TABLE public.leads ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'province') THEN
    ALTER TABLE public.leads ADD COLUMN province text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'postal_code') THEN
    ALTER TABLE public.leads ADD COLUMN postal_code text;
  END IF;
END $$;

-- Ensure planning_for, service_type, timeline_intent exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'planning_for') THEN
    ALTER TABLE public.leads ADD COLUMN planning_for text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'service_type') THEN
    ALTER TABLE public.leads ADD COLUMN service_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'leads' 
                 AND column_name = 'timeline_intent') THEN
    ALTER TABLE public.leads ADD COLUMN timeline_intent text;
  END IF;
END $$;

