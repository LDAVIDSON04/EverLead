-- Fix search_path security issue for update_updated_at_column function
-- This migration addresses Supabase security issue: Function has a role mutable search_path

-- Drop and recreate the function with a fixed search_path
-- Setting search_path to empty string requires fully qualified names, making it secure
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to update updated_at timestamp. Uses fixed search_path for security.';

