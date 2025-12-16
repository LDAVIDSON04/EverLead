-- Add missing columns to profiles table
-- This migration adds columns that are needed for the agent settings page

DO $$ 
BEGIN
  -- Add job_title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'job_title'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN job_title text;
    COMMENT ON COLUMN public.profiles.job_title IS 'Professional title or job title of the user';
  END IF;
  
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN first_name text;
    COMMENT ON COLUMN public.profiles.first_name IS 'First name of the user';
  END IF;
  
  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_name text;
    COMMENT ON COLUMN public.profiles.last_name IS 'Last name of the user';
  END IF;
  
  -- Add profile_picture_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN profile_picture_url text;
    COMMENT ON COLUMN public.profiles.profile_picture_url IS 'URL to the user profile picture';
  END IF;
  
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
    COMMENT ON COLUMN public.profiles.phone IS 'Phone number of the user';
  END IF;
  
  -- Add funeral_home column if it doesn't exist (might be called business_name in some schemas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'funeral_home'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN funeral_home text;
    COMMENT ON COLUMN public.profiles.funeral_home IS 'Business or funeral home name';
  END IF;
  
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
    COMMENT ON COLUMN public.profiles.email IS 'Email address of the user';
  END IF;
END $$;
