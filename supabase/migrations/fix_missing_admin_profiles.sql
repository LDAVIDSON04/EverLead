-- Migration: Fix missing admin profiles
-- This helps ensure admin users have profiles in the database
-- Run this if an admin user exists in auth.users but not in profiles

-- First, let's see which auth users don't have profiles
-- (This is just for reference - we'll create profiles for admins)

-- Note: This migration doesn't automatically create profiles because we need
-- to know which users should be admins. Instead, it provides a function to help.

-- Function to create admin profile if missing
CREATE OR REPLACE FUNCTION public.ensure_admin_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT 'Admin User'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Create profile with admin role
    INSERT INTO public.profiles (id, role, full_name, email, approval_status)
    VALUES (user_id, 'admin', user_name, user_email, 'approved')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', approval_status = 'approved';
    RETURN TRUE;
  ELSE
    -- Profile exists, ensure it's set to admin
    UPDATE public.profiles
    SET role = 'admin', approval_status = 'approved'
    WHERE id = user_id AND role != 'admin';
    RETURN TRUE;
  END IF;
END;
$$;

-- Example usage (replace with actual user ID and email):
-- SELECT public.ensure_admin_profile(
--   'YOUR_USER_UUID_HERE',
--   'admin@soradin.com',
--   'Admin Name'
-- );
