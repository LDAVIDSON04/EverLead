-- Add profile bio fields for AI-generated bios
-- This migration adds structured inputs and AI-generated bio fields

DO $$ 
BEGIN
  -- Add years_of_experience column (stored in metadata JSON, but we'll add a column for easier querying)
  -- Actually, we'll store structured inputs in metadata JSON for flexibility
  
  -- Add bio_approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio_approval_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio_approval_status text DEFAULT 'pending';
    COMMENT ON COLUMN public.profiles.bio_approval_status IS 'Status of bio approval: pending, approved, rejected';
  END IF;
  
  -- Add ai_generated_bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'ai_generated_bio'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ai_generated_bio text;
    COMMENT ON COLUMN public.profiles.ai_generated_bio IS 'AI-generated bio text (locked after approval)';
  END IF;
  
  -- Add bio_last_updated column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio_last_updated'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio_last_updated timestamptz;
    COMMENT ON COLUMN public.profiles.bio_last_updated IS 'Timestamp when bio was last updated';
  END IF;
  
  -- Add bio_audit_log column (JSON array to track changes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'bio_audit_log'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN bio_audit_log jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.profiles.bio_audit_log IS 'Audit log of bio changes (JSON array)';
  END IF;
END $$;

-- Create index for querying pending bios
CREATE INDEX IF NOT EXISTS idx_profiles_bio_approval_status 
ON public.profiles(bio_approval_status) 
WHERE bio_approval_status = 'pending';

-- Note: Structured bio inputs (years_of_experience, specialties, practice_philosophy, etc.)
-- will be stored in the metadata JSON field for flexibility
