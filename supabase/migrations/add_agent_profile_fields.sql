-- Add profile fields for agents (profile picture, job title, etc.)
-- These fields will be used in the "Let's get started" onboarding flow

DO $$ 
BEGIN
  -- Add profile_picture_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN profile_picture_url text NULL;
  END IF;

  -- Add job_title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN job_title text NULL;
  END IF;

  -- Add onboarding_completed column to track if "Let's get started" has been completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to the agent/specialist profile picture';
COMMENT ON COLUMN profiles.job_title IS 'Job title or role name (e.g., "Funeral Director", "Pre-need Specialist")';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the agent has completed the "Let''s get started" onboarding flow';

