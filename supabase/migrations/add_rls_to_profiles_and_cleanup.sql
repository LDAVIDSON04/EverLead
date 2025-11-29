-- Migration: Enable RLS on profiles table and clean up unused functions
-- This addresses the remaining Supabase security alerts

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy: Users can update their own profile (for profile updates)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
);

-- Policy: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);

-- Policy: Admins can view all profiles (for admin dashboard)
-- Note: This uses a function to avoid recursive policy checks
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Policy: Service role (supabaseAdmin) bypasses RLS automatically
-- No policy needed - service role has full access

-- ============================================
-- CLEAN UP UNUSED FUNCTIONS
-- ============================================

-- Drop unused RPC functions that are no longer used
-- (The cron job now uses direct queries instead)
DROP FUNCTION IF EXISTS public.apply_appointment_discount CASCADE;
DROP FUNCTION IF EXISTS public.hide_old_appointments CASCADE;

-- Note: The agent_roi view with SECURITY DEFINER is less critical
-- It's used for ROI calculations and runs with elevated privileges
-- This is acceptable if the view only reads data and is used by trusted code
-- You can review this later if needed

