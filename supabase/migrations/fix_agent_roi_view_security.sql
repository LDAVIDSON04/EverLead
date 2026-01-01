-- Fix agent_roi view security: Change from SECURITY DEFINER to SECURITY INVOKER
-- This migration addresses Supabase security issue: View public.agent_roi is defined with the SECURITY DEFINER property
--
-- IMPORTANT: This migration uses a DO block to dynamically get the view definition and recreate it.
-- If the view doesn't exist or you want to drop it entirely, you can modify this migration.

DO $$
DECLARE
  view_definition text;
BEGIN
  -- Get the current view definition
  SELECT pg_get_viewdef('public.agent_roi'::regclass, true) INTO view_definition;
  
  -- If view exists, drop it and recreate with SECURITY INVOKER
  IF view_definition IS NOT NULL THEN
    -- Drop the existing view
    EXECUTE 'DROP VIEW IF EXISTS public.agent_roi CASCADE';
    
    -- Recreate with SECURITY INVOKER instead of SECURITY DEFINER
    -- SECURITY INVOKER uses the querying user's permissions, which respects RLS policies
    -- This is safer than SECURITY DEFINER which runs with the view creator's permissions
    EXECUTE format('CREATE VIEW public.agent_roi WITH (security_invoker = true) AS %s', view_definition);
    
    -- Add comment
    EXECUTE 'COMMENT ON VIEW public.agent_roi IS ''Agent ROI calculations. Recreated with SECURITY INVOKER to respect RLS policies.''';
    
    RAISE NOTICE 'View agent_roi recreated with SECURITY INVOKER';
  ELSE
    RAISE NOTICE 'View agent_roi does not exist, nothing to do';
  END IF;
END $$;

