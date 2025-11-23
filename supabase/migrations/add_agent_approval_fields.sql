-- Migration: Add agent approval fields to profiles table
-- This adds fields for agent signup and approval workflow

DO $$
BEGIN
  -- Add phone number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;

  -- Add funeral home or agency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'funeral_home'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN funeral_home text;
  END IF;

  -- Add licensed in province (yes/no)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'licensed_in_province'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN licensed_in_province boolean;
  END IF;

  -- Add licensed funeral director (yes/no)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'licensed_funeral_director'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN licensed_funeral_director boolean;
  END IF;

  -- Add approval status (pending, approved, declined)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approval_status text DEFAULT 'pending';
  END IF;

  -- Add approval notes (for admin to add notes when approving/declining)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approval_notes'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approval_notes text;
  END IF;

  -- Add approved_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_at timestamptz;
  END IF;

  -- Add approved_by (admin user id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_by uuid;
  END IF;
END $$;

-- Set existing agents to approved (so they don't lose access)
UPDATE public.profiles
SET approval_status = 'approved'
WHERE role = 'agent' AND (approval_status IS NULL OR approval_status = 'pending');

