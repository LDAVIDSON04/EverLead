-- Add metadata JSONB column to profiles table for storing additional settings
-- This allows storing license_number, regions_served, specialty, business_address, etc.

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON public.profiles USING gin (metadata);

COMMENT ON COLUMN public.profiles.metadata IS 'JSONB field for storing additional profile settings like license_number, regions_served, specialty, business_address, availability settings, and notification preferences';
