-- Fix search_path security issue for is_admin function
-- This migration addresses Supabase security issue: Function has a role mutable search_path
--
-- The is_admin function uses SECURITY DEFINER, which means it runs with the privileges
-- of the function owner. Without a fixed search_path, an attacker could potentially
-- manipulate the search_path to execute code in a different schema context.
--
-- Solution: Set a fixed search_path. Since the function already uses fully qualified
-- names (public.profiles), we can safely set search_path to empty string or public.
-- Using empty string is the most secure as it forces fully qualified names.

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user is an admin. Uses fixed search_path for security.';

