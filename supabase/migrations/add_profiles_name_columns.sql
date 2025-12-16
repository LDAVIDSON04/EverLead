-- Add first_name and last_name columns to profiles table if they don't exist
-- This migration ensures the profiles table has the necessary name columns

DO $$ 
BEGIN
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN first_name text;
  END IF;
  
  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.first_name IS 'First name of the user';
COMMENT ON COLUMN public.profiles.last_name IS 'Last name of the user';
