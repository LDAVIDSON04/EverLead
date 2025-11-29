-- Migration: Fix profiles RLS policies to allow login/signup to work
-- This fixes the issue where users can't log in after RLS was enabled

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy: Users can update their own profile
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

-- Policy: Users can insert their own profile (during signup via API)
-- Note: Signup uses supabaseAdmin which bypasses RLS, but this is for safety
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);

-- Policy: Admins can view all profiles
-- Use a separate check to avoid recursion issues
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Check if current user is an admin by looking up their profile
  -- Use a subquery to avoid recursion
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

