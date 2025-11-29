-- TEMPORARY FIX: Disable RLS on profiles to allow login
-- Run this immediately to restore login functionality
-- We'll fix the policies properly after

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

