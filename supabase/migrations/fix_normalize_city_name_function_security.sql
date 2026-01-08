-- Fix security issue: Drop unused normalize_city_name function
-- This function is no longer used after removing city normalization logic
-- and has a mutable search_path security vulnerability

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.normalize_city_name(text);

COMMENT ON SCHEMA public IS 'Removed normalize_city_name function - no longer needed after reverting city normalization changes.';
